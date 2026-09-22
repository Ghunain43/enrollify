# app/parsing/ingest_urls.py
"""
Re-ingest specific pages without running a full crawl.

Usage:
  python -m app.parsing.ingest_urls https://jinnah.edu/presidents-message https://jinnah.edu/prospectus
"""
import sys

from app.db.database import SessionLocal
from app.db.models import KnowledgeChunk
from app.parsing.chunking import chunk_page
from app.parsing.embedding import embed_many
from app.parsing.site_scraper import MIN_CHARS, crawlable, fetch, render_with_browser


def ingest_urls(urls: list):
    db = SessionLocal()
    try:
        for raw in urls:
            url = crawlable(raw)
            if not url:
                print(f"skip (not crawlable): {raw}")
                continue
            res = fetch(url)
            if "error" in res:
                print(f"FAILED {url}: {res['error']}")
                continue
            if res["kind"] == "html" and len(res["text"]) < MIN_CHARS:
                holder = {url: res}
                render_with_browser([url], holder)  # retry in a real browser
                res = holder[url]
            if len(res.get("text", "")) < MIN_CHARS:
                print(f"still too little text, skipped: {url}")
                continue

            final = res["url"]  # the real page, if the link was an alias
            chunks = chunk_page(res["title"], res["text"], collapse=res["kind"] == "pdf")
            vectors = embed_many([f"{res['title']}\n{c}" for c in chunks])
            for u in {url, final}:  # clear old rows for both the alias and the real page
                db.query(KnowledgeChunk).filter(
                    KnowledgeChunk.url == u, KnowledgeChunk.source == "scraped"
                ).delete()
            db.add_all([
                KnowledgeChunk(url=final, title=res["title"], source="scraped", content=c, embedding=v)
                for c, v in zip(chunks, vectors)
            ])
            db.commit()
            print(f"OK {final}: {len(chunks)} chunks")
    finally:
        db.close()


if __name__ == "__main__":
    ingest_urls(sys.argv[1:])