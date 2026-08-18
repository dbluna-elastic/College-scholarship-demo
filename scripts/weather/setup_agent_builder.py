#!/usr/bin/env python3
"""
Create Elastic Agent Builder tools and OU Met Catalog agent.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))

from agent_builder_common import kibana_url
from config import CATALOG_INDEX
from env_adapter import elasticsearch_api_key
from provisioning_tools import (
    PROVISIONING_ESQL_TOOLS,
    SUBMIT_WORKFLOW_TOOL,
    UNIFIED_AGENT_INSTRUCTIONS,
)
from setup_provisioning_agent import upsert_workflow
from setup_provisioning_index import main as ensure_provisioning_index

KIBANA_URL = kibana_url()
API_KEY = elasticsearch_api_key()

AGENT_ID = "ou-met-catalog-agent"

TOOLS: list[dict[str, Any]] = [
    {
        "id": "ou-met-search-by-tier",
        "type": "esql",
        "description": (
            "Search ou-met-catalog by data tier (live, reanalysis, research) and optional dataset name. "
            "Returns file metadata and source_url / opendap_url for Jupyter access."
        ),
        "tags": ["ou-met", "catalog"],
        "configuration": {
            "query": (
                "FROM ou-met-catalog\n"
                "| WHERE data_tier == ?tier\n"
                "| KEEP file_id, dataset_name, title, data_tier, source_url, opendap_url, access_tier\n"
                "| SORT dataset_name, title\n"
                "| LIMIT ?limit"
            ),
            "params": {
                "tier": {"type": "string", "description": "Data tier: live, reanalysis, or research"},
                "limit": {"type": "integer", "description": "Max results (default 20)"},
            },
        },
    },
    {
        "id": "ou-met-search-by-variable",
        "type": "esql",
        "description": (
            "Find catalog files containing a variable name pattern (e.g. reflectivity, temperature). "
            "Use for 'datasets that include reflectivity' questions."
        ),
        "tags": ["ou-met", "catalog", "variables"],
        "configuration": {
            "query": (
                "FROM ou-met-catalog\n"
                "| WHERE variables LIKE ?pattern\n"
                "| KEEP file_id, dataset_name, data_tier, title, variables, source_url, opendap_url\n"
                "| LIMIT ?limit"
            ),
            "params": {
                "pattern": {"type": "string", "description": "Variable pattern with wildcards, e.g. *reflectivity*"},
                "limit": {"type": "integer", "description": "Max results (default 20)"},
            },
        },
    },
    {
        "id": "ou-met-search-by-date",
        "type": "esql",
        "description": (
            "Find files whose temporal coverage overlaps a date range. "
            "Use for 'ERA5 or reanalysis for July 2024' style questions."
        ),
        "tags": ["ou-met", "catalog", "time"],
        "configuration": {
            "query": (
                "FROM ou-met-catalog\n"
                "| WHERE temporal_start <= ?end_date AND temporal_end >= ?start_date\n"
                "| KEEP file_id, dataset_name, data_tier, title, temporal_start, temporal_end, source_url\n"
                "| SORT temporal_start\n"
                "| LIMIT ?limit"
            ),
            "params": {
                "start_date": {"type": "string", "description": "Range start ISO date e.g. 2024-07-01"},
                "end_date": {"type": "string", "description": "Range end ISO date e.g. 2024-07-31"},
                "limit": {"type": "integer", "description": "Max results (default 20)"},
            },
        },
    },
    {
        "id": "ou-met-list-catalog",
        "type": "esql",
        "description": (
            "Summarize the OU meteorology data catalog: file counts and total bytes by tier and dataset."
        ),
        "tags": ["ou-met", "catalog"],
        "configuration": {
            "query": (
                "FROM ou-met-catalog\n"
                "| STATS file_count = COUNT(*), total_bytes = SUM(file_size_bytes) BY data_tier, dataset_name\n"
                "| SORT data_tier, file_count DESC\n"
                "| LIMIT 50"
            ),
            "params": {},
        },
    },
]

BUILTIN_TOOLS = [
    "platform.core.search",
    "platform.core.get_document_by_id",
    "platform.core.get_index_mapping",
    "platform.core.list_indices",
]

AGENT = {
    "id": AGENT_ID,
    "name": "OU Meteorology Data Catalog",
    "description": (
        "Hi! I help OU meteorology researchers find atmospheric data. "
        "I automatically detect whether files need VM mounting or admin approval, "
        "give you an ETA, and notify you when ready — or hand you an OPeNDAP URL immediately."
    ),
    "labels": ["ou-met", "catalog", "provisioning", "thredds", "meteorology", "demo"],
    "avatar_color": "#C62828",
    "avatar_symbol": "📡",
    "configuration": {
        "instructions": UNIFIED_AGENT_INSTRUCTIONS,
        "tools": [{"tool_ids": [t["id"] for t in TOOLS] + [t["id"] for t in PROVISIONING_ESQL_TOOLS] + [SUBMIT_WORKFLOW_TOOL["id"]] + BUILTIN_TOOLS}],
    },
}


def headers() -> dict[str, str]:
    return {
        "Authorization": f"ApiKey {API_KEY}",
        "kbn-xsrf": "true",
        "Content-Type": "application/json",
    }


def api(method: str, path: str, body: dict | None = None) -> dict:
    resp = requests.request(method, f"{KIBANA_URL}{path}", headers=headers(), json=body, timeout=90)
    if not resp.ok:
        raise RuntimeError(f"{method} {path} -> {resp.status_code}: {resp.text[:500]}")
    return resp.json() if resp.text else {}


def tool_exists(tool_id: str) -> bool:
    return requests.get(
        f"{KIBANA_URL}/api/agent_builder/tools/{tool_id}", headers=headers(), timeout=30
    ).status_code == 200


def upsert_tool(tool: dict) -> None:
    tid = tool["id"]
    if tool_exists(tid):
        payload = {k: v for k, v in tool.items() if k not in ("id", "type")}
        api("PUT", f"/api/agent_builder/tools/{tid}", payload)
        print(f"  updated tool {tid}")
    else:
        api("POST", "/api/agent_builder/tools", tool)
        print(f"  created tool {tid}")


def agent_exists() -> bool:
    return requests.get(
        f"{KIBANA_URL}/api/agent_builder/agents/{AGENT_ID}", headers=headers(), timeout=30
    ).status_code == 200


def upsert_agent() -> None:
    payload = {k: v for k, v in AGENT.items() if k != "id"}
    if agent_exists():
        api("PUT", f"/api/agent_builder/agents/{AGENT_ID}", payload)
        print(f"  updated agent {AGENT_ID}")
    else:
        api("POST", "/api/agent_builder/agents", AGENT)
        print(f"  created agent {AGENT_ID}")


def add_index_meta() -> None:
    from config import get_client

    client = get_client()
    client.indices.put_mapping(
        index=CATALOG_INDEX,
        body={
            "_meta": {
                "description": (
                    "OU School of Meteorology operational data catalog. "
                    "Metadata for NetCDF/GRIB files on THREDDS with OPeNDAP source URLs."
                )
            }
        },
    )
    print(f"  meta -> {CATALOG_INDEX}")


def setup() -> None:
    add_index_meta()
    print("Ensuring provisioning index + workflow...")
    ensure_provisioning_index()
    upsert_workflow()
    print("Creating Agent Builder tools...")
    for tool in TOOLS + PROVISIONING_ESQL_TOOLS + [SUBMIT_WORKFLOW_TOOL]:
        upsert_tool(tool)
    print("Creating catalog agent...")
    upsert_agent()
    api("POST", "/api/agent_builder/tools/_execute", {
        "tool_id": "ou-met-list-catalog", "tool_params": {}
    })
    print("  ou-met-list-catalog OK")
    print(f"\nAgent: {KIBANA_URL}/app/agent_builder/chat?agent={AGENT_ID}")


def delete_resources() -> None:
    if agent_exists():
        requests.delete(f"{KIBANA_URL}/api/agent_builder/agents/{AGENT_ID}", headers=headers(), timeout=30)
        print(f"  deleted agent {AGENT_ID}")
    for tool in TOOLS + PROVISIONING_ESQL_TOOLS + [SUBMIT_WORKFLOW_TOOL]:
        if tool_exists(tool["id"]):
            requests.delete(f"{KIBANA_URL}/api/agent_builder/tools/{tool['id']}", headers=headers(), timeout=30)
            print(f"  deleted tool {tool['id']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true")
    parser.add_argument("--delete", action="store_true")
    parser.add_argument(
        "--message",
        default="I need GFS reanalysis analysis data for September 2017.",
    )
    args = parser.parse_args()
    if args.delete:
        delete_resources()
        return
    setup()
    if args.test:
        result = api("POST", "/api/agent_builder/converse", {"agent_id": AGENT_ID, "input": args.message})
        print(json.dumps(result, indent=2)[:3500])


if __name__ == "__main__":
    main()
