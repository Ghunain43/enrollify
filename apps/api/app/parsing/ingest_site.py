# app/parsing/ingest_site.py
"""
Run:  python -m app.parsing.ingest_site
Crawls jinnah.edu, stores chunks with source='scraped', writes crawl_report.json.
Curated entries (source='curated') are never touched.
"""
import hashlib
import json

from app.db.database import SessionLocal
from app.db.models import KnowledgeChunk
from app.parsing.chunking import chunk_page
from app.parsing.embedding import embed_many
from app.parsing.retrieval import is_official
from app.parsing.site_scraper import MIN_CHARS, crawl_site


def ingest_site():
    pages, report = crawl_site()
    seen_counts = {}  # boilerplate (footers, banners) repeats on many pages; real content on 1-2
    report.update(chunks_stored=0, pages_stored=0, aliases_removed=0, db_errors=[])

    db = SessionLocal()
    try:
        # Official pages go first, so when the same text exists on several URLs the official
        # page keeps it (the duplicate-removal below keeps whichever page it sees first).
        ordered = sorted(pages.items(),
                         key=lambda kv: not is_official({"url": kv[0], "source": "scraped"}))
        for url, res in ordered:
            if res.get("kind") == "alias":  # redirect: remove any chunks stored under the alias
                db.query(KnowledgeChunk).filter(
                    KnowledgeChunk.url == url, KnowledgeChunk.source == "scraped").delete()
                db.commit()
                report["aliases_removed"] += 1
                continue
            text = res.get("text", "")
            if "error" in res or len(text) < MIN_CHARS:
                continue  # keep any older chunks for this URL rather than wiping them

            chunks = []
            for c in chunk_page(res["title"], text, collapse=res["kind"] == "pdf"):
                h = hashlib.md5(" ".join(c.lower().split()).encode()).hexdigest()
                seen_counts[h] = seen_counts.get(h, 0) + 1
                if seen_counts[h] <= 3:
                    chunks.append(c)
            if not chunks:
                continue

            title = res["title"]
            vectors = embed_many([f"{title}\n{c}" for c in chunks])
            try:  # one transaction per page: a failure never aborts the whole run
                db.query(KnowledgeChunk).filter(
                    KnowledgeChunk.url == url, KnowledgeChunk.source == "scraped"
                ).delete()
                db.add_all([
                    KnowledgeChunk(url=url, title=title, source="scraped", content=c, embedding=v)
                    for c, v in zip(chunks, vectors)
                ])
                db.commit()
                report["chunks_stored"] += len(chunks)
                report["pages_stored"] += 1
            except Exception as e:
                db.rollback()
                report["db_errors"].append((url, str(e)))

        # remove pages that no longer exist on the site (only if the crawl looks healthy)
        if len(report["failed"]) <= 0.1 * max(report["fetched"], 1):
            db.query(KnowledgeChunk).filter(
                KnowledgeChunk.source == "scraped", ~KnowledgeChunk.url.in_(list(pages))
            ).delete(synchronize_session=False)
            db.commit()
    finally:
        db.close()

    with open("crawl_report.json", "w") as f:
        json.dump(report, f, indent=2, default=list)

    print(
        f"[ingest] fetched {report['fetched']} | pages stored {report['pages_stored']} | "
        f"chunks {report['chunks_stored']} | PDFs ok {len(report['pdf_ok'])} "
        f"(empty {len(report['pdf_empty'])}) | thin {len(report['still_thin'])} | "
        f"failed {len(report['failed'])} | aliases {report['aliases_removed']}"
    )


if __name__ == "__main__":
    ingest_site()