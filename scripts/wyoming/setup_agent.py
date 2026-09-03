#!/usr/bin/env python3
"""
Create wyo-classify Agent Builder tools and agent on Gawdzilla.

Usage (from repo root):
    python3 scripts/wyoming/setup_agent.py

Requires OK_KIBANA_API_KEY and OK_KIBANA_URL in .env.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENT_ID = "wyo-classify"
CORPUS_FROM = "FROM wyo-classified-*, wyo-public-share"

TOOLS = [
    {
        "id": "wyo-classify-overview",
        "description": "Total classified documents, restricted count, pending review count, and spillage-alert count.",
        "query": (
            f"{CORPUS_FROM} | STATS total_docs = COUNT(*), "
            'restricted = COUNT(*) WHERE classification.level == "restricted", '
            'pending_review = COUNT(*) WHERE classification.review.status == "pending" | LIMIT 1'
        ),
    },
    {
        "id": "wyo-classify-by-level",
        "description": "Document counts grouped by classification.level (public, internal, confidential, restricted).",
        "query": f"{CORPUS_FROM} | STATS count = COUNT(*) BY classification.level | SORT count DESC",
    },
    {
        "id": "wyo-classify-pending-queue",
        "description": "Pending review documents, lowest confidence first.",
        "query": (
            f"{CORPUS_FROM} | WHERE classification.review.status == \"pending\" "
            "| SORT classification.confidence ASC "
            "| KEEP file.name, data.owner_agency, classification.level, classification.confidence, "
            "classification.categories, data.storage_zone | LIMIT 20"
        ),
    },
    {
        "id": "wyo-classify-by-agency",
        "description": "Document counts grouped by data.owner_agency.",
        "query": (
            f"{CORPUS_FROM} | STATS count = COUNT(*) BY data.owner_agency "
            "| SORT count DESC | LIMIT 15"
        ),
    },
    {
        "id": "wyo-classify-spillage",
        "description": "Restricted documents whose storage zone is public_share.",
        "query": (
            'FROM wyo-public-share | WHERE classification.level == "restricted" '
            "| KEEP file.name, data.owner_agency, classification.level, data.storage_zone, classification.categories "
            "| LIMIT 20"
        ),
    },
    {
        "id": "wyo-classify-spillage-alerts",
        "description": "Count of documents in wyo-spillage-alerts (restricted data detected in public share).",
        "query": "FROM wyo-spillage-alerts | STATS spillage_alerts = COUNT(*) | LIMIT 1",
    },
]

INSTRUCTIONS = """You are the Wyoming ETS data classification assistant.

## Thesis
You cannot protect, retain, or share data you have not described. Elastic classifies records at ingest, keeps the label on the document, and enforces on it.

## Indices (synthetic demo data only — never treat as real Wyoming records)
- wyo-classified-public / internal / confidential / restricted
- wyo-public-share (public-share storage zone; used for the spillage demo)
- wyo-spillage-alerts (alert index when restricted lands in public_share)

## Taxonomy
Levels: public (weight < 10), internal (>= 10), confidential (>= 25), restricted (>= 55).
Categories include PII, PHI, PCI, CJI, FTI, FERPA, PUBLIC_RECORD.
Pending review: confidence below 0.80, or planted-ambiguous governor press files.
Hold-out planted file: spillage_immunization.pdf — ingest with zone public_share to fire the spillage rule.

## Rules
1. ALWAYS use the custom wyo-classify-* ES|QL tools first. Do NOT call list_indices or generate_esql unless the user asks about index structure.
2. Map questions to tools:
   - snapshot / how many / restricted / pending counts → wyo-classify-overview (and wyo-classify-spillage-alerts for alerts)
   - by level → wyo-classify-by-level
   - pending queue / lowest confidence → wyo-classify-pending-queue
   - agencies / WDH / WYDOT / Governor → wyo-classify-by-agency
   - public share / spillage / immunization PDF → wyo-classify-spillage then wyo-classify-spillage-alerts
3. Say out loud that this is synthetic data.
4. Confirm/override of labels is done in the review console, not in this chat.
5. Records clerk vs privacy officer is a Kibana DLS/FLS role switch, not this chat.
6. Give concise, actionable answers for ETS privacy officers and records clerks."""


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


def request(url: str, api_key: str, method: str = "GET", body: dict | None = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"ApiKey {api_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("kbn-xsrf", "true")
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8")
        raise RuntimeError(f"{method} {url} -> {e.code}: {detail[:500]}") from e


def upsert_tool(kb: str, api_key: str, tool: dict) -> None:
    tool_id = tool["id"]
    payload = {
        "id": tool_id,
        "type": "esql",
        "description": tool["description"],
        "configuration": {
            "query": tool["query"],
            "params": tool.get("params", {}),
        },
    }
    try:
        request(f"{kb}/api/agent_builder/tools/{tool_id}", api_key)
        request(
            f"{kb}/api/agent_builder/tools/{tool_id}",
            api_key,
            "PUT",
            {"description": payload["description"], "configuration": payload["configuration"]},
        )
        print(f"  [tool {tool_id}] updated")
    except RuntimeError as e:
        if "404" not in str(e):
            raise
        request(f"{kb}/api/agent_builder/tools", api_key, "POST", payload)
        print(f"  [tool {tool_id}] created")


def upsert_agent(kb: str, api_key: str) -> None:
    tool_ids = [t["id"] for t in TOOLS] + ["platform.core.get_document_by_id"]
    create_payload = {
        "id": AGENT_ID,
        "name": "Wyoming ETS Classification Assistant",
        "description": "Chat with synthetic Wyoming ETS classified records: levels, pending review, agencies, and public-share spillage.",
        "configuration": {
            "instructions": INSTRUCTIONS,
            "tools": [{"tool_ids": tool_ids}],
            "enable_elastic_capabilities": False,
            "workflow_ids": [],
        },
    }
    update_payload = {k: v for k, v in create_payload.items() if k != "id"}
    try:
        request(f"{kb}/api/agent_builder/agents/{AGENT_ID}", api_key)
        request(f"{kb}/api/agent_builder/agents/{AGENT_ID}", api_key, "PUT", update_payload)
        print(f"  [agent {AGENT_ID}] updated")
    except RuntimeError as e:
        if "404" not in str(e):
            raise
        request(f"{kb}/api/agent_builder/agents", api_key, "POST", create_payload)
        print(f"  [agent {AGENT_ID}] created")


def main() -> int:
    load_dotenv()
    api_key = os.environ.get("OK_KIBANA_API_KEY") or os.environ.get("ELASTIC_API_KEY", "")
    kb = os.environ.get("OK_KIBANA_URL", "https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com").rstrip("/")
    if not api_key:
        print("Set OK_KIBANA_API_KEY in .env", file=sys.stderr)
        return 1

    print(f"Kibana: {kb}")
    print("Creating Wyoming classification Agent Builder tools…")
    for tool in TOOLS:
        upsert_tool(kb, api_key, tool)
    print("Creating Wyoming classification agent…")
    upsert_agent(kb, api_key)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
