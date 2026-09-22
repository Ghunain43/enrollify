# app/parsing/site_scraper.py
"""
Crawls jinnah.edu and returns clean text for every page and PDF it can reach.

Discovery : sitemaps (recursing into sub-sitemaps) + following links on every page
Extraction: requests + trafilatura (fast); Playwright only for pages that come back thin
PDFs      : text extracted with pypdf (policies are often PDFs)
"""
import io
import re
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import unquote, urljoin, urlparse
from xml.etree import ElementTree

import requests
import trafilatura
from bs4 import BeautifulSoup

BASE = "jinnah.edu"
HOSTS = {BASE, f"www.{BASE}"}
HOME = f"https://{BASE}"
HEADERS = {"User-Agent": "Enrollify-MAJU-Bot/2.0 (student project)"}
SITEMAPS = ["/wp-sitemap.xml", "/sitemap_index.xml", "/sitemap.xml"]
MIN_CHARS = 300  # below this, an HTML page is "thin" and gets a browser retry

BLOCKED_EXT = (
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".css", ".js", ".ico",
    ".zip", ".rar", ".mp4", ".mp3", ".woff", ".woff2", ".ttf", ".xml",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
)
SKIP_PATH = re.compile(r"/(wp-json|wp-admin|wp-login|feed|tag|author|xmlrpc)(/|$)|/page/\d+$", re.I)
TITLE_SUFFIX = re.compile(r"\s*[-–|]\s*(Mohammad Ali Jinnah University|Jinnah University|MAJU).*$", re.I)


# ---------------------------------------------------------------- URLs
def normalize(url: str):
    p = urlparse(url)
    if p.scheme not in ("http", "https") or p.hostname not in HOSTS:
        return None
    path = p.path or "/"
    if path != "/":
        path = path.rstrip("/")
    return f"https://{BASE}{path}"


def crawlable(url: str):
    n = normalize(url)
    if not n:
        return None
    path = urlparse(n).path
    if path.lower().endswith(BLOCKED_EXT) or SKIP_PATH.search(path):
        return None
    return n


def _read_sitemap(url: str, out: set, depth: int = 0):
    if depth > 3:
        return
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        if r.status_code != 200:
            return
        root = ElementTree.fromstring(r.content)
    except (requests.RequestException, ElementTree.ParseError):
        return
    for el in root.iter():
        if el.tag.rsplit("}", 1)[-1] == "loc" and el.text:
            u = el.text.strip()
            if u.lower().endswith(".xml"):
                _read_sitemap(u, out, depth + 1)  # sub-sitemap: go inside it
            else:
                n = crawlable(u)
                if n:
                    out.add(n)


def sitemap_urls() -> set:
    out = set()
    for path in SITEMAPS:
        _read_sitemap(f"{HOME}{path}", out)
    return out


# ---------------------------------------------------------------- extraction
def _pdf_text(data: bytes) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception:
        return ""


def _title(soup, url: str) -> str:
    if soup.title and soup.title.string:
        t = TITLE_SUFFIX.sub("", soup.title.string.strip()).strip()
        if t:
            return t
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return h1.get_text(" ", strip=True)
    return urlparse(url).path.strip("/").replace("-", " ").title() or "MAJU"


