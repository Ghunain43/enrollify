# app/routers/chatbot.py
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.parsing.answer import generate_answer

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class ChatQuery(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    history: list[Turn] = []  # the frontend sends the last few messages


@router.post("/ask")
def ask(query: ChatQuery):
    result = generate_answer(query.question, [t.model_dump() for t in query.history])
    return {"answer": result["text"], "sources": result["sources"]}