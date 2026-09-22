from app.parsing.site_scraper import crawl_site, fetch

results, rep = crawl_site(max_pages=40)
print("\nSTILL THIN:")
for u in rep["still_thin"]:
    print(" ", u)
print("\nFAILED:")
for u, err in rep["failed"]:
    print(" ", u, "->", err[:100])

print("\nKEY PAGES:")
for u in ["https://jinnah.edu/eligibility-criteria",
          "https://jinnah.edu/scholarship",
          "https://jinnah.edu/my-maju/allpolicy/students-discipline",
          "https://jinnah.edu/2-year-undergraduate-programs"]:
    r = fetch(u)
    print("\n", u, "| error:", r.get("error"), "| chars:", len(r.get("text", "")))
    print(r.get("text", "")[:300].replace("\n", " "))