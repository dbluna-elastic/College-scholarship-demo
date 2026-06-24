#!/usr/bin/env python3
"""
Migrate scholarship-demo indices and Agent Builder assets from Apex to Gawdzilla.

Requires in .env (or environment):
  APEX_ELASTIC_ES_URL / ELASTIC_ES_URL  — source Elasticsearch (Apex)
  APEX_ELASTIC_API_KEY / ELASTIC_API_KEY — API key for Apex
  GAWDZILLA_ELASTIC_ES_URL / OK_ELASTIC_ES_URL — destination ES (Gawdzilla)
  GAWDZILLA_KIBANA_URL / OK_KIBANA_URL — destination Kibana
  GAWDZILLA_API_KEY / OK_KIBANA_API_KEY — API key for Gawdzilla

Usage:
  python3 scripts/migrate-apex-to-gawdzilla/migrate.py
  python3 scripts/migrate-apex-to-gawdzilla/migrate.py --indices-only
  python3 scripts/migrate-apex-to-gawdzilla/migrate.py --agents-only
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

INDICES = [
    "students",
    "scholarship_index_elser",
    "scholarship_index",
    "counselor_policies",
]

AGENT_TOOLS = ["counselor_policies", "gsustudenthelper", "scholarship_index"]
AGENT_ID = "studentcounselor"

SETTINGS_BLOCKLIST = {
    "index",
    "creation_date",
    "uuid",
    "version",
    "provided_name",
    "store",
}


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def env(name: str, fallback_names: list[str] = [], default: str = "") -> str:
    if os.environ.get(name):
        return os.environ[name]
    for alt in fallback_names:
        if os.environ.get(alt):
            return os.environ[alt]
    return default


def request(
    url: str,
    api_key: str,
    method: str = "GET",
    body: dict | None = None,
    kibana: bool = False,
    allow_empty_body: bool = False,
) -> dict:
    if body is not None:
        data = json.dumps(body).encode()
    elif allow_empty_body and method in ("POST", "PUT"):
        data = b""
    else:
        data = None
    headers = {
        "Authorization": f"ApiKey {api_key}",
        "Content-Type": "application/json",
    }
    if kibana:
        headers["kbn-xsrf"] = "true"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        raise RuntimeError(f"{method} {url} failed ({e.code}): {detail[:800]}") from e


def index_exists(es_url: str, api_key: str, index: str) -> bool:
    try:
        request(f"{es_url}/{index}", api_key)
        return True
    except RuntimeError as e:
        if "404" in str(e) or "index_not_found" in str(e):
            return False
        raise


def clean_settings(settings: dict) -> dict:
    cleaned = {}
    for key, val in settings.items():
        if key in SETTINGS_BLOCKLIST:
            continue
        if key == "index" and isinstance(val, dict):
            cleaned[key] = {k: v for k, v in val.items() if k not in SETTINGS_BLOCKLIST}
        else:
            cleaned[key] = val
    return cleaned


def create_index_from_source(src_es: str, src_key: str, dst_es: str, dst_key: str, index: str) -> None:
    if index_exists(dst_es, dst_key, index):
        print(f"  [{index}] already exists on Gawdzilla — skipping create")
        return

    meta = request(f"{src_es}/{index}", src_key)
    mappings = meta.get(index, meta).get("mappings", {})
    settings = clean_settings(meta.get(index, meta).get("settings", {}))

    body = {"mappings": mappings}
    if settings:
        body["settings"] = settings

    request(f"{dst_es}/{index}", dst_key, "PUT", body)
    print(f"  [{index}] created on Gawdzilla")


def migrate_documents(src_es: str, src_key: str, dst_es: str, dst_key: str, index: str) -> int:
    scroll_id = None
    total = 0
    batch_size = 200

    try:
        first = request(
            f"{src_es}/{index}/_search?scroll=2m",
            src_key,
            "POST",
            {"size": batch_size, "sort": ["_doc"]},
        )
        scroll_id = first.get("_scroll_id")
        hits = first.get("hits", {}).get("hits", [])

        while hits:
            bulk_lines = []
            for hit in hits:
                bulk_lines.append(json.dumps({"index": {"_index": index, "_id": hit["_id"]}}))
                bulk_lines.append(json.dumps(hit["_source"]))
            bulk_body = "\n".join(bulk_lines) + "\n"
            req = urllib.request.Request(
                f"{dst_es}/_bulk",
                data=bulk_body.encode(),
                headers={
                    "Authorization": f"ApiKey {dst_key}",
                    "Content-Type": "application/x-ndjson",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode())
            if result.get("errors"):
                errors = [it for it in result.get("items", []) if "error" in it.get("index", {})]
                if errors:
                    raise RuntimeError(f"Bulk errors: {json.dumps(errors[:3])}")

            total += len(hits)
            print(f"  [{index}] indexed {total} documents…")

            scroll = request(
                f"{src_es}/_search/scroll",
                src_key,
                "POST",
                {"scroll": "2m", "scroll_id": scroll_id},
            )
            scroll_id = scroll.get("_scroll_id")
            hits = scroll.get("hits", {}).get("hits", [])
    finally:
        if scroll_id:
            try:
                request(f"{src_es}/_search/scroll", src_key, "DELETE", {"scroll_id": scroll_id})
            except RuntimeError:
                pass

    request(f"{dst_es}/{index}/_refresh", dst_key, "POST", allow_empty_body=True)
    return total


def migrate_indices(src_es: str, src_key: str, dst_es: str, dst_key: str) -> None:
    print("Migrating Elasticsearch indices…")
    for index in INDICES:
        try:
            count_src = request(f"{src_es}/{index}/_count", src_key).get("count", 0)
        except RuntimeError as e:
            if "index_not_found" in str(e):
                print(f"  [{index}] not on Apex — skip")
                continue
            raise
        print(f"  [{index}] Apex count: {count_src}")
        create_index_from_source(src_es, src_key, dst_es, dst_key, index)
        migrated = migrate_documents(src_es, src_key, dst_es, dst_key, index)
        dst_count = request(f"{dst_es}/{index}/_count", dst_key).get("count", 0)
        print(f"  [{index}] done — Gawdzilla count: {dst_count}")


def import_tool(apex_kb: str, apex_key: str, gaw_kb: str, gaw_key: str, tool_id: str) -> None:
    tool = request(f"{apex_kb}/api/agent_builder/tools/{tool_id}", apex_key, kibana=True)
    create_payload = {
        "id": tool["id"],
        "type": tool["type"],
        "description": tool.get("description", tool_id),
        "configuration": tool.get("configuration", {}),
    }
    if tool.get("tags"):
        create_payload["tags"] = tool["tags"]
    update_payload = {
        "description": create_payload["description"],
        "configuration": create_payload["configuration"],
    }
    if tool.get("tags"):
        update_payload["tags"] = create_payload["tags"]

    exists = True
    try:
        request(f"{gaw_kb}/api/agent_builder/tools/{tool_id}", gaw_key, kibana=True)
    except RuntimeError as e:
        if "404" in str(e):
            exists = False
        else:
            raise

    if exists:
        request(
            f"{gaw_kb}/api/agent_builder/tools/{tool_id}",
            gaw_key,
            "PUT",
            update_payload,
            kibana=True,
        )
        print(f"  [tool {tool_id}] updated")
    else:
        request(f"{gaw_kb}/api/agent_builder/tools", gaw_key, "POST", create_payload, kibana=True)
        print(f"  [tool {tool_id}] created")


def import_agent(apex_kb: str, apex_key: str, gaw_kb: str, gaw_key: str) -> None:
    agent = request(f"{apex_kb}/api/agent_builder/agents/{AGENT_ID}", apex_key, kibana=True)
    create_payload = {
        "id": agent["id"],
        "name": agent.get("name", AGENT_ID),
        "description": agent.get("description", ""),
        "configuration": agent.get("configuration", {}),
    }
    if agent.get("labels"):
        create_payload["labels"] = agent["labels"]
    update_payload = {k: v for k, v in create_payload.items() if k != "id"}

    exists = True
    try:
        request(f"{gaw_kb}/api/agent_builder/agents/{AGENT_ID}", gaw_key, kibana=True)
    except RuntimeError as e:
        if "404" in str(e):
            exists = False
        else:
            raise

    if exists:
        request(
            f"{gaw_kb}/api/agent_builder/agents/{AGENT_ID}",
            gaw_key,
            "PUT",
            update_payload,
            kibana=True,
        )
        print(f"  [agent {AGENT_ID}] updated")
    else:
        request(f"{gaw_kb}/api/agent_builder/agents", gaw_key, "POST", create_payload, kibana=True)
        print(f"  [agent {AGENT_ID}] created")


def migrate_agents(apex_kb: str, apex_key: str, gaw_kb: str, gaw_key: str) -> None:
    print("Migrating Agent Builder tools and studentcounselor agent…")
    for tool_id in AGENT_TOOLS:
        try:
            import_tool(apex_kb, apex_key, gaw_kb, gaw_key, tool_id)
        except RuntimeError as e:
            print(f"  [tool {tool_id}] warning: {e}")
    import_agent(apex_kb, apex_key, gaw_kb, gaw_key)


def main() -> int:
    load_dotenv(ROOT / ".env")

    parser = argparse.ArgumentParser()
    parser.add_argument("--indices-only", action="store_true")
    parser.add_argument("--agents-only", action="store_true")
    args = parser.parse_args()

    src_es = env(
        "APEX_ELASTIC_ES_URL",
        ["ELASTIC_ES_URL"],
        "https://apex-dec2025-group4-b01431.es.us-central1.gcp.elastic.cloud:443",
    )
    src_key = env("APEX_ELASTIC_API_KEY", ["ELASTIC_API_KEY"])
    dst_es = env(
        "GAWDZILLA_ELASTIC_ES_URL",
        ["OK_ELASTIC_ES_URL"],
        "https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com:443",
    )
    dst_key = env("GAWDZILLA_API_KEY", ["OK_KIBANA_API_KEY"])
    apex_kb = env(
        "APEX_KIBANA_URL",
        ["ELASTIC_KB_URL"],
        "https://apex-dec2025-group4-b01431.kb.us-central1.gcp.elastic.cloud",
    )
    gaw_kb = env(
        "GAWDZILLA_KIBANA_URL",
        ["OK_KIBANA_URL"],
        "https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com",
    )

    if not src_key:
        print("Set APEX_ELASTIC_API_KEY or ELASTIC_API_KEY (Apex API key)", file=sys.stderr)
        return 1
    if not dst_key:
        print("Set GAWDZILLA_API_KEY or OK_KIBANA_API_KEY", file=sys.stderr)
        return 1

    print(f"Source ES: {src_es}")
    print(f"Dest ES:   {dst_es}")
    print(f"Dest KB:   {gaw_kb}")

    if not args.agents_only:
        migrate_indices(src_es, src_key, dst_es, dst_key)

    if not args.indices_only:
        migrate_agents(apex_kb, src_key, gaw_kb, dst_key)

    print("Migration complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
