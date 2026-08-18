"""Shared helpers for OU Met Agent Builder setup scripts."""

from __future__ import annotations

from typing import Any

import requests

from config import kibana_url as get_kibana_url
from env_adapter import apply_to_environ, elasticsearch_api_key

apply_to_environ()

API_KEY = elasticsearch_api_key()


def kibana_url() -> str:
    return get_kibana_url()


def headers() -> dict[str, str]:
    return {
        "Authorization": f"ApiKey {API_KEY}",
        "kbn-xsrf": "true",
        "Content-Type": "application/json",
    }


def api(method: str, path: str, body: dict | None = None) -> dict:
    kb = kibana_url()
    resp = requests.request(method, f"{kb}{path}", headers=headers(), json=body, timeout=90)
    if not resp.ok:
        raise RuntimeError(f"{method} {path} -> {resp.status_code}: {resp.text[:500]}")
    return resp.json() if resp.text else {}


def tool_exists(tool_id: str) -> bool:
    kb = kibana_url()
    return requests.get(
        f"{kb}/api/agent_builder/tools/{tool_id}", headers=headers(), timeout=30
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


def agent_exists(agent_id: str) -> bool:
    kb = kibana_url()
    return requests.get(
        f"{kb}/api/agent_builder/agents/{agent_id}", headers=headers(), timeout=30
    ).status_code == 200


def upsert_agent(agent: dict) -> None:
    agent_id = agent["id"]
    payload = {k: v for k, v in agent.items() if k != "id"}
    if agent_exists(agent_id):
        api("PUT", f"/api/agent_builder/agents/{agent_id}", payload)
        print(f"  updated agent {agent_id}")
    else:
        api("POST", "/api/agent_builder/agents", agent)
        print(f"  created agent {agent_id}")
