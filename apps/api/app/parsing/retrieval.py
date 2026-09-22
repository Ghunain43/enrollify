# app/parsing/retrieval.py
"""
Finds the chunks that best answer a question.

1. Expand student shorthand (BSCS, MAT, APF ...)
2. Vector search (meaning) + keyword search (exact words, OR-ed) -> ~30 candidates
3. Cross-encoder rerank against the question
4. Adjust scores by page authority: official pages and curated facts up,
   blog/SEO posts and pages from old years down. Cap chunks per page for variety.
"""
import re
import time
from urllib.parse import urlparse

from sentence_transformers import CrossEncoder
from sqlalchemy import func, select, text

from app.db.database import SessionLocal
from app.db.models import KnowledgeChunk
from app.parsing.embedding import embed

CANDIDATES = 12          # per search method
OFFICIAL_CANDIDATES = 8  # extra pool drawn only from official/curated chunks
TOP_K = 5                # chunks handed to the model
MAX_PER_URL = 3          # stops one long page from filling every slot
CURATED_BONUS = 1.5      # hand-verified facts win close calls
OFFICIAL_BONUS = 4.0     # official policy/fee/eligibility pages
BLOG_PENALTY = 3.0       # root-level SEO/blog slugs
OLD_YEAR_PENALTY = 2.0   # URL mentions a past year (e.g. .../spring-2023)
CURRENT_YEAR = 2026
MIN_SCORE = -8.0         # reranker floor; tune by reading the scores printed by ask.py

# Pages that are the source of truth for numbers, dates and rules (from the site's own menu).
OFFICIAL_PATHS = {
    "/fee-structure-scholarship", "/scholarship", "/eligibility-criteria", "/admissions-eligibility",
    "/key-admission-dates", "/merit-list-preparation", "/composition-of-admission-test", "/faqs",
    "/how-to-apply", "/undergraduate-programs", "/2-year-undergraduate-programs",
    "/graduate-programs", "/doctorate-programs", "/prospectus", "/contact",
    "/key-points-for-foreign-admissions", "/sample-papers", "/admission-office",
    "/societies-clubs", "/placement-office", "/university-management",
    "/presidents-message", "/chancellor-message", "/our_team",
}
# Individual /our_team/<person> bios are NOT included: boosting every staff profile page
# made irrelevant people (e.g. the president's own bio) outrank the actual answer and get
# shown as sources for unrelated questions. Verified leadership facts belong in curated.py.
OFFICIAL_PREFIXES = ("/my-maju/", "/admissions/")

ALIASES = {
    "bscs": "BS Computer Science",
    "bsse": "BS Software Engineering",
    "bsai": "BS Artificial Intelligence",
    "mat": "MAJU admission test",
    "apf": "application processing fee",
    "cgpa": "cumulative GPA grade point average",
    "fyp": "final year project",
}

STOPWORDS = {
    "the", "and", "for", "are", "was", "what", "when", "where", "which", "who", "how",
    "does", "did", "can", "could", "would", "should", "will", "have", "has", "had",
    "this", "that", "with", "from", "about", "into", "there", "their", "your", "you",
    "any", "much", "many", "get", "tell", "please", "maju", "university",
}

_OFFICIAL_URLS = ", ".join(f"'https://jinnah.edu{p}'" for p in sorted(OFFICIAL_PATHS))
_OFFICIAL_SQL = text(f"""
WITH official AS MATERIALIZED (
    SELECT id, url, title, source, content, embedding
    FROM knowledge_chunks
    WHERE source = 'curated'
       OR url IN ({_OFFICIAL_URLS})
       OR url LIKE 'https://jinnah.edu/my-maju/%'
       OR url LIKE 'https://jinnah.edu/admissions/%'
)
SELECT id, url, title, source, content FROM official
ORDER BY embedding <=> CAST(:q AS vector)
LIMIT :n
""")

_COLS = (
    KnowledgeChunk.id, KnowledgeChunk.url, KnowledgeChunk.title,
    KnowledgeChunk.source, KnowledgeChunk.content,
)
_reranker = None


def _get_reranker():
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", max_length=320)
    return _reranker


