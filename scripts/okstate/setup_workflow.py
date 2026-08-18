#!/usr/bin/env python3
"""Deploy Oklahoma State alumni email workflow + Agent Builder workflow tool.

Does not create chat agents — those already exist on Gawdzilla
(okstate-donor-assistant, okstate-gameday-revenue-assistant).
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
YAML_PATH = Path(__file__).resolve().parent / "okstate-alumni-email-draft.yaml"
WORKFLOW_ID = "oklahoma-state-alumni-outreach-email"
TOOL_ID = "okstate-alumni-email-workflow"
AGENT_ID = "okstate-donor-assistant"


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


def upsert_workflow(kb: str, api_key: str, yaml: str) -> None:
    try:
        request(f"{kb}/api/workflows/workflow/{WORKFLOW_ID}", api_key)
        request(
            f"{kb}/api/workflows/workflow/{WORKFLOW_ID}",
            api_key,
            "PUT",
            {"yaml": yaml, "enabled": True},
        )
        print(f"  [workflow {WORKFLOW_ID}] updated")
    except RuntimeError as e:
        if "404" not in str(e):
            raise
        request(
            f"{kb}/api/workflows",
            api_key,
            "POST",
            {"workflows": [{"yaml": yaml, "name": "Oklahoma State Alumni Outreach Email"}]},
        )
        print(f"  [workflow {WORKFLOW_ID}] created")


def upsert_workflow_tool(kb: str, api_key: str) -> None:
    create_payload = {
        "id": TOOL_ID,
        "type": "workflow",
        "description": "Draft personalized alumni outreach email for an Oklahoma State athletic booster donor.",
        "configuration": {"workflow_id": WORKFLOW_ID},
    }
    update_payload = {
        "description": create_payload["description"],
        "configuration": create_payload["configuration"],
    }
    try:
        request(f"{kb}/api/agent_builder/tools/{TOOL_ID}", api_key)
        request(f"{kb}/api/agent_builder/tools/{TOOL_ID}", api_key, "PUT", update_payload)
        print(f"  [tool {TOOL_ID}] updated")
    except RuntimeError as e:
        if "404" not in str(e):
            raise
        request(f"{kb}/api/agent_builder/tools", api_key, "POST", create_payload)
        print(f"  [tool {TOOL_ID}] created")


def attach_tool_to_agent(kb: str, api_key: str) -> None:
    agent = request(f"{kb}/api/agent_builder/agents/{AGENT_ID}", api_key)
    tool_groups = agent.get("configuration", {}).get("tools", [])
    if not tool_groups:
        tool_groups = [{"tool_ids": []}]
    tool_ids = list(tool_groups[0].get("tool_ids", []))
    if TOOL_ID not in tool_ids:
        tool_ids.append(TOOL_ID)
    tool_groups[0]["tool_ids"] = tool_ids
    update_payload = {
        "name": agent.get("name", AGENT_ID),
        "description": agent.get("description", ""),
        "configuration": {
            **agent.get("configuration", {}),
            "tools": tool_groups,
        },
    }
    request(f"{kb}/api/agent_builder/agents/{AGENT_ID}", api_key, "PUT", update_payload)
    print(f"  [agent {AGENT_ID}] workflow tool attached")


def main() -> int:
    load_dotenv()
    api_key = os.environ.get("OK_KIBANA_API_KEY") or os.environ.get("ELASTIC_API_KEY", "")
    kb = os.environ.get("OK_KIBANA_URL", "https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com").rstrip("/")
    if not api_key:
        print("Set OK_KIBANA_API_KEY in .env", file=sys.stderr)
        return 1

    yaml = YAML_PATH.read_text()
    print(f"Kibana: {kb}")
    upsert_workflow(kb, api_key, yaml)
    upsert_workflow_tool(kb, api_key)
    attach_tool_to_agent(kb, api_key)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
