#!/usr/bin/env python3
"""
Create per-template scholarship Agent Builder agents on Gawdzilla.

Usage (from repo root):
    python3 scripts/scholarship/setup_agents.py

Requires ELASTIC_API_KEY (or OK_KIBANA_API_KEY) and ELASTIC_KB_URL in .env.
Prerequisite: shared tools scholarship_index, counselor_policies, gsustudenthelper
(created by scripts/migrate-apex-to-gawdzilla/migrate.py --agents-only).
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SHARED_TOOL_IDS = [
    "scholarship_index",
    "counselor_policies",
    "gsustudenthelper",
    "platform.core.get_document_by_id",
]

AGENTS = [
    {
        "id": "scholarship-counselor-default",
        "template_id": "default",
        "name": "Scholarship Counselor (Default)",
        "description": "Help students find scholarships and understand financial aid at Generic State University.",
        "state": None,
        "state_tool_id": "default-scholarship-overview",
        "instructions": """You are a scholarship counselor at Generic State University.

Help students discover scholarships, understand eligibility, and navigate financial aid policies.

## Rules
1. Use scholarship_index for semantic scholarship search by major, interest, or keyword.
2. Use counselor_policies for institutional aid rules and deadlines.
3. Use default-scholarship-overview for portfolio counts.
4. Use gsustudenthelper for university web content when relevant.
5. Be encouraging, concise, and cite specific scholarship names and award amounts when available.""",
    },
    {
        "id": "texas-scholarship-counselor",
        "template_id": "texas",
        "name": "Texas Scholarship Counselor",
        "description": "Scholarship assistant for Brazos Valley State University and Texas residents.",
        "state": "Texas",
        "state_tool_id": "texas-scholarships-by-state",
        "instructions": """You are a scholarship counselor at Brazos Valley State University in Texas.

Prioritize Texas-specific and Texas-resident scholarship opportunities.

## Rules
1. Use texas-scholarships-by-state for Texas-scoped listings.
2. Use scholarship_index for semantic search by major or keyword.
3. Use counselor_policies for institutional aid rules.
4. Reference Texas state aid programs when relevant.
5. Be concise; list scholarship title, award, and deadline.""",
    },
    {
        "id": "oklahoma-scholarship-counselor",
        "template_id": "oklahoma",
        "name": "Oklahoma Scholarship Counselor",
        "description": "Scholarship assistant for Red River State University and Oklahoma residents.",
        "state": "Oklahoma",
        "state_tool_id": "oklahoma-scholarships-by-state",
        "instructions": """You are a scholarship counselor at Red River State University in Oklahoma.

Prioritize Oklahoma-specific and Oklahoma-resident scholarship opportunities.

## Rules
1. Use oklahoma-scholarships-by-state for Oklahoma-scoped listings.
2. Use scholarship_index for semantic search by major or keyword.
3. Use counselor_policies for institutional aid rules.
4. Reference Oklahoma state aid programs when relevant.
5. Be concise; list scholarship title, award, and deadline.""",
    },
    {
        "id": "beauregard-scholarship-counselor",
        "template_id": "beauregard",
        "name": "Beauregard Springs Scholarship Counselor",
        "description": "Scholarship assistant for Beauregard Springs High School Jackalopes.",
        "state": "Texas",
        "state_tool_id": "beauregard-scholarships-by-state",
        "instructions": """You are a scholarship counselor at Beauregard Springs High School — home of the Jackalopes.

Help high school students find scholarships for college. Keep a friendly, school-spirited tone (Fear the ears!).

## Rules
1. Use beauregard-scholarships-by-state for Texas / Hill Country scoped listings.
2. Use scholarship_index for semantic search by major or interest.
3. Use counselor_policies for school and district aid guidance.
4. Focus on opportunities suitable for high school seniors.
5. Be concise and actionable.""",
    },
    {
        "id": "dot-transportation-assistant",
        "template_id": "dot",
        "name": "DOT Transportation Programs Assistant",
        "description": "Assistant for Department of Transportation grants, permits, and infrastructure programs.",
        "state": "Demo State",
        "state_tool_id": "dot-transportation-grants",
        "instructions": """You are the Department of Transportation programs assistant.

