# app/parsing/ingest_curated.py
"""Run: python -m app.parsing.ingest_curated
Reloads the hand-verified entries. The website crawl never touches these."""
from app.db.database import SessionLocal
from app.db.models import KnowledgeChunk
from app.parsing.curated import CURATED
from app.parsing.embedding import embed_many


def ingest_curated():
    db = SessionLocal()
    try:
        db.query(KnowledgeChunk).filter(KnowledgeChunk.source == "curated").delete()
        vectors = embed_many([f"{e['title']}\n{e['text']}" for e in CURATED])
        for e, v in zip(CURATED, vectors):
            db.add(KnowledgeChunk(
                url=e["url"], title=e["title"], source="curated",
                content=e["text"], embedding=v,
            ))
        db.commit()
        print(f"[curated] loaded {len(CURATED)} entries")
    finally:
        db.close()


if __name__ == "__main__":
    ingest_curated()