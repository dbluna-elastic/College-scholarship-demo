"""
Map College scholarship demo .env variables to weatherdata script names.
"""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


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


load_dotenv()


def elasticsearch_url() -> str:
    return (
        os.getenv("ELASTIC_ES_URL")
        or os.getenv("ELASTICSEARCH_URL")
        or ""
    ).rstrip("/")


def kibana_url() -> str:
    return (
        os.getenv("OK_KIBANA_URL")
        or os.getenv("ELASTIC_KB_URL")
        or os.getenv("KIBANA_URL")
        or ""
    ).rstrip("/")


def elasticsearch_api_key() -> str:
    return (
        os.getenv("OK_KIBANA_API_KEY")
        or os.getenv("ELASTIC_API_KEY")
        or os.getenv("ELASTICSEARCH_API_KEY")
        or ""
    )


def apply_to_environ() -> None:
    """Expose weatherdata-style env names for ported scripts."""
    es_url = elasticsearch_url()
    kb_url = kibana_url()
    api_key = elasticsearch_api_key()
    if es_url:
        os.environ.setdefault("ELASTICSEARCH_URL", es_url)
        os.environ.setdefault("ELASTIC_ES_URL", es_url)
    if kb_url:
        os.environ.setdefault("KIBANA_URL", kb_url)
        os.environ.setdefault("ELASTIC_KB_URL", kb_url)
        os.environ.setdefault("OK_KIBANA_URL", kb_url)
    if api_key:
        os.environ.setdefault("ELASTICSEARCH_API_KEY", api_key)
        os.environ.setdefault("ELASTIC_API_KEY", api_key)
        os.environ.setdefault("OK_KIBANA_API_KEY", api_key)
