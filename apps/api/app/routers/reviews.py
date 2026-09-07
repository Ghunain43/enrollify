import os
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Review

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    rating: int
    comment: str | None = None


@router.post("")
def submit_review(payload: ReviewCreate, db: DBSession = Depends(get_db)):
    if not (1 <= payload.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    review = Review(rating=payload.rating, comment=payload.comment)
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"id": review.id, "message": "Thanks for the feedback!"}


@router.get("/admin")
def list_reviews(key: str = Query(...), db: DBSession = Depends(get_db)):
    """Simple admin gate via a shared secret key — not full auth, but enough
    for a solo-dev admin view. Never expose ADMIN_SECRET_KEY publicly."""
    admin_key = os.environ.get("ADMIN_SECRET_KEY")
    if not admin_key or key != admin_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    return db.query(Review).order_by(Review.created_at.desc()).all()