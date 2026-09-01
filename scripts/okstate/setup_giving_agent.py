#!/usr/bin/env python3
"""Create OSU giving-policy index_search tool + skill and attach to okstate-donor-assistant.

Usage (from repo root):
    python3 scripts/okstate/setup_giving_agent.py

Requires OK_KIBANA_API_KEY and OK_KIBANA_URL in .env.
Run scripts/okstate/ingest_giving_policies.py first.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENT_ID = "okstate-donor-assistant"
TOOL_ID = "okstate-giving-policy-search"
SKILL_ID = "okstate-giving-policies"
INDEX_PATTERN = "okstate-giving-policies"

TOOL_DESCRIPTION = (
    "Search official OSU Foundation and Oklahoma State University gift-acceptance pages "
    "in okstate-giving-policies. Use for how to donate, accepted gift types (cash, securities, "
    "real estate, endowments, planned giving), gifts-in-kind, $5,000 appraisals, titling cars "
    "or boats to the university, international/OFAC/OReSTCO rules, and donor privacy. "
    "Do not use for affinity scores, at-risk donor lists, or athletic-boosters analytics."
)

SKILL_DESCRIPTION = (
    "Use when the user asks how to give to Oklahoma State, what gifts the OSU Foundation accepts, "
    "gifts-in-kind or appraisals, donating a car or boat, international or foreign-person gifts, "
    "or donor privacy. Do not use for booster portfolio stats or at-risk donor lists."
)

SKILL_CONTENT = """# OSU Foundation giving rules

## When to use
Activate when the user asks how to donate to Oklahoma State, what gifts are accepted, gifts-in-kind,
appraisals, titled vehicles, international/OFAC gifts, OReSTCO, or donor privacy.

## Steps
1. Call `okstate-giving-policy-search` with the user's question before answering.
2. Ground the answer in retrieved `body` text. Paraphrase or quote; include the source `url`.
3. If several pages apply, mention each relevant URL.
4. Do not invent IRS, tax, or legal advice. Say the donor should consult their own advisor.
5. If retrieval returns nothing, say so and point the user to https://www.osugiving.com/ rather than guessing.

