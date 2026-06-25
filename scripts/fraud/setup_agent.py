#!/usr/bin/env python3
"""
Create ok-fraud Agent Builder tools and agent on Gawdzilla.

Usage (from repo root):
    python3 scripts/fraud/setup_agent.py

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
AGENT_ID = "ok-fraud"

TOOLS = [
    {
        "id": "ok-fraud-ytd-loss",
        "description": "Year-to-date total potential fraud loss from ok-fraud-phantom-billing.",
        "query": "FROM ok-fraud-phantom-billing | STATS total_loss = SUM(Total_Loss_Value) | LIMIT 1",
    },
    {
        "id": "ok-fraud-flagged-claims",
        "description": "Total count of flagged fraud claims (Flag_Type is not null).",
        "query": (
            "FROM ok-fraud-phantom-billing | WHERE Flag_Type IS NOT NULL "
            "| STATS total_claims_flagged = COUNT(*) | LIMIT 1"
        ),
    },
    {
        "id": "ok-fraud-high-risk",
        "description": "Count of high-risk fraud claims with Risk_Score >= 75.",
        "query": "FROM ok-fraud* | WHERE Risk_Score >= 75 | STATS high_risk = COUNT(*) | LIMIT 1",
    },
    {
        "id": "ok-fraud-loss-by-flag",
        "description": "Fraud loss totals grouped by Flag_Type, highest loss first.",
        "query": (
            "FROM ok-fraud* | WHERE Flag_Type IS NOT NULL "
            "| STATS total_loss = SUM(Total_Loss_Value) BY Flag_Type "
            "| SORT total_loss DESC | LIMIT 5"
        ),
    },
    {
        "id": "ok-fraud-resolution-rate",
        "description": "Investigation resolution rate: share of flagged claims with assigned investigator.",
        "query": (
            "FROM ok-fraud* | WHERE Flag_Type IS NOT NULL "
            "| STATS total = COUNT(*), assigned = COUNT(Investigator_Assigned) "
            "| EVAL resolution_pct = CASE(total > 0, assigned * 100.0 / total, null) "
            "| LIMIT 1"
        ),
    },
    {
        "id": "ok-fraud-high-priority",
        "description": "Top high-priority fraud cases (Risk_Score >= 80) with claim and loss details.",
        "query": (
            "FROM ok-fraud* | WHERE Risk_Score >= 80 AND Medicaid_Recipient_ID IS NOT NULL "
            "| EVAL Priority = CASE("
            'Risk_Score >= 90 AND Total_Loss_Value >= 10000, "Critical", '
            'Risk_Score >= 80 AND Total_Loss_Value >= 5000, "High", '
            '"Medium") '
            "| KEEP `@timestamp`, Claim_ID, Patient_ID, Medicaid_Recipient_ID, Flag_Type, "
            "Total_Loss_Value, Amount_Submitted, Investigator_Assigned, Agency_Type, Priority "
            "| LIMIT 15"
        ),
    },
    {
        "id": "ok-crisis-stats",
        "description": "Crisis call center KPIs: average answer time, total calls, average MCOT arrival time.",
        "query": (
            "FROM ok-* | WHERE Call_Start_Timestamp IS NOT NULL AND Call_Answer_Timestamp IS NOT NULL "
            "| EVAL answer_seconds = DATE_DIFF(\"s\", Call_Start_Timestamp, Call_Answer_Timestamp) "
            "| STATS avg_answer = AVG(answer_seconds), calls = COUNT(*) | LIMIT 1"
        ),
    },
    {
        "id": "ok-clinical-relapse",
        "description": "Statewide behavioral health relapse rate from ok-* outcome records.",
        "query": (
            "FROM ok-* | WHERE Relapse_Occurred IS NOT NULL "
            "| STATS relapse_rate = AVG(CASE(Relapse_Occurred == true, 1.0, 0.0)) "
            "| LIMIT 1"
        ),
    },
]

INSTRUCTIONS = """You are the ODMHSAS staff analytics assistant for Medicaid fraud, crisis services, and clinical outcomes.

## Data indices
- ok-fraud-phantom-billing / ok-fraud-*: Medicaid fraud claims, risk scores, investigators
- ok-*: crisis call center timestamps, MCOT dispatch, client relapse outcomes
- ok-client: active behavioral health clients

## Rules
1. ALWAYS use ok-fraud-*, ok-crisis-*, and ok-clinical-* tools first. Do NOT use generate_esql for mapped questions.
2. Map questions to tools:
   - YTD fraud loss / exposure → ok-fraud-ytd-loss
   - flagged claims count → ok-fraud-flagged-claims
   - high-risk claims → ok-fraud-high-risk
   - loss by flag type → ok-fraud-loss-by-flag
   - investigation resolution → ok-fraud-resolution-rate
   - top cases / high priority → ok-fraud-high-priority
   - crisis call center / answer time / MCOT → ok-crisis-stats
   - relapse rate → ok-clinical-relapse
3. Format currency as USD and percentages clearly.
4. All data is simulated for demo purposes only.
5. Give concise, actionable summaries for authorized staff."""


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
        "tags": tool.get("tags", ["ok-fraud", "odmhsas"]),
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
            {
                "description": payload["description"],
                "tags": payload["tags"],
                "configuration": payload["configuration"],
            },
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
        "name": "ODMHSAS Fraud & Outcomes Assistant",
        "description": "Chat with Medicaid fraud, crisis call center, and clinical outcome data for Oklahoma.",
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
    print("Creating ok-fraud ES|QL tools…")
    for tool in TOOLS:
        upsert_tool(kb, api_key, tool)
    print("Creating ok-fraud agent…")
    upsert_agent(kb, api_key)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
