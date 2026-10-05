from typing import List, Dict, Any
from fastapi import HTTPException
from google import genai

def handle_gemini_error(e: Exception):
    error_str = str(e).lower()
    if '503' in error_str or 'unavailable' in error_str:
        raise HTTPException(status_code=503, detail="Hệ thống AI hiện đang quá tải do lượng truy cập cao. Bạn vui lòng thử lại sau vài giây nhé.")
    elif '429' in error_str or 'resource_exhausted' in error_str or 'quota' in error_str:
        raise HTTPException(status_code=429, detail="Hạn mức API Key của bạn đã tạm thời hết lượt yêu cầu. Vui lòng thử lại sau hoặc đổi key khác.")
    elif '400' in error_str or '403' in error_str or 'invalid_argument' in error_str or 'api_key_invalid' in error_str:
        raise HTTPException(status_code=400, detail="Gemini API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại trong phần Cài đặt.")
    else:
        raise HTTPException(status_code=500, detail="Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại kết nối mạng.")

def generate_reply_for_review(review_text: str, aspects: List[Dict[str, Any]], custom_api_key: str = None) -> str:
    if not custom_api_key:
        raise HTTPException(status_code=401, detail="Vui lòng cung cấp Gemini API Key trong phần Cài đặt để sử dụng tính năng này.")

    client = genai.Client(api_key=custom_api_key)
    
    aspects_info = "\n".join([f"- {a['aspect']}: {a['star']} sao" for a in aspects])
    
    prompt = f"""
    Bạn là một nhân viên chăm sóc khách hàng chuyên nghiệp và thấu cảm của một công ty du lịch.
    
    DỮ LIỆU ĐẦU VÀO:
    - Đánh giá của khách hàng: "{review_text}"
    - Các khía cạnh đã phân tích (kèm mức độ hài lòng): {aspects_info}
    
    NHIỆM VỤ:
    Viết một đoạn phản hồi trực tiếp cho khách hàng. Tùy theo mức độ hài lòng, hãy áp dụng quy tắc sau:
    
    1. HƯỚNG XỬ LÝ (Dựa vào dữ liệu phân tích):
       - Nếu khen/chê đan xen: Cảm ơn chân thành về khía cạnh họ hài lòng, sau đó khéo léo chuyển ý để xin lỗi cụ thể về khía cạnh họ chưa ưng ý và đề xuất hướng khắc phục.
       - Nếu hoàn toàn tiêu cực (1-2 sao): XIN LỖI ngay lập tức và trực diện vào vấn đề. Thể hiện sự thấu cảm, đưa ra giải pháp hoặc xin thông tin liên hệ (SĐT/Email) để ban quản lý trực tiếp hỗ trợ.
       - Nếu hoàn toàn tích cực (4-5 sao): Cảm ơn sự ủng hộ. Nhắc lại một điểm tốt trong đánh giá của họ để tạo sự gần gũi, khéo léo hy vọng được phục vụ họ trong tương lai.
       - Nếu trung bình (3 sao): Cảm ơn góp ý và hỏi thăm xem công ty có thể làm gì để nâng cao trải nghiệm của họ ở lần sau.
    
    2. VĂN PHONG & ĐỊNH DẠNG:
       - Thái độ: Lịch sự, chân thành, tránh dùng giọng điệu máy móc (văn mẫu).
       - Độ dài: Ngắn gọn, đi thẳng vào vấn đề (từ 3 đến 5 câu).
       - Định dạng: CHỈ trả về đoạn văn bản phản hồi. TUYỆT ĐỐI KHÔNG dùng markdown (in đậm, in nghiêng), không thêm tiêu đề, không giải thích nội dung.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        handle_gemini_error(e)

async def async_generate_reply_for_review(review_text: str, aspects: List[Dict[str, Any]], custom_api_key: str = None) -> str:
    if not custom_api_key:
        raise HTTPException(status_code=401, detail="Vui lòng cung cấp Gemini API Key trong phần Cài đặt để sử dụng tính năng này.")

    client = genai.Client(api_key=custom_api_key)
    
    aspects_info = "\n".join([f"- {a['aspect']}: {a['star']} sao" for a in aspects])
    
    prompt = f"""
    Bạn là một nhân viên chăm sóc khách hàng chuyên nghiệp và thấu cảm của một công ty du lịch.
    
    DỮ LIỆU ĐẦU VÀO:
    - Đánh giá của khách hàng: "{review_text}"
    - Các khía cạnh đã phân tích (kèm mức độ hài lòng): {aspects_info}
    
    NHIỆM VỤ:
    Viết một đoạn phản hồi trực tiếp cho khách hàng. Tùy theo mức độ hài lòng, hãy áp dụng quy tắc sau:
    
    1. HƯỚNG XỬ LÝ (Dựa vào dữ liệu phân tích):
       - Nếu khen/chê đan xen: Cảm ơn chân thành về khía cạnh họ hài lòng, sau đó khéo léo chuyển ý để xin lỗi cụ thể về khía cạnh họ chưa ưng ý và đề xuất hướng khắc phục.
       - Nếu hoàn toàn tiêu cực (1-2 sao): XIN LỖI ngay lập tức và trực diện vào vấn đề. Thể hiện sự thấu cảm, đưa ra giải pháp hoặc xin thông tin liên hệ (SĐT/Email) để ban quản lý trực tiếp hỗ trợ.
       - Nếu hoàn toàn tích cực (4-5 sao): Cảm ơn sự ủng hộ. Nhắc lại một điểm tốt trong đánh giá của họ để tạo sự gần gũi, khéo léo hy vọng được phục vụ họ trong tương lai.
       - Nếu trung bình (3 sao): Cảm ơn góp ý và hỏi thăm xem công ty có thể làm gì để nâng cao trải nghiệm của họ ở lần sau.
    
    2. VĂN PHONG & ĐỊNH DẠNG:
       - Thái độ: Lịch sự, chân thành, tránh dùng giọng điệu máy móc (văn mẫu).
       - Độ dài: Ngắn gọn, đi thẳng vào vấn đề (từ 3 đến 5 câu).
       - Định dạng: CHỈ trả về đoạn văn bản phản hồi. TUYỆT ĐỐI KHÔNG dùng markdown (in đậm, in nghiêng), không thêm tiêu đề, không giải thích nội dung.
    """
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        handle_gemini_error(e)
