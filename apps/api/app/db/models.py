import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    university = Column(String(255), default="MAJU")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    saved_plans = relationship("SavedPlan", back_populates="user")


class SavedPlan(Base):
    __tablename__ = "saved_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    semester = Column(String(100), nullable=True)
    sections_json = Column(JSON, nullable=False)
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="saved_plans")