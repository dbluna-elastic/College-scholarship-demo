#!/usr/bin/env python3
"""
Create ok-oja-data Agent Builder tools and agent on Gawdzilla.

Usage (from repo root):
    python3 scripts/oja/setup_agent.py

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
AGENT_ID = "ok-oja-data"

TOOLS = [
    {
        "id": "oja-youth-stats",
        "description": "Active and pending supervision counts plus average assessment risk score.",
        "query": (
            'FROM youth_profiles | STATS active_youth = COUNT(*) WHERE case_status == "Active", '
            'pending_youth = COUNT(*) WHERE case_status == "Pending" | LIMIT 1'
        ),
    },
    {
        "id": "oja-high-risk-youth",
        "description": "Youth with high or very high risk assessments, sorted by overall risk score.",
        "query": (
            'FROM assessments | WHERE risk_level IN ("High", "Very High") '
            "| SORT overall_risk_score DESC "
            "| KEEP youth_id, assessment_type, assessment_date, overall_risk_score, risk_level, recommended_supervision "
            "| LIMIT 15"
        ),
    },
    {
        "id": "oja-recidivism-summary",
        "description": "12-month recidivism rate among discharged youth in outcomes index.",
        "query": (
            "FROM outcomes | EVAL recid_flag = CASE(recidivism_12mo == true, 1, 0) "
            "| STATS recid_12mo_rate = AVG(recid_flag), discharged = COUNT(*) | LIMIT 1"
        ),
    },
    {
        "id": "oja-youth-by-id",
        "description": "Look up a youth profile by youth_id (e.g. OJA-2023-00001).",
        "query": (
            'FROM youth_profiles | WHERE youth_id == ?youth_id '
            "| KEEP youth_id, first_name, last_name, case_status, supervision_level, primary_offense, county, assigned_officer, mental_health_flag, substance_abuse_flag "
            "| LIMIT 1"
        ),
        "params": {"youth_id": {"type": "string", "description": "OJA youth ID, e.g. OJA-2023-00001"}},
    },
    {
        "id": "oja-case-notes-search",
        "description": "Recent case notes with follow-up required or negative/concerning sentiment.",
        "query": (
            'FROM case_notes | WHERE follow_up_required == true OR sentiment IN ("Negative", "Concerning") '
            "| SORT note_date DESC "
            "| KEEP note_id, youth_id, note_date, note_type, subject, sentiment, author, follow_up_required "
            "| LIMIT 10"
        ),
    },
    {
        "id": "oja-county-caseload",
        "description": "Active supervision caseload broken down by county.",
        "query": (
            'FROM youth_profiles | WHERE case_status == "Active" '
            "| STATS caseload = COUNT(*) BY county | SORT caseload DESC | LIMIT 15"
        ),
    },
]

INSTRUCTIONS = """You are the Oklahoma Office of Juvenile Affairs (OJA) data assistant.

## Data indices
- youth_profiles: demographics, offense, supervision level, placement, officer assignment
- case_notes: officer contact notes, visits, hearings, sentiment, follow-up flags
- assessments: YASI, SAVRY, LSI-R risk scores and recommended supervision
- outcomes: discharge outcomes and recidivism tracking

## Rules
1. ALWAYS use the custom oja-* ES|QL tools first. Do NOT call list_indices or generate_esql unless the user asks about index structure.
2. Map questions to tools:
   - caseload counts / overview → oja-youth-stats
   - high-risk youth → oja-high-risk-youth
   - recidivism → oja-recidivism-summary
   - specific youth → oja-youth-by-id (pass youth_id like OJA-2023-00001)
   - case notes → oja-case-notes-search
   - county workload → oja-county-caseload
3. Format percentages clearly; youth IDs use OJA-YYYY-NNNNN format.
4. All data is simulated for demo purposes only.
5. Give concise, actionable supervision recommendations for probation officers."""


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
    tool_ids = [t["id"] for t in TOOLS] + [
        "oja-supervisor-email-workflow",
        "platform.core.get_document_by_id",
    ]
    create_payload = {
        "id": AGENT_ID,
        "name": "OJA Juvenile Justice Assistant",
        "description": "Chat with Oklahoma juvenile justice supervision, assessment, and outcome data.",
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
    print("Creating OJA Agent Builder tools…")
    for tool in TOOLS:
        upsert_tool(kb, api_key, tool)
    print("Creating OJA agent…")
    upsert_agent(kb, api_key)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
