#!/usr/bin/env python3
"""
Provisioning index, workflow, and ops agent (Sean/Corey queue).

Researchers use ou-met-catalog-agent — it auto-detects mount vs approval needs.

Usage:
  python scripts/weather/setup_provisioning_agent.py
  python scripts/weather/setup_provisioning_agent.py --test
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import requests
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

from agent_builder_common import api, agent_exists, headers, kibana_url, tool_exists, upsert_agent, upsert_tool
from config import PROVISIONING_INDEX
from provisioning_tools import (
    OPS_AGENT_INSTRUCTIONS,
    PROVISIONING_ESQL_TOOLS,
    SUBMIT_WORKFLOW_ID,
    SUBMIT_WORKFLOW_TOOL,
)
from setup_provisioning_index import main as ensure_index

ROOT = Path(__file__).resolve().parent
WORKFLOW_YAML = ROOT / "kibana" / "ou-met-submit-provision-request-workflow.yaml"
OPS_AGENT_ID = "ou-met-provisioning-agent"

OPS_AGENT = {
    "id": OPS_AGENT_ID,
    "name": "OU Meteorology Provisioning Ops",
    "description": "Ops queue for Sean and Corey — pending mounts, approvals, and failures.",
    "labels": ["ou-met", "provisioning", "ops"],
    "avatar_color": "#1565C0",
    "avatar_symbol": "🛠️",
    "configuration": {
        "instructions": OPS_AGENT_INSTRUCTIONS,
        "tools": [{"tool_ids": [t["id"] for t in PROVISIONING_ESQL_TOOLS]}],
    },
}


def workflow_exists() -> bool:
    return requests.get(
        f"{kibana_url()}/api/workflows/workflow/{SUBMIT_WORKFLOW_ID}",
        headers=headers(),
        timeout=30,
    ).status_code == 200


def upsert_workflow() -> None:
    raw = yaml.safe_load(WORKFLOW_YAML.read_text())
    payload = {
        "id": SUBMIT_WORKFLOW_ID,
        "name": raw["name"],
        "description": raw["description"],
        "enabled": raw.get("enabled", True),
        "yaml": WORKFLOW_YAML.read_text(),
    }
    if workflow_exists():
        api("PUT", f"/api/workflows/workflow/{SUBMIT_WORKFLOW_ID}", payload)
        print(f"  updated workflow {SUBMIT_WORKFLOW_ID}")
    else:
        api("POST", "/api/workflows/workflow", payload)
        print(f"  created workflow {SUBMIT_WORKFLOW_ID}")


def setup_ops_agent() -> None:
    ensure_index()
    upsert_workflow()
    for tool in PROVISIONING_ESQL_TOOLS:
        upsert_tool(tool)
    upsert_tool(SUBMIT_WORKFLOW_TOOL)
    upsert_agent(OPS_AGENT)
    print(f"\nOps agent: {kibana_url()}/app/agent_builder/chat?agent={OPS_AGENT_ID}")
    print(f"Researcher agent: {kibana_url()}/app/agent_builder/chat?agent=ou-met-catalog-agent")


def delete_resources() -> None:
    if agent_exists(OPS_AGENT_ID):
        requests.delete(
            f"{kibana_url()}/api/agent_builder/agents/{OPS_AGENT_ID}",
            headers=headers(),
            timeout=30,
        )
        print(f"  deleted agent {OPS_AGENT_ID}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="List provision queue")
    parser.add_argument("--delete", action="store_true")
    args = parser.parse_args()
    if args.delete:
        delete_resources()
        return
    setup_ops_agent()
    if args.test:
        result = api("POST", "/api/agent_builder/tools/_execute", {
            "tool_id": "ou-met-list-provision-queue",
            "tool_params": {"limit": 10},
        })
        print(json.dumps(result, indent=2)[:2000])


if __name__ == "__main__":
    main()
