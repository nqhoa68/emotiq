import pandas as pd
import io
from config.settings import ASPECT_COLS, STAR_DESC
from services.inference import SentimentPredictor

class InferenceService:
    def __init__(self):
        self.predictor = None

    def _get_predictor(self) -> SentimentPredictor:
        if self.predictor is None:
            self.predictor = SentimentPredictor()
        return self.predictor

    def analyze_review(self, text: str) -> dict:
        predictor = self._get_predictor()
        cleaned_input, aspect_probs, sentiment_preds = predictor.predict(text)
        
        results = []
        for idx, aspect_name in enumerate(ASPECT_COLS):
            prob = float(aspect_probs[idx])
            
            # Ngưỡng threshold quyết định sự tồn tại là >= 0.5
            if prob >= 0.5:
                star = int(sentiment_preds[idx])
                star_desc = STAR_DESC.get(star, "")
                results.append({
                    "aspect": aspect_name,
                    "probability": prob,
                    "star": star,
                    "description": star_desc
                })
                
        return {
            "cleaned_input": cleaned_input,
            "aspects": results
        }

    def analyze_batch(self, file_content: bytes) -> dict:
        df = pd.read_csv(io.BytesIO(file_content), encoding="utf-8-sig")
        
        # Detect optional timestamp column (CSV loại 2: id, timestamp, review)
        timestamp_col = None
        for col in df.columns:
            if str(col).strip().lower() == "timestamp":
                timestamp_col = col
                break

        # Detect text column
        text_col = None
        for col in df.columns:
            if col.lower() in ["review", "comment", "text", "noi_dung", "nội dung"]:
                text_col = col
                break
        if not text_col:
            # Fallback to the first string/object column
            for col in df.columns:
                if col == timestamp_col:
                    continue
                if df[col].dtype == object or df[col].dtype == "string":
                    text_col = col
                    break
        
        if not text_col:
            raise ValueError("Không tìm thấy cột chứa văn bản (review) trong file CSV.")

        # Drop NaN/empty
        df = df.dropna(subset=[text_col])
        df = df[df[text_col].str.strip() != ""]
        
        total_processed = len(df)
        items = []
        aspect_counts = {aspect: 0 for aspect in ASPECT_COLS}
        aspect_stars = {aspect: [] for aspect in ASPECT_COLS}
        positive_count = 0
        negative_count = 0
        
        # Gom tất cả text để chạy batch
        all_texts = df[text_col].astype(str).tolist()
        all_timestamps = (
            [None if pd.isna(v) else str(v) for v in df[timestamp_col].tolist()]
            if timestamp_col is not None else None
        )
        
        predictor = self._get_predictor()
        # Chạy dự đoán hàng loạt với ZeroGPU
        all_cleaned_inputs, all_aspect_probs, all_sentiment_preds = predictor.predict_batch(all_texts, batch_size=64)
        
        # Lắp ghép lại kết quả cho từng câu
        for i, original_text in enumerate(all_texts):
            aspect_probs = all_aspect_probs[i]
            sentiment_preds = all_sentiment_preds[i]
            
            results = []
            for a_idx, aspect_name in enumerate(ASPECT_COLS):
                prob = float(aspect_probs[a_idx])
                if prob >= 0.5:
                    star = int(sentiment_preds[a_idx])
                    star_desc = STAR_DESC.get(star, "")
                    results.append({
                        "aspect": aspect_name,
                        "probability": prob,
                        "star": star,
                        "description": star_desc
                    })
            
            item = {
                "original_text": original_text,
                "aspects": results
            }
            if all_timestamps is not None and all_timestamps[i]:
                item["timestamp"] = all_timestamps[i]
            items.append(item)
            
            # Cập nhật số liệu thống kê summary
            for aspect_result in results:
                aspect_name = aspect_result["aspect"]
                star = aspect_result["star"]
                aspect_counts[aspect_name] += 1
                aspect_stars[aspect_name].append(star)
                
                if star >= 4:
                    positive_count += 1
                elif star <= 2:
                    negative_count += 1                    
        summary = {
            "aspect_counts": aspect_counts,
            "aspect_avg_stars": {
                aspect: round(sum(stars) / len(stars), 1) if stars else 0.0 
                for aspect, stars in aspect_stars.items()
            },
            "positive_aspects": positive_count,
            "negative_aspects": negative_count
        }

        return {
            "total_processed": total_processed,
            "summary": summary,
            "items": items
        }

inference_service = InferenceService()
