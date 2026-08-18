"""
OU Meteorology Data Catalog — shared Elasticsearch client and config.
"""

from __future__ import annotations

import os
from pathlib import Path

from elasticsearch import Elasticsearch

from env_adapter import apply_to_environ, elasticsearch_api_key, elasticsearch_url, kibana_url as kb_url_fn

ROOT = Path(__file__).resolve().parents[2]
WEATHER_DIR = Path(__file__).resolve().parent
KIBANA_DIR = WEATHER_DIR / "kibana"

apply_to_environ()

CATALOG_INDEX = "ou-met-catalog"
PROVISIONING_INDEX = "provisioning-requests"
DATA_VIEW_ID = "ou-met-catalog-dv"
DASHBOARD_ID = "ou-met-catalog-dashboard"
PROVISIONING_AGENT_ID = "ou-met-provisioning-agent"
CATALOG_AGENT_ID = "ou-met-catalog-agent"


def get_client() -> Elasticsearch:
    url = elasticsearch_url()
    api_key = elasticsearch_api_key()
    if not url or not api_key:
        raise RuntimeError(
            "Set ELASTIC_ES_URL and OK_KIBANA_API_KEY (or ELASTIC_API_KEY) in .env"
        )
    return Elasticsearch(url, api_key=api_key)


def kibana_url() -> str:
    return kb_url_fn()
