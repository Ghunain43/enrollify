# app/parsing/chunking.py
"""
Heading-aware chunking. Chunks stay under ~180 words so all-MiniLM-L6-v2
(256-token limit) sees the whole chunk, and each chunk keeps its section
heading so "Semester 3: ..." never loses which program it belongs to.
"""
import re

MAX_WORDS = 180
OVERLAP = 30
MIN_WORDS = 8
_HEADING = re.compile(r"^#{1,6}\s+(.*\S)\s*$")


def _sections(text: str):
    sections, heading, buf = [], "", []
    for line in text.splitlines():
        m = _HEADING.match(line)
        if m:
            if "".join(buf).strip():
                sections.append((heading, "\n".join(buf).strip()))
            heading, buf = m.group(1).strip(), []
        else:
            buf.append(line)
    if "".join(buf).strip():
        sections.append((heading, "\n".join(buf).strip()))
    return sections


def _split_words(words: list):
    out, i = [], 0
    while i < len(words):
        out.append(" ".join(words[i:i + MAX_WORDS]))
        if i + MAX_WORDS >= len(words):
            break
        i += MAX_WORDS - OVERLAP
    return out


TABLE_MAX_WORDS = 120  # pipes and dashes cost extra tokens, so tables get smaller chunks
_SEPARATOR = re.compile(r"^\|[\s\-:|]+\|$")


def _is_table(para: str) -> bool:
    lines = [l for l in para.splitlines() if l.strip()]
    return len(lines) >= 3 and all(l.lstrip().startswith("|") for l in lines[:3])


def _pack_table(para: str):
    """Split a markdown table by rows, repeating the header row in every chunk."""
    lines = [l.strip() for l in para.splitlines() if l.strip()]
    n_head = 2 if len(lines) > 1 and _SEPARATOR.match(lines[1]) else 1
    header, rows = lines[:n_head], lines[n_head:]
    header_words = len(" ".join(header).split())
    chunks, cur, words = [], [], 0
    for row in rows:
        n = len(row.split())
        if cur and header_words + words + n > TABLE_MAX_WORDS:
            chunks.append("\n".join(header + cur))
            cur, words = [], 0
        cur.append(row)
        words += n
    if cur:
        chunks.append("\n".join(header + cur))
    return chunks


def _pack(body: str, collapse: bool):
    chunks, cur, cur_words = [], [], 0
    for para in re.split(r"\n\s*\n", body):
        if not collapse and _is_table(para):
            if cur:
                chunks.append("\n".join(cur))
                cur, cur_words = [], 0
            chunks.extend(_pack_table(para))
            continue
        para = " ".join(para.split()) if collapse else para.strip()
        if not para:
            continue
        n = len(para.split())
        if n > MAX_WORDS:  # one huge paragraph: cut by words with overlap
            if cur:
                chunks.append("\n".join(cur))
                cur, cur_words = [], 0
            chunks.extend(_split_words(para.split()))
            continue
        if cur and cur_words + n > MAX_WORDS:
            chunks.append("\n".join(cur))
            cur, cur_words = [], 0
        cur.append(para)
        cur_words += n
    if cur:
        chunks.append("\n".join(cur))
    return chunks


def chunk_page(title: str, text: str, collapse: bool = False):
    """collapse=True for PDFs, whose text has hard line breaks mid-sentence."""
    out = []
    for heading, body in _sections(text):
        prefix = f"{heading}\n" if heading and heading.lower() != title.lower() else ""
        for chunk in _pack(body, collapse):
            if len(chunk.split()) >= MIN_WORDS:
                out.append(prefix + chunk)
    return out