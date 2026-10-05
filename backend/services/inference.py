import os
import torch
import spaces
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download

from config.settings import MODEL_NAME, HF_MODEL_REPO, HF_WEIGHTS_FILENAME, MAX_LENGTH, ASPECT_COLS
from core.model import SharedEncoderMultiClassModel
from core.preprocessor import preprocess_text

class SentimentPredictor:
    """
    Lớp đóng gói logic suy luận (inference) cho mô hình phân tích cảm xúc.
    Tải trực tiếp trọng số từ Hugging Face Model Hub.
    """
    def __init__(self):
        # KHÔNG khởi tạo trên cuda ở đây để tương thích ZeroGPU.
        self.device = torch.device("cpu")
        print(f"📦 Môi trường phần cứng khởi tạo (ZeroGPU): {self.device}")
        
        print("⏳ Đang tải bộ mã hóa Tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        
        print(f"⏳ Đang tải file trọng số từ HF Hub ({HF_MODEL_REPO}/{HF_WEIGHTS_FILENAME})...")
        try:
            # hf_hub_download sẽ tải file về cache cục bộ của container (chỉ tải 1 lần đầu)
            weights_path = hf_hub_download(repo_id=HF_MODEL_REPO, filename=HF_WEIGHTS_FILENAME)
        except Exception as e:
            raise FileNotFoundError(f"❌ LỖI tải file từ Hugging Face Hub: {e}")
            
        self.model = SharedEncoderMultiClassModel(MODEL_NAME, num_aspects=len(ASPECT_COLS))
        print("⏳ Đang nạp trọng số vào mô hình trên CPU...")
        self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        
    @spaces.GPU(duration=5)
    def predict(self, text: str):
        """
        Dự đoán khía cạnh và mức độ cảm xúc từ câu đầu vào (Single).
        """
        self.model.to("cuda")
        cleaned_input = preprocess_text(text)
        
        enc = self.tokenizer(
            cleaned_input, 
            max_length=MAX_LENGTH, 
            padding="max_length", 
            truncation=True, 
            return_tensors="pt"
        )
        input_ids = enc["input_ids"].to("cuda")
        attention_mask = enc["attention_mask"].to("cuda")
        
        # Sử dụng inference_mode thay cho no_grad để tối ưu C++
        with torch.inference_mode():
            aspect_logits, sentiment_logits = self.model(input_ids, attention_mask)
            
            aspect_probs = torch.sigmoid(aspect_logits).squeeze(0).cpu().tolist()
            sentiment_preds = (torch.argmax(sentiment_logits, dim=-1).squeeze(0).cpu().numpy() + 1).tolist()
            
        return cleaned_input, aspect_probs, sentiment_preds

    @spaces.GPU(duration=20)
    def predict_batch(self, texts: list[str], batch_size: int = 64):
        """
        Dự đoán hàng loạt (batching) để tránh OOM và Timeout trên ZeroGPU.
        """
        self.model.to("cuda")
        
        # Pha 1: Tiền xử lý tất cả text trên CPU
        all_cleaned_inputs = [preprocess_text(str(text)) for text in texts]
        all_aspect_probs = []
        all_sentiment_preds = []
        
        # Pha 2: Chạy mini-batch trên GPU
        with torch.inference_mode():
            for i in range(0, len(all_cleaned_inputs), batch_size):
                batch_texts = all_cleaned_inputs[i : i + batch_size]
                
                enc = self.tokenizer(
                    batch_texts, 
                    max_length=MAX_LENGTH, 
                    padding="max_length", 
                    truncation=True, 
                    return_tensors="pt"
                )
                input_ids = enc["input_ids"].to("cuda")
                attention_mask = enc["attention_mask"].to("cuda")
                
                aspect_logits, sentiment_logits = self.model(input_ids, attention_mask)
                
                # Torch sigmoid and argmax (không có squeeze vì đây là batch)
                aspect_probs = torch.sigmoid(aspect_logits).cpu().tolist()
                sentiment_preds = (torch.argmax(sentiment_logits, dim=-1).cpu().numpy() + 1).tolist()
                
                all_aspect_probs.extend(aspect_probs)
                all_sentiment_preds.extend(sentiment_preds)
                
        return all_cleaned_inputs, all_aspect_probs, all_sentiment_preds
