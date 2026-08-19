from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.course import EnrollmentPreferences, SchedulePlan, Section
from app.solver.backtracking import generate_valid_combinations
from app.solver.scoring import rank_combinations

router = APIRouter(prefix="/enrollment", tags=["enrollment"])


class GeneratePlansRequest(BaseModel):
    required_course_codes: list[str]
    all_sections: list[Section]
    preferences: EnrollmentPreferences


@router.post("/generate-plans", response_model=list[SchedulePlan])
async def generate_plans(payload: GeneratePlansRequest):
    """Given required courses + all available sections + preferences, return top ranked plans."""
    try:
        combos = generate_valid_combinations(payload.required_course_codes, payload.all_sections)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not combos:
        raise HTTPException(status_code=404, detail="No conflict-free combination exists for these courses")

    return rank_combinations(combos, payload.preferences, top_n=4)