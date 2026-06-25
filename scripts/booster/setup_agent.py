#!/usr/bin/env python3
"""
Create booster-donor-data Agent Builder tools and agent on Gawdzilla.

Usage (from repo root):
    python3 scripts/booster/setup_agent.py

Requires OK_KIBANA_API_KEY and OK_KIBANA_URL in .env.
Run scripts/booster/setup_workflow.py after this to ensure the alumni email workflow tool exists.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENT_ID = "booster-donor-data"
WORKFLOW_TOOL_ID = "booster-alumni-email-workflow"

TOOLS = [
    {
        "id": "booster-donor-portfolio-stats",
        "description": "Aggregate donor count, average affinity score, and total lifetime giving from athletic-boosters.",
        "query": (
            "FROM athletic-boosters "
            "| STATS avg_affinity = AVG(affinity_score), total_lifetime = SUM(`giving_history.lifetime_total`), donor_count = COUNT(*) "
            "| LIMIT 1"
        ),
    },
    {
        "id": "booster-at-risk-donors",
        "description": "Donors with low affinity or low email engagement, sorted by affinity ascending.",
        "query": (
            "FROM athletic-boosters "
            "| WHERE affinity_score < 40 OR `engagement.email_open_rate_90d` < 0.2 "
            "| SORT affinity_score ASC "
            "| KEEP donor_id, first_name, last_name, affinity_score, `giving_history.lifetime_total`, `engagement.email_open_rate_90d`, `giving_history.last_gift_date` "
            "| LIMIT 25"
        ),
    },
    {
        "id": "booster-at-risk-major-gifts",
        "description": "Major gift donors (lifetime >= $50k) with declining engagement signals.",
        "query": (
            "FROM athletic-boosters "
            "| WHERE `giving_history.lifetime_total` >= 50000 AND (affinity_score < 45 OR `engagement.email_open_rate_90d` < 0.15) "
            "| SORT `giving_history.lifetime_total` DESC "
            "| KEEP donor_id, first_name, last_name, affinity_score, `giving_history.lifetime_total`, `giving_history.last_gift_date`, `engagement.email_open_rate_90d` "
            "| LIMIT 15"
        ),
    },
    {
        "id": "booster-top-affinity-donors",
        "description": "Top affinity donors for athletic advancement intelligence.",
        "query": (
            "FROM athletic-boosters "
            "| SORT affinity_score DESC "
            "| KEEP donor_id, first_name, last_name, affinity_score, `giving_history.lifetime_total`, degree, graduation_year, `wealth_signals.estimated_capacity` "
            "| LIMIT 10"
        ),
    },
    {
        "id": "booster-donor-by-id",
        "description": "Look up a single booster donor profile by donor_id (e.g. ALUM-10001).",
        "query": (
            "FROM athletic-boosters | WHERE donor_id == ?donor_id "
            "| KEEP donor_id, first_name, last_name, email, graduation_year, degree, affinity_score, "
            "`giving_history.lifetime_total`, `giving_history.last_gift_date`, `engagement.email_open_rate_90d`, "
            "`engagement.game_attendance_count`, portfolio_status, bio_text "
            "| LIMIT 1"
        ),
        "params": {"donor_id": {"type": "string", "description": "Donor ID, e.g. ALUM-10001"}},
    },
    {
        "id": "booster-engagement-events-summary",
        "description": "Engagement event breakdown by event_type from booster-engagement-events.",
        "query": (
            "FROM booster-engagement-events "
            "| STATS events = COUNT(*) BY event_type "
            "| SORT events DESC | LIMIT 8"
        ),
    },
    {
        "id": "booster-case-metrics",
        "description": "At-risk case metrics from booster-case-metrics index.",
        "query": (
            "FROM booster-case-metrics "
            "| KEEP metric_type, count, severity, tags, `@timestamp` "
            "| LIMIT 20"
        ),
    },
]

INSTRUCTIONS = """You are the Texas College Athletic Advancement donor intelligence assistant.

## Data indices
- athletic-boosters: donor profiles, affinity scores, giving history, engagement rates
- booster-engagement-events: portal logins, email opens, game attendance signals
- booster-case-metrics: at-risk portfolio case metrics

## Rules
1. ALWAYS use booster-* ES|QL tools first. Do NOT call list_indices or generate_esql unless asked about index structure.
2. Map questions to tools:
   - portfolio stats / donor counts → booster-donor-portfolio-stats
   - at-risk donors → booster-at-risk-donors
   - at-risk major gifts → booster-at-risk-major-gifts
   - top affinity donors → booster-top-affinity-donors
   - specific donor (ALUM-*) → booster-donor-by-id
   - engagement events → booster-engagement-events-summary
   - case metrics → booster-case-metrics
   - alumni outreach email → booster-alumni-email-workflow
3. Format currency as USD. Donor IDs use ALUM-NNNNN format.
4. Tie insights to advancement: re-engage at-risk major gifts, prioritize high-affinity prospects.
5. All data is simulated for demo purposes only."""


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
        "tags": tool.get("tags", ["booster", "texas-college"]),
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
    tool_ids = [t["id"] for t in TOOLS] + [
        WORKFLOW_TOOL_ID,
        "platform.core.get_document_by_id",
    ]
    create_payload = {
        "id": AGENT_ID,
        "name": "Texas College Booster Donor Assistant",
        "description": "Chat with athletic booster donor affinity, engagement, and at-risk gift data.",
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
    print("Creating booster donor ES|QL tools…")
    for tool in TOOLS:
        upsert_tool(kb, api_key, tool)
    print("Creating booster-donor-data agent…")
    upsert_agent(kb, api_key)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
