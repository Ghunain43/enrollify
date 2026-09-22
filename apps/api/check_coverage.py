from sqlalchemy import text
from app.db.database import SessionLocal

db = SessionLocal()
q = lambda sql, **p: db.execute(text(sql), p).fetchall()

print("== PDF share ==")
print(q("SELECT count(*) FILTER (WHERE url ILIKE '%.pdf'), count(*) FROM knowledge_chunks WHERE source='scraped'"))

print("\n== Top 15 URLs by chunk count ==")
for url, n in q("SELECT url, count(*) FROM knowledge_chunks WHERE source='scraped' GROUP BY url ORDER BY 2 DESC LIMIT 15"):
    print(n, url)

print("\n== Key pages (chunks) ==")
for key in ["undergraduate-regulations", "general-policies", "ms-regulations", "phd-regulations",
            "key-admission-dates", "fee-structure", "faqs", "academic-calendar", "merit-list",
            "composition-of-admission-test", "admissions-eligibility", "prospectus",
            "scholarship", "societies", "university-dress-code", "how-to-apply"]:
    n = q("SELECT count(*) FROM knowledge_chunks WHERE url ILIKE :k", k=f"%{key}%")[0][0]
    print(f"{n:4d}  {key}")

print("\n== Topic coverage (chunks / pages) ==")
for term in ["hostel", "transport", "library", "attendance", "grade point", "repeat",
             "last date", "fee structure", "artificial intelligence", "cyber security",
             "internship", "sports", "cafeteria", "placement"]:
    c, p = q("SELECT count(*), count(DISTINCT url) FROM knowledge_chunks WHERE content ILIKE :t",
             t=f"%{term}%")[0]
    print(f"{c:5d} / {p:4d}  {term}")
db.close()