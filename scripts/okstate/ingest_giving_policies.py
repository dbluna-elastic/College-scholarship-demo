#!/usr/bin/env python3
"""Fetch official OSU giving pages and index them into okstate-giving-policies.

Usage (from repo root):
    python3 scripts/okstate/ingest_giving_policies.py

Requires OK_KIBANA_API_KEY (or ELASTIC_API_KEY) and optional OK_ELASTIC_ES_URL in .env.
"""

from __future__ import annotations

import hashlib
import html as html_lib
import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from giving_sources import GIVING_SOURCES

INDEX = "okstate-giving-policies"
CHUNK_SIZE = 3200
USER_AGENT = "CollegeScholarshipDemo/1.0 (OSU giving policy ingest)"

INDEX_BODY = {
    "settings": {"number_of_shards": 1, "number_of_replicas": 1},
    "mappings": {
        "_meta": {
            "description": (
                "Public OSU Foundation and Oklahoma State University gift-acceptance rules. "
                "Use for how to give, gift types, gifts-in-kind, appraisals, titled vehicles, "
                "international/OFAC gifts, and donor privacy. Do not use for athletic booster "
                "affinity scores or at-risk donor lists."
            )
        },
        "properties": {
            "url": {"type": "keyword"},
            "title": {"type": "text", "fields": {"keyword": {"type": "keyword", "ignore_above": 256}}},
            "topic": {"type": "keyword"},
            "body": {"type": "text"},
            "chunk": {"type": "integer"},
            "retrieved_at": {"type": "date"},
        },
    },
}


