import gradio as gr
from services.inference_service import inference_service
from services.llm_reply import generate_reply_for_review
from fastapi import HTTPException

def analyze_review_api(text: str):
    """
    Wrapper function cho tính năng phân tích 1 đánh giá.
    """
    if not text.strip():
        return {"error": "Nội dung không được để trống"}
    try:
        # Gọi thẳng vào service, bên trong sẽ gọi model đã bọc @spaces.GPU
        return inference_service.analyze_review(text)
    except Exception as e:
        return {"error": str(e)}

def analyze_batch_api(file_obj):
    """
    Wrapper function cho tính năng phân tích hàng loạt qua file CSV.
    """
    if file_obj is None:
        return {"error": "Vui lòng tải lên file CSV"}
    try:
        # Gradio File component truyền vào một file object (chứa đường dẫn tạm file)
        with open(file_obj.name, "rb") as f:
            content = f.read()
        return inference_service.analyze_batch(content)
    except Exception as e:
        return {"error": str(e)}

# Sử dụng thuần Gradio Blocks
def generate_reply_api(text: str, aspects: dict, api_key: str):
    """
    Wrapper function cho tính năng tạo phản hồi AI.
    """
    if not text.strip():
        return {"error": "Nội dung review không được để trống"}
    try:
        reply = generate_reply_for_review(text, aspects, api_key)
        return {"reply": reply}
    except HTTPException as e:
        return {"error": str(e.detail)}
    except Exception as e:
        return {"error": str(e)}

with gr.Blocks(title="ViABSA Backend API") as demo:
    gr.Markdown("# 🚀 ViABSA Tour Web - Backend API (Native Gradio)")
    gr.Markdown("Hệ thống ABSA sử dụng kiến trúc Queue Native của Gradio để tối ưu hóa ZeroGPU.")
    
    with gr.Tab("Single Analyze"):
        txt_input = gr.Textbox(label="Nội dung đánh giá", placeholder="Nhập review vào đây...")
        btn_analyze = gr.Button("Phân tích")
        json_output = gr.JSON(label="Kết quả")
        
        # Đăng ký API endpoint
        btn_analyze.click(
            fn=analyze_review_api,
            inputs=[txt_input],
            outputs=[json_output],
            api_name="analyze"  # Endpoint sinh ra sẽ là /call/analyze (hoặc /api/analyze tùy phiên bản)
        )
        
    with gr.Tab("Batch Analyze (CSV)"):
        file_input = gr.File(label="Tải lên file CSV")
        btn_batch = gr.Button("Phân tích Batch")
        batch_output = gr.JSON(label="Kết quả Batch")
        
        # Đăng ký API endpoint
        btn_batch.click(
            fn=analyze_batch_api,
            inputs=[file_input],
            outputs=[batch_output],
            api_name="batch"    # Endpoint sinh ra sẽ là /call/batch
        )
        
    with gr.Tab("AI Reply API (Hidden)", visible=False):
        reply_txt_input = gr.Textbox(label="Review Text")
        reply_aspects_input = gr.JSON(label="Aspects")
        reply_key_input = gr.Textbox(label="API Key")
        reply_output = gr.JSON(label="Reply")
        btn_reply = gr.Button("Generate Reply")
        
        btn_reply.click(
            fn=generate_reply_api,
            inputs=[reply_txt_input, reply_aspects_input, reply_key_input],
            outputs=[reply_output],
            api_name="generate_reply"
        )

# 🚨 BẮT BUỘC: Kích hoạt Queue để ZeroGPU quản lý tài nguyên và phân bổ GPU
demo.queue()

# Khai báo app cho Hugging Face (dành cho Gradio SDK)
app = demo

# Giữ vòng lặp sự kiện (Event Loop) mở liên tục khi chạy trực tiếp script (Docker/Local)
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
