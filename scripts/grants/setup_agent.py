#!/usr/bin/env python3
"""
Create ok-grants-data Agent Builder tools and agent on Gawdzilla.

Usage (from repo root):
    python3 scripts/grants/setup_agent.py

Requires OK_KIBANA_API_KEY and OK_KIBANA_URL in .env.
Run scripts/grants/setup_workflow.py after this to attach the email workflow tool.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENT_ID = "ok-grants-data"
WORKFLOW_TOOL_ID = "ok-grants-program-email-workflow"

TOOLS = [
    {
        "id": "ok-grants-portfolio-stats",
        "description": "Count active, forecasted, and closed grants in ok-grant-data.",
        "query": (
            'FROM ok-grant-data '
            "| STATS total = COUNT(*), active = COUNT(CASE(status == \"active\", 1, null)), "
            'forecasted = COUNT(CASE(status == "forecasted", 1, null)), '
            'closed = COUNT(CASE(status == "closed", 1, null)) '
            "| LIMIT 1"
        ),
    },
    {
        "id": "ok-grants-search",
        "description": "Keyword search grant title, purpose, and category in ok-grant-data (max 8 results).",
        "query": (
            "FROM ok-grant-data "
            "| WHERE Grant_Title LIKE CONCAT(\"*\", ?keyword, \"*\") "
            "OR Title LIKE CONCAT(\"*\", ?keyword, \"*\") "
            "OR Purpose LIKE CONCAT(\"*\", ?keyword, \"*\") "
            "OR Category LIKE CONCAT(\"*\", ?keyword, \"*\") "
            "| KEEP Grant_Title, Title, status, Category, State_Agency, Deadline, Purpose "
            "| LIMIT 8"
        ),
        "params": {"keyword": {"type": "string", "description": "Search keyword, e.g. broadband or workforce"}},
    },
    {
        "id": "ok-grants-by-status",
        "description": "Filter grants by status: active, forecasted, or closed.",
        "query": (
            'FROM ok-grant-data | WHERE status == ?status '
            "| KEEP Grant_Title, Title, status, Category, State_Agency, Deadline "
            "| SORT Deadline ASC | LIMIT 8"
        ),
        "params": {"status": {"type": "string", "description": "active, forecasted, or closed"}},
    },
    {
        "id": "ok-grants-by-category",
        "description": "Filter grants by category (workforce, infrastructure, health, education, etc.).",
        "query": (
            'FROM ok-grant-data | WHERE Category LIKE CONCAT("*", ?category, "*") '
            "| KEEP Grant_Title, Title, status, Category, State_Agency, Deadline "
            "| SORT Deadline ASC | LIMIT 8"
        ),
        "params": {"category": {"type": "string", "description": "Category keyword, e.g. workforce or health"}},
    },
    {
        "id": "ok-grants-by-applicant",
        "description": "Filter grants by eligible applicant type (business, nonprofit, public, tribal, individual).",
        "query": (
            'FROM ok-grant-data | WHERE eligible_applicant LIKE CONCAT("*", ?applicant, "*") '
            "OR Eligible_Applicant LIKE CONCAT(\"*\", ?applicant, \"*\") "
            "| KEEP Grant_Title, Title, status, Category, eligible_applicant, Deadline "
            "| LIMIT 8"
        ),
        "params": {"applicant": {"type": "string", "description": "Applicant type, e.g. business or nonprofit"}},
    },
    {
        "id": "ok-grants-deadlines",
        "description": "Upcoming grant deadlines, soonest first (non-closed grants).",
        "query": (
            'FROM ok-grant-data | WHERE status != "closed" AND Deadline IS NOT NULL '
            "| KEEP Grant_Title, Title, status, Deadline, State_Agency, Category "
            "| SORT Deadline ASC | LIMIT 10"
        ),
    },
    {
        "id": "ok-grants-by-id",
        "description": "Look up a single grant by portal or program ID (e.g. g4).",
        "query": (
            "FROM ok-grant-data "
            "| WHERE Portal_ID == ?grant_id OR Grant_Program_ID == ?grant_id OR _id == ?grant_id "
            "| LIMIT 1"
        ),
        "params": {"grant_id": {"type": "string", "description": "Grant portal ID, e.g. g4"}},
    },
]

INSTRUCTIONS = """You are the Carey Grant Bot — Oklahoma state grant opportunities assistant.

## Data index
- ok-grant-data: state grant programs with title, status, category, agency, deadlines, eligibility

## Rules
1. ALWAYS use ok-grants-* tools first. Do NOT use generate_esql or broad platform search for questions that match these tools.
2. Map questions to tools:
   - counts / portfolio overview → ok-grants-portfolio-stats
   - active / forecasted / closed lists → ok-grants-by-status
   - category (workforce, broadband, health, education) → ok-grants-by-category
   - applicant type (business, nonprofit, public, tribal) → ok-grants-by-applicant
   - keyword search → ok-grants-search
   - deadlines → ok-grants-deadlines
   - specific program ID → ok-grants-by-id
3. Keep answers concise: bullet list with title, status, deadline, agency.
4. For eligibility or how to apply, cite fields from the grant document.
5. Use ok-grants-program-email-workflow when asked to draft program-officer outreach email."""


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
        "tags": tool.get("tags", ["ok-grants", "okagency"]),
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
        "name": "Carey Grant Bot",
        "description": "Chat with Oklahoma state grant opportunities in ok-grant-data.",
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
    print("Creating Carey Grant Bot ES|QL tools…")
    for tool in TOOLS:
        upsert_tool(kb, api_key, tool)
    print("Creating ok-grants-data agent…")
    upsert_agent(kb, api_key)
    print("Done. Run scripts/grants/setup_workflow.py if the email workflow tool is not yet deployed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
