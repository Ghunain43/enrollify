from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import enrollment
from app.db.database import engine, Base
from app.db import models  # noqa: F401 — registers models before create_all

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Enrollify API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enrollment.router)


@app.get("/health")
def health():
    return {"status": "ok"}