## Do not use this skill for
- Athletic booster affinity, engagement drops, or ALUM-* donor lookups — use booster ES|QL tools instead.
- Game-day revenue or POS questions.
"""

INSTRUCTIONS_ADDENDUM = """
## OSU Foundation giving rules
For how-to-give questions (accepted gift types, gifts-in-kind, appraisals, titled vehicles,
international/OFAC gifts, donor privacy), do NOT use booster analytics tools first.
1. Call okstate-giving-policy-search before answering.
2. Follow the okstate-giving-policies skill: quote or paraphrase retrieved text and include the source URL.
3. Do not invent tax or legal advice; tell the donor to consult their own advisor.
Keep using okstate-booster-* tools for portfolio stats, at-risk donors, affinity, and ALUM-* lookups.
"""

TOOL_PAYLOAD = {
    "id": TOOL_ID,
    "type": "index_search",
    "description": TOOL_DESCRIPTION,
    "tags": ["okstate", "giving", "foundation"],
    "configuration": {
        "pattern": INDEX_PATTERN,
        "row_limit": 8,
        "custom_instructions": (
            "Always return url, title, topic, and body. Prefer documents whose topic matches "
            "the question (gift_types, gifts_in_kind, international, privacy, foundation_role)."
        ),
    },
}

SKILL_PAYLOAD = {
    "id": SKILL_ID,
    "name": "OSU Foundation giving rules",
    "description": SKILL_DESCRIPTION,
    "content": SKILL_CONTENT,
    "tool_ids": [TOOL_ID],
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
        raise RuntimeError(f"{method} {url} -> {e.code}: {detail[:800]}") from e


def upsert_tool(kb: str, api_key: str) -> None:
    update_payload = {
        "description": TOOL_PAYLOAD["description"],
        "tags": TOOL_PAYLOAD["tags"],
        "configuration": TOOL_PAYLOAD["configuration"],
    }
    try:
        request(f"{kb}/api/agent_builder/tools/{TOOL_ID}", api_key)
        request(f"{kb}/api/agent_builder/tools/{TOOL_ID}", api_key, "PUT", update_payload)
        print(f"  [tool {TOOL_ID}] updated")
    except RuntimeError as e:
        if "404" not in str(e):
            raise
        request(f"{kb}/api/agent_builder/tools", api_key, "POST", TOOL_PAYLOAD)
        print(f"  [tool {TOOL_ID}] created")


def upsert_skill(kb: str, api_key: str) -> None:
    update_payload = {k: v for k, v in SKILL_PAYLOAD.items() if k != "id"}
    try:
        request(f"{kb}/api/agent_builder/skills/{SKILL_ID}", api_key)
        request(f"{kb}/api/agent_builder/skills/{SKILL_ID}", api_key, "PUT", update_payload)
        print(f"  [skill {SKILL_ID}] updated")
        return
    except RuntimeError as e:
        if "404" not in str(e):
            if "content" in str(e).lower() or "400" in str(e):
                alt = {
                    "id": SKILL_ID,
                    "name": SKILL_PAYLOAD["name"],
                    "description": SKILL_PAYLOAD["description"],
                    "instructions": SKILL_CONTENT,
                    "tool_ids": [TOOL_ID],
                }
                try:
                    request(f"{kb}/api/agent_builder/skills", api_key, "POST", alt)
                    print(f"  [skill {SKILL_ID}] created (instructions field)")
                    return
                except RuntimeError:
                    pass
            raise
    try:
        request(f"{kb}/api/agent_builder/skills", api_key, "POST", SKILL_PAYLOAD)
        print(f"  [skill {SKILL_ID}] created")
    except RuntimeError as e:
        if "content" in str(e).lower() or "400" in str(e):
            alt = {
                "id": SKILL_ID,
                "name": SKILL_PAYLOAD["name"],
                "description": SKILL_PAYLOAD["description"],
                "instructions": SKILL_CONTENT,
                "tool_ids": [TOOL_ID],
            }
            request(f"{kb}/api/agent_builder/skills", api_key, "POST", alt)
            print(f"  [skill {SKILL_ID}] created (instructions field)")
            return
        raise


def _ensure_skill_on_config(config: dict) -> dict:
    # This Kibana version stores assigned skills as configuration.skill_ids.
    # configuration.skills is rejected as an additional property.
    skill_ids = list(config.get("skill_ids") or [])
    if SKILL_ID not in skill_ids:
        skill_ids.append(SKILL_ID)
    config["skill_ids"] = skill_ids
    config.pop("skills", None)
    return config


def attach_to_agent(kb: str, api_key: str) -> None:
    agent = request(f"{kb}/api/agent_builder/agents/{AGENT_ID}", api_key)
    config = dict(agent.get("configuration") or {})
    tool_groups = config.get("tools") or [{"tool_ids": []}]
    if not tool_groups:
        tool_groups = [{"tool_ids": []}]
    tool_ids = list(tool_groups[0].get("tool_ids") or [])
    if TOOL_ID not in tool_ids:
        tool_ids.append(TOOL_ID)
    tool_groups[0]["tool_ids"] = tool_ids
    config["tools"] = tool_groups
    config = _ensure_skill_on_config(config)

    instructions = config.get("instructions") or ""
    marker = "## OSU Foundation giving rules"
    if marker in instructions:
        instructions = instructions.split(marker)[0].rstrip()
    config["instructions"] = (instructions + "\n" + INSTRUCTIONS_ADDENDUM).strip()

    update_payload = {
        "name": agent.get("name", AGENT_ID),
        "description": agent.get("description", ""),
        "configuration": config,
    }
    for extra in ("labels", "avatar_color", "avatar_symbol"):
        if extra in agent:
            update_payload[extra] = agent[extra]
    try:
        request(f"{kb}/api/agent_builder/agents/{AGENT_ID}", api_key, "PUT", update_payload)
        print(f"  [agent {AGENT_ID}] tool and skill attached")
        return
    except RuntimeError as e:
        if "skill" not in str(e).lower() and "400" not in str(e):
            raise
        config.pop("skills", None)
        config.pop("skill_ids", None)
        update_payload["configuration"] = config
        request(f"{kb}/api/agent_builder/agents/{AGENT_ID}", api_key, "PUT", update_payload)
        print(f"  [agent {AGENT_ID}] tool attached (skill field not accepted; enable skill in Kibana UI)")


def main() -> int:
    load_dotenv()
    api_key = os.environ.get("OK_KIBANA_API_KEY") or os.environ.get("ELASTIC_API_KEY", "")
    kb = os.environ.get("OK_KIBANA_URL", "https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com").rstrip("/")
    if not api_key:
        print("Please add OK_KIBANA_API_KEY to your .env file.", file=sys.stderr)
        return 1

    print(f"Kibana: {kb}")
    upsert_tool(kb, api_key)
    upsert_skill(kb, api_key)
    attach_to_agent(kb, api_key)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
