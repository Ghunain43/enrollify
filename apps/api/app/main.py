from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import enrollment, plans, parsing, reviews
from app.db.database import engine, Base
from app.db import models  # noqa: F401
from app.routers import chatbot

load_dotenv()

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.parsing.retrieval import retrieve
        retrieve("warm up")  # loads both models and opens the database connection
    except Exception as e:
        print(f"[startup] chatbot warm-up failed: {e}")  # never block the API from starting
    yield


app = FastAPI(title="Enrollify API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://enrolify.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enrollment.router)
app.include_router(plans.router)
app.include_router(parsing.router)
app.include_router(reviews.router)
app.include_router(chatbot.router)


@app.get("/health")
def health():
    return {"status": "ok"}