import datetime
from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, DateTime,
    ForeignKey, JSON, Computed, func,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.db.database import Base


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(BigInteger, primary_key=True)
    url = Column(Text, nullable=False, index=True)
    title = Column(Text)
    source = Column(Text, nullable=False, default="scraped")
    content = Column(Text, nullable=False)
    embedding = Column(Vector(384), nullable=False)
    tsv = Column(TSVECTOR, Computed(
        "to_tsvector('english', coalesce(title,'') || ' ' || content)", persisted=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


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


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)