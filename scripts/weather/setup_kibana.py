#!/usr/bin/env python3
"""
Create Kibana data view, saved search, and dashboard for OU Met Catalog.
"""

from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog_jupyterlite import generator_public_base, jupyterlite_base
from config import CATALOG_INDEX, DASHBOARD_ID, KIBANA_DIR, kibana_url
from env_adapter import elasticsearch_api_key

API_KEY = elasticsearch_api_key()

SAVED_SEARCH_ID = "ou-met-catalog-search"
MAP_LENS_ID = "ou-met-catalog-map"


def headers(content_type: str = "application/json") -> dict[str, str]:
    h = {"Authorization": f"ApiKey {API_KEY}", "kbn-xsrf": "true"}
    if content_type:
        h["Content-Type"] = content_type
    return h


def get_or_create_data_view() -> str:
    kb = kibana_url()
    list_resp = requests.get(f"{kb}/api/data_views", headers=headers(), timeout=30)
    list_resp.raise_for_status()
    for dv in list_resp.json().get("data_view", []):
        if dv.get("title") == CATALOG_INDEX:
            print(f"  data view exists: {dv['id']}")
            return dv["id"]

    payload = {
        "data_view": {
            "title": CATALOG_INDEX,
            "name": "OU Meteorology Data Catalog",
            "timeFieldName": "temporal_start",
        }
    }
    resp = requests.post(f"{kb}/api/data_views/data_view", headers=headers(), json=payload, timeout=30)
    resp.raise_for_status()
    dv_id = resp.json()["data_view"]["id"]
    print(f"  created data view: {dv_id}")
    return dv_id


def configure_jupyterlite_field_format(dv_id: str) -> None:
    """URL formatter so Discover renders jupyterlite_launch_url as 'Open in JupyterLite'."""
    kb = kibana_url()
    get_resp = requests.get(f"{kb}/api/data_views/data_view/{dv_id}", headers=headers(), timeout=30)
    get_resp.raise_for_status()
    dv = get_resp.json()["data_view"]

    field_formats = dv.get("fieldFormats") or {}
    field_formats["jupyterlite_launch_url"] = {
        "id": "url",
        "params": {
            "urlTemplate": "{{value}}",
            "labelTemplate": "Open in JupyterLite",
        },
    }

    payload = {
        "data_view": {
            "title": dv["title"],
            "name": dv.get("name"),
            "timeFieldName": dv.get("timeFieldName"),
            "fieldFormats": field_formats,
        }
    }
    resp = requests.post(
        f"{kb}/api/data_views/data_view/{dv_id}",
        headers=headers(),
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    print("  field format: jupyterlite_launch_url -> Open in JupyterLite")


def create_saved_search(dv_id: str) -> None:
    kb = kibana_url()
    search_source = {
        "index": dv_id,
        "query": {"language": "kuery", "query": "*"},
        "filter": [],
    }
    attributes = {
        "title": "OU Met Catalog — All Files",
        "description": "All indexed NetCDF/GRIB metadata records",
        "columns": [
            "title",
            "dataset_name",
            "data_tier",
            "file_format",
            "jupyterlite_launch_url",
            "opendap_url",
            "file_size_bytes",
        ],
        "sort": [["temporal_start", "desc"]],
        "kibanaSavedObjectMeta": {"searchSourceJSON": json.dumps(search_source)},
    }
    resp = requests.post(
        f"{kb}/api/saved_objects/search/{SAVED_SEARCH_ID}",
        headers=headers(),
        json={"attributes": attributes, "references": [
            {"id": dv_id, "name": "kibanaSavedObjectMeta.searchSourceJSON.index", "type": "index-pattern"}
        ]},
        timeout=30,
    )
    if resp.status_code in (200, 409):
        print(f"  saved search: {SAVED_SEARCH_ID}")
    else:
        # overwrite
        requests.put(
            f"{kb}/api/saved_objects/search/{SAVED_SEARCH_ID}",
            headers=headers(),
            json={"attributes": attributes, "references": [
                {"id": dv_id, "name": "kibanaSavedObjectMeta.searchSourceJSON.index", "type": "index-pattern"}
            ]},
            timeout=30,
        )
        print(f"  updated saved search: {SAVED_SEARCH_ID}")


def create_dashboard(dv_id: str) -> None:
    """Create a simple dashboard with saved search table panel."""
    kb = kibana_url()
    panel_id = str(uuid.uuid4())

    panels = [
        {
            "version": "9.4.2",
            "type": "search",
            "gridData": {"x": 0, "y": 0, "w": 48, "h": 20, "i": panel_id},
            "panelIndex": panel_id,
            "embeddableConfig": {"enhancements": {}},
            "panelRefName": f"panel_{panel_id}",
        }
    ]

    attributes = {
        "title": "OU Meteorology Data Catalog",
        "description": "Search NetCDF/GRIB metadata by tier, time, and geography. Click Open in JupyterLite to preview via OPeNDAP in the browser.",
        "panelsJSON": json.dumps(panels),
        "optionsJSON": json.dumps({"useMargins": True, "syncColors": False, "syncCursor": True, "syncTooltips": False}),
        "version": 1,
        "timeRestore": False,
        "kibanaSavedObjectMeta": {
            "searchSourceJSON": json.dumps({"query": {"language": "kuery", "query": ""}, "filter": []})
        },
    }

    references = [
        {"id": SAVED_SEARCH_ID, "name": f"panel_{panel_id}", "type": "search"},
    ]

    resp = requests.post(
        f"{kb}/api/saved_objects/dashboard/{DASHBOARD_ID}",
        headers=headers(),
        json={"attributes": attributes, "references": references},
        timeout=30,
    )
    if resp.status_code not in (200, 409):
        requests.put(
            f"{kb}/api/saved_objects/dashboard/{DASHBOARD_ID}",
            headers=headers(),
            json={"attributes": attributes, "references": references},
            timeout=30,
        )
    print(f"  dashboard: {DASHBOARD_ID}")


def export_ndjson(dv_id: str) -> None:
    """Write minimal NDJSON artifact for reproducibility."""
    KIBANA_DIR.mkdir(parents=True, exist_ok=True)
    ndjson_path = KIBANA_DIR / "ou-met-catalog-dashboard.ndjson"
    lines = [
        {
            "id": DASHBOARD_ID,
            "type": "dashboard",
            "namespaces": ["default"],
            "attributes": {"title": "OU Meteorology Data Catalog"},
            "references": [{"id": SAVED_SEARCH_ID, "type": "search", "name": "panel_1"}],
        }
    ]
    with open(ndjson_path, "w") as f:
        for obj in lines:
            f.write(json.dumps(obj) + "\n")
    print(f"  wrote {ndjson_path}")


def main() -> None:
    print("Setting up Kibana...")
    dv_id = get_or_create_data_view()
    configure_jupyterlite_field_format(dv_id)
    create_saved_search(dv_id)
    create_dashboard(dv_id)
    export_ndjson(dv_id)
    kb = kibana_url()
    print(f"\nDashboard: {kb}/app/dashboards#/view/{DASHBOARD_ID}")
    print(f"Discover:  {kb}/app/discover#/?_a=(index:'{CATALOG_INDEX}')")
    print(f"JupyterLite: {jupyterlite_base()}")
    print(f"Generator:   {generator_public_base()}/nb")
    print(f"Map tip:     In Discover, add geo_bbox field to Maps — filter with {KIBANA_DIR}/filters/oklahoma_bbox.json")


if __name__ == "__main__":
    main()