def parse_html(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    links = set()
    for a in soup.find_all("a", href=True):
        link = crawlable(urljoin(url, a["href"]).split("#")[0])
        if link:
            links.add(link)  # includes .pdf links, which fetch() handles
    text = trafilatura.extract(
        html, include_tables=True, include_formatting=True, favor_recall=True
    ) or ""
    canon_tag = soup.find("link", rel="canonical")
    canonical = crawlable(canon_tag["href"]) if canon_tag and canon_tag.get("href") else None
    return {"url": url, "canonical": canonical, "kind": "html",
            "title": _title(soup, url), "text": text, "links": links}


def fetch(url: str) -> dict:
    time.sleep(0.2)  # be polite to the server
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        r.raise_for_status()
    except requests.RequestException as e:
        return {"url": url, "error": str(e), "links": set()}

    final = normalize(r.url)
    if final is None:  # redirected to another website: never ingest that content under a jinnah.edu URL
        return {"url": url, "error": f"redirects off-site to {urlparse(r.url).hostname}", "links": set()}
    if final != url:  # e.g. /m-mansoor-ahmed -> /presidents-message: an alias, not a page of its own
        links = {l for l in [crawlable(final)] if l}
        return {"url": url, "kind": "alias", "alias_of": final, "title": "", "text": "", "links": links}

    ctype = r.headers.get("content-type", "").lower()
    if "pdf" in ctype or url.lower().endswith(".pdf"):
        name = unquote(urlparse(url).path.rsplit("/", 1)[-1])
        title = re.sub(r"[-_]+", " ", re.sub(r"\.pdf$", "", name, flags=re.I)).strip() or "MAJU document"
        return {"url": url, "kind": "pdf", "title": title, "text": _pdf_text(r.content), "links": set()}
    if "html" not in ctype:
        return {"url": url, "error": f"skipped content-type {ctype}", "links": set()}
    res = parse_html(url, r.text)
    # Old slugs redirect to the real page (e.g. /m-mansoor-ahmed -> /presidents-message).
    # Store the content once, under the real URL, so aliases never look like separate pages.
    res["url"] = res.pop("canonical") or normalize(r.url) or url
    return res


def render_with_browser(urls: list, results: dict):
    """Retry thin pages in a real browser (JS-rendered content). Optional dependency."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[scraper] playwright not installed, skipping browser retry")
        return
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for url in urls:
            try:
                page.goto(url, wait_until="load", timeout=30000)
                page.wait_for_timeout(2500)
                res = parse_html(url, page.content())
                res["url"] = res.pop("canonical") or url
                if len(res["text"]) > len(results[url].get("text", "")):
                    results[url] = res
            except Exception as e:
                results[url]["render_error"] = str(e)
        browser.close()


# ---------------------------------------------------------------- crawl
def crawl_site(max_pages: int = 3000, workers: int = 4):
    """Returns (results, report). results = {url: {kind, title, text, ...}}"""
    seen, results = set(), {}
    frontier = sorted(sitemap_urls() | {HOME})
    print(f"[scraper] {len(frontier)} URLs from sitemaps + homepage")

    while frontier and len(seen) < max_pages:
        batch = [u for u in frontier if u not in seen][: max_pages - len(seen)]
        seen.update(batch)
        with ThreadPoolExecutor(workers) as ex:
            fetched = list(ex.map(fetch, batch))
        frontier = []
        for res in fetched:
            results[res["url"]] = res
            frontier.extend(l for l in res.get("links", ()) if l not in seen)
        frontier = list(dict.fromkeys(frontier))
        print(f"[scraper] fetched {len(results)} so far, {len(frontier)} queued")

    thin = [u for u, r in results.items()
            if r.get("kind") == "html" and len(r.get("text", "")) < MIN_CHARS and "error" not in r]
    if thin:
        print(f"[scraper] retrying {len(thin)} thin pages in a browser")
        render_with_browser(thin, results)

    report = {
        "fetched": len(results),
        "html_ok": [u for u, r in results.items() if r.get("kind") == "html" and len(r["text"]) >= MIN_CHARS],
        "pdf_ok": [u for u, r in results.items() if r.get("kind") == "pdf" and len(r["text"]) >= MIN_CHARS],
        "pdf_empty": [u for u, r in results.items() if r.get("kind") == "pdf" and len(r["text"]) < MIN_CHARS],
        "still_thin": [u for u, r in results.items()
                       if r.get("kind") == "html" and len(r["text"]) < MIN_CHARS],
        "failed": [(u, r["error"]) for u, r in results.items() if "error" in r],
        "aliases": [(u, r["alias_of"]) for u, r in results.items() if r.get("kind") == "alias"],
    }
    return results, report