class HtmlTextExtractor(HTMLParser):
    SKIP_TAGS = {"script", "style", "nav", "footer", "noscript", "svg", "header"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip = 0
        self.title_parts: list[str] = []
        self._in_title = False

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in self.SKIP_TAGS:
            self.skip += 1
        if tag == "title":
            self._in_title = True
        if tag in {"p", "div", "br", "li", "h1", "h2", "h3", "h4", "tr", "section"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        if tag in self.SKIP_TAGS and self.skip:
            self.skip -= 1
        if tag in {"p", "div", "li", "h1", "h2", "h3", "h4"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if self.skip:
            return
        text = data.strip()
        if text:
            self.parts.append(text + " ")


def load_dotenv() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def es_request(es_url: str, api_key: str, path: str, method: str = "GET", body=None, content_type: str = "application/json"):
    data = None
    if body is not None:
        data = body if isinstance(body, (bytes, bytearray)) else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{es_url.rstrip('/')}{path}",
        data=data,
        method=method,
        headers={"Authorization": f"ApiKey {api_key}", "Content-Type": content_type},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} -> {e.code}: {detail[:500]}") from e


def fetch_url(url: str) -> tuple[str, bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/pdf,*/*"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx, timeout=45) as resp:
        content_type = resp.headers.get("Content-Type", "")
        return resp.geturl(), resp.read(), content_type


def html_to_text(raw: bytes) -> tuple[str, str]:
    html = raw.decode("utf-8", errors="replace")
    parser = HtmlTextExtractor()
    parser.feed(html)
    title = html_lib.unescape(" ".join(parser.title_parts)).strip()
    body = html_lib.unescape("".join(parser.parts))
    body = re.sub(r"[ \t]+", " ", body)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    return title, body


def chunk_text(text: str, size: int = CHUNK_SIZE) -> list[str]:
    if not text:
        return []
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        candidate = f"{current}\n\n{para}".strip() if current else para
        if len(candidate) <= size:
            current = candidate
            continue
        if current:
            chunks.append(current)
        if len(para) <= size:
            current = para
        else:
            for i in range(0, len(para), size):
                piece = para[i : i + size].strip()
                if piece:
                    chunks.append(piece)
            current = ""
    if current:
        chunks.append(current)
    return chunks or [text[:size]]


def doc_id(url: str, chunk: int) -> str:
    digest = hashlib.sha256(f"{url}:{chunk}".encode("utf-8")).hexdigest()[:20]
    return f"osu-giving-{digest}"


def recreate_index(es_url: str, api_key: str) -> None:
    try:
        es_request(es_url, api_key, f"/{INDEX}", "DELETE")
        print(f"  [index {INDEX}] deleted")
    except RuntimeError as e:
        if "404" not in str(e):
            raise
    es_request(es_url, api_key, f"/{INDEX}", "PUT", INDEX_BODY)
    print(f"  [index {INDEX}] created")


def bulk_index(es_url: str, api_key: str, docs: list[dict]) -> None:
    lines: list[str] = []
    for doc in docs:
        lines.append(json.dumps({"index": {"_index": INDEX, "_id": doc["_id"]}}))
        body = {k: v for k, v in doc.items() if k != "_id"}
        lines.append(json.dumps(body))
    payload = ("\n".join(lines) + "\n").encode("utf-8")
    result = es_request(es_url, api_key, "/_bulk", "POST", payload, "application/x-ndjson")
    if result.get("errors"):
        failed = [i for i in result.get("items", []) if i.get("index", {}).get("error")]
        raise RuntimeError(f"Bulk index errors: {json.dumps(failed[:2], indent=2)}")
    print(f"  Indexed {len(docs)} chunks into {INDEX}")


def pointer_docs(source: dict, retrieved_at: str, reason: str) -> list[dict]:
    fallback = (source.get("fallback_body") or "").strip()
    if not fallback:
        print(f"  SKIP {source['url']} ({reason})")
        return []
    print(f"  POINTER {source['url']} ({reason})")
    return [{
        "_id": doc_id(source["url"], 0),
        "url": source["url"],
        "title": source.get("title") or source["url"],
        "topic": source["topic"],
        "body": fallback,
        "chunk": 0,
        "retrieved_at": retrieved_at,
    }]


def ingest_source(source: dict, retrieved_at: str) -> list[dict]:
    url = source["url"]
    try:
        final_url, raw, content_type = fetch_url(url)
    except Exception as exc:
        return pointer_docs(source, retrieved_at, str(exc))

    is_pdf = "pdf" in content_type.lower() or url.lower().endswith(".pdf") or raw[:5] == b"%PDF-"
    if is_pdf:
        return pointer_docs(source, retrieved_at, "PDF skipped; HTML ingest only")

    page_title, body = html_to_text(raw)
    if len(body) < 80:
        return pointer_docs(source, retrieved_at, f"too little text: {len(body)} chars")

    title = source.get("title") or page_title or url
    docs = []
    for i, chunk in enumerate(chunk_text(body)):
        docs.append({
            "_id": doc_id(final_url, i),
            "url": final_url,
            "title": title,
            "topic": source["topic"],
            "body": chunk,
            "chunk": i,
            "retrieved_at": retrieved_at,
        })
    print(f"  {url} -> {len(docs)} chunk(s), {len(body)} chars")
    return docs


def main() -> int:
    load_dotenv()
    api_key = os.environ.get("OK_KIBANA_API_KEY") or os.environ.get("ELASTIC_API_KEY", "")
    es_url = os.environ.get(
        "OK_ELASTIC_ES_URL",
        os.environ.get("ELASTIC_ES_URL", "https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com:443"),
    )
    if not api_key:
        print("Please add OK_KIBANA_API_KEY to your .env file.", file=sys.stderr)
        return 1

    retrieved_at = datetime.now(timezone.utc).isoformat()
    print(f"Elasticsearch: {es_url}")
    recreate_index(es_url, api_key)

    seen_urls: set[str] = set()
    docs: list[dict] = []
    for source in GIVING_SOURCES:
        if source["url"] in seen_urls:
            continue
        seen_urls.add(source["url"])
        docs.extend(ingest_source(source, retrieved_at))

    if not docs:
        print("No documents ingested.", file=sys.stderr)
        return 1

    bulk_index(es_url, api_key, docs)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