def _lap(timings, key, start):
    if timings is not None:
        timings[key] = round(time.perf_counter() - start, 2)


def _path(url: str) -> str:
    return urlparse(url).path.rstrip("/")


def is_official(h: dict) -> bool:
    if h["source"] == "curated":
        return True
    p = _path(h["url"])
    return p in OFFICIAL_PATHS or p.startswith(OFFICIAL_PREFIXES)


def looks_like_blog(h: dict) -> bool:
    """Root-level long hyphenated slugs (/study-bs-computer-science-subjects-...) are blog/SEO posts."""
    p = _path(h["url"])
    return p.count("/") == 1 and p.count("-") >= 3


def score_adjustment(h: dict) -> float:
    if h["source"] == "curated":
        return CURATED_BONUS
    if h["official"]:
        return OFFICIAL_BONUS
    adj = 0.0
    if looks_like_blog(h):
        adj -= BLOG_PENALTY
    if "/uploads/" not in h["url"]:
        if any(int(y) < CURRENT_YEAR for y in re.findall(r"20\d\d", h["url"])):
            adj -= OLD_YEAR_PENALTY
    return adj


def expand_query(question: str) -> str:
    extra = [full for short, full in ALIASES.items()
             if re.search(rf"\b{short}\b", question, re.I)]
    return question + (" " + " ".join(extra) if extra else "")


def _keywords(text: str) -> list:
    words = {w for w in re.findall(r"[a-z0-9]+", text.lower())
             if len(w) > 2 and w not in STOPWORDS}
    return sorted(words)


def _as_dict(r) -> dict:
    return {"id": r.id, "url": r.url, "title": r.title or "",
            "source": r.source, "content": r.content}


def retrieve(question: str, k: int = TOP_K, timings: dict = None) -> list:
    t = time.perf_counter()
    q = expand_query(question)
    qvec = embed(q)
    words = _keywords(q)
    _lap(timings, "embed", t)

    t = time.perf_counter()
    db = SessionLocal()
    try:
        vec_rows = db.execute(
            select(*_COLS)
            .order_by(KnowledgeChunk.embedding.cosine_distance(qvec))
            .limit(CANDIDATES)
        ).all()

        # Guarantee the best official chunks are always candidates: a table row like
        # "BS (Software Engineering) | Minimum 50% ..." is easily outranked by blog posts
        # in a plain search, then never gets a chance to be reranked.
        off_rows = db.execute(_OFFICIAL_SQL, {"q": str(qvec), "n": OFFICIAL_CANDIDATES}).all()

        kw_rows = []
        if words:  # OR the words: one missing word must not kill the whole search
            tsq = func.to_tsquery("english", " | ".join(words))
            kw_rows = db.execute(
                select(*_COLS)
                .where(KnowledgeChunk.tsv.op("@@")(tsq))
                .order_by(func.ts_rank_cd(KnowledgeChunk.tsv, tsq).desc())
                .limit(CANDIDATES)
            ).all()
    finally:
        db.close()
    _lap(timings, "db", t)

    candidates = {}
    for r in list(vec_rows) + list(kw_rows) + list(off_rows):
        candidates.setdefault(r.id, _as_dict(r))
    if not candidates:
        return []

    t = time.perf_counter()
    hits = list(candidates.values())
    scores = _get_reranker().predict([[q, f"{h['title']}\n{h['content']}"] for h in hits])
    for h, s in zip(hits, scores):
        h["official"] = is_official(h)
        h["score"] = float(s) + score_adjustment(h)
    hits.sort(key=lambda h: h["score"], reverse=True)
    _lap(timings, "rerank", t)

    out, per_url = [], {}
    for h in hits:
        if h["score"] < MIN_SCORE:
            break
        if per_url.get(h["url"], 0) >= MAX_PER_URL:
            continue
        per_url[h["url"]] = per_url.get(h["url"], 0) + 1
        out.append(h)
        if len(out) == k:
            break

    # When several official pages already answer the question, drop unverified ones:
    # old program pages and blog posts often contradict the official numbers.
    if sum(1 for h in out if h["official"]) >= 3:
        out = [h for h in out if h["official"]]
    return out