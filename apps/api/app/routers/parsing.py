from fastapi import APIRouter, UploadFile, HTTPException

from app.models.course import ParsedTimetable
from app.parsing.vision_parser import parse_timetable_screenshot

router = APIRouter(prefix="/parsing", tags=["parsing"])


@router.post("/screenshot", response_model=ParsedTimetable)
async def parse_screenshot(file: UploadFile):
    """Upload a timetable screenshot, get back structured section data."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    try:
        return parse_timetable_screenshot(image_bytes, mime_type=file.content_type)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse timetable: {e}")