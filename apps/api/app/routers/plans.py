from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import SavedPlan
from app.models.course import Section

router = APIRouter(prefix="/plans", tags=["plans"])


@router.post("/save")
def save_plan(
    user_id: int,
    sections: list[Section],
    semester: str | None = None,
    score: int | None = None,
    db: DBSession = Depends(get_db),
):
    """Persist the plan a student chose to enroll in."""
    plan = SavedPlan(
        user_id=user_id,
        semester=semester,
        sections_json=[s.model_dump(mode="json") for s in sections],
        score=score,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"id": plan.id, "message": "Plan saved"}


@router.get("/user/{user_id}")
def get_user_plans(user_id: int, db: DBSession = Depends(get_db)):
    """Get all plans a user has saved (e.g. across semesters)."""
    plans = db.query(SavedPlan).filter(SavedPlan.user_id == user_id).all()
    if not plans:
        raise HTTPException(status_code=404, detail="No saved plans for this user")
    return plans