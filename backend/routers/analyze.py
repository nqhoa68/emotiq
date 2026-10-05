from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.inference_service import inference_service
from services.llm_reply import generate_reply_for_review
import spaces

router = APIRouter(
    prefix="/analyze",
    tags=["Analysis"]
)

class AnalyzeRequest(BaseModel):
    text: str

class AspectResult(BaseModel):
    aspect: str
    probability: float
    star: int
    description: str

class AnalyzeResponse(BaseModel):
    cleaned_input: str
    aspects: List[AspectResult]

@router.post("/", response_model=AnalyzeResponse)
def analyze_review_endpoint(request: AnalyzeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        result = inference_service.analyze_review(request.text)
        return result
    except spaces.exceptions.SpaceRuntimeError as e:
        raise HTTPException(status_code=504, detail="Hệ thống GPU đang quá tải hoặc hết thời gian cấp phát. Vui lòng thử lại sau!")
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

class BatchSummary(BaseModel):
    aspect_counts: dict
    aspect_avg_stars: dict
    positive_aspects: int
    negative_aspects: int

class BatchItem(BaseModel):
    original_text: str
    aspects: List[AspectResult]
    auto_reply: Optional[str] = None
    timestamp: Optional[str] = None

class BatchAnalyzeResponse(BaseModel):
    total_processed: int
    summary: BatchSummary
    items: List[BatchItem]

from fastapi import File, UploadFile, Form, Header

@router.post("/batch", response_model=BatchAnalyzeResponse)
async def analyze_batch_endpoint(
    file: UploadFile = File(...),
    enable_auto_reply: bool = Form(False),
    x_gemini_api_key: Optional[str] = Header(None)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Vui lòng tải lên file định dạng .csv")
    
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File rỗng, vui lòng kiểm tra lại.")
        
    try:
        result = inference_service.analyze_batch(content)
        
        if enable_auto_reply:
            import asyncio
            from services.llm_reply import async_generate_reply_for_review
            semaphore = asyncio.Semaphore(5)
            
            async def process_item(item):
                async with semaphore:
                    # Chuyển Pydantic model sang dict (hỗ trợ v2: model_dump, fallback: dict)
                    aspects_dict = [a.model_dump() if hasattr(a, 'model_dump') else a.dict() for a in item.aspects]
                    try:
                        reply = await async_generate_reply_for_review(item.original_text, aspects_dict, custom_api_key=x_gemini_api_key)
                    except HTTPException as e:
                        reply = f"⚠️ {e.detail}"
                    except Exception as e:
                        reply = f"⚠️ Lỗi không xác định: {str(e)}"
                    item.auto_reply = reply
                    return item

            tasks = [process_item(item) for item in result.items]
            await asyncio.gather(*tasks)

        return result
    except spaces.exceptions.SpaceRuntimeError as e:
        raise HTTPException(status_code=504, detail="Thời gian xử lý GPU đã vượt giới hạn 60 giây của ZeroGPU. Vui lòng chia nhỏ file CSV của bạn và thử lại!")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi phân tích batch: {str(e)}")

class ReplyRequest(BaseModel):
    review_text: str
    aspects: List[dict]

class ReplyResponse(BaseModel):
    reply: str

@router.post("/generate-reply", response_model=ReplyResponse)
def generate_reply_endpoint(
    request: ReplyRequest,
    x_gemini_api_key: Optional[str] = Header(None)
):
    if not request.review_text.strip():
        raise HTTPException(status_code=400, detail="Review text cannot be empty")
        
    try:
        reply_text = generate_reply_for_review(request.review_text, request.aspects, custom_api_key=x_gemini_api_key)
        return ReplyResponse(reply=reply_text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
