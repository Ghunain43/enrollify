from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import enrollment, plans, parsing, reviews
from app.routers import enrollment, plans
from app.db.database import engine, Base
from app.db import models  # noqa: F401

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Enrollify API", version="0.1.0")

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

@app.get("/health")
def health():
    return {"status": "ok"}