Help users find transportation, infrastructure, and public-works grant opportunities. Explain eligibility for municipal, county, and regional applicants.

## Rules
1. Use dot-transportation-grants for infrastructure and transportation funding listings.
2. Use scholarship_index to search program descriptions by keyword (bridges, transit, broadband corridors).
3. Use counselor_policies for agency program rules when relevant.
4. Emphasize deadlines, match requirements, and eligible applicant types.
5. Use plain language suitable for public agency staff and citizens.""",
    },
]


def state_tool(agent: dict) -> dict:
    tool_id = agent["state_tool_id"]
    state = agent["state"]
    if agent["template_id"] == "default":
        return {
            "id": tool_id,
            "description": "Scholarship index overview: total count and sample titles from scholarship_index.",
            "query": (
                "FROM scholarship_index "
                "| STATS scholarship_count = COUNT(*) "
                "| LIMIT 1"
            ),
        }
    if agent["template_id"] == "dot":
        return {
            "id": tool_id,
            "description": "Transportation and infrastructure grant programs (category or title contains transport/infrastructure).",
            "query": (
                "FROM scholarship_index "
                "| WHERE title LIKE \"*transport*\" OR title LIKE \"*infrastructure*\" "
                "OR title LIKE \"*bridge*\" OR title LIKE \"*transit*\" "
                "OR headings LIKE \"*transport*\" OR headings LIKE \"*infrastructure*\" "
                "| KEEP title, award, headings "
                "| LIMIT 10"
            ),
        }
    return {
        "id": tool_id,
        "description": f"Scholarships filtered for {state} from scholarship_index.",
        "query": (
            f'FROM scholarship_index | WHERE state == "{state}" OR headings LIKE "*{state}*" '
            f'OR title LIKE "*{state}*" '
            "| KEEP title, award, state, headings "
            "| LIMIT 10"
        ),
    }


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
        "tags": ["scholarship", "studentcounselor"],
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


def upsert_agent(kb: str, api_key: str, agent: dict) -> None:
    agent_id = agent["id"]
    tool_ids = [agent["state_tool_id"]] + SHARED_TOOL_IDS
    create_payload = {
        "id": agent_id,
        "name": agent["name"],
        "description": agent["description"],
        "configuration": {
            "instructions": agent["instructions"],
            "tools": [{"tool_ids": tool_ids}],
            "enable_elastic_capabilities": False,
            "workflow_ids": [],
        },
    }
    update_payload = {k: v for k, v in create_payload.items() if k != "id"}
    try:
        request(f"{kb}/api/agent_builder/agents/{agent_id}", api_key)
        request(f"{kb}/api/agent_builder/agents/{agent_id}", api_key, "PUT", update_payload)
        print(f"  [agent {agent_id}] updated")
    except RuntimeError as e:
        if "404" not in str(e):
            raise
        request(f"{kb}/api/agent_builder/agents", api_key, "POST", create_payload)
        print(f"  [agent {agent_id}] created")


def main() -> int:
    load_dotenv()
    api_key = os.environ.get("ELASTIC_API_KEY") or os.environ.get("OK_KIBANA_API_KEY", "")
    kb = os.environ.get(
        "ELASTIC_KB_URL",
        os.environ.get("OK_KIBANA_URL", "https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com"),
    ).rstrip("/")
    if not api_key:
        print("Set ELASTIC_API_KEY or OK_KIBANA_API_KEY in .env", file=sys.stderr)
        return 1

    print(f"Kibana: {kb}")
    print("Creating per-template scholarship ES|QL tools…")
    for agent in AGENTS:
        upsert_tool(kb, api_key, state_tool(agent))
    print("Creating scholarship agents…")
    for agent in AGENTS:
        upsert_agent(kb, api_key, agent)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
