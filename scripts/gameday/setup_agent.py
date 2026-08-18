#!/usr/bin/env python3
"""
Create gameday-revenue-data Agent Builder tools and agent on Gawdzilla.

Usage (from repo root):
    python3 scripts/gameday/setup_agent.py

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
AGENT_ID = "gameday-revenue-data"

TOOLS = [
    {
        "id": "gameday-revenue-summary",
        "description": "Paciolan ticket gameday summary: scans, ticket revenue, average price, and resale scan count.",
        "query": (
            "FROM paciolan-ticket-events "
            "| STATS ticket_scans = COUNT(*), ticket_revenue = SUM(ticket_price), avg_ticket = AVG(ticket_price), "
            "resale_scans = COUNT(*) WHERE is_resale == true "
            "| LIMIT 1"
        ),
        "tags": ["gameday", "texas-college", "tickets", "summary"],
    },
    {
        "id": "gameday-retail-summary",
        "description": "Team store retail summary from stadium-retail-sales: transactions, revenue, units sold, average sale.",
        "query": (
            "FROM stadium-retail-sales "
            "| STATS txns = COUNT(*), retail_revenue = SUM(total_amount), units_sold = SUM(quantity), avg_sale = AVG(total_amount) "
            "| LIMIT 1"
        ),
        "tags": ["gameday", "retail", "summary"],
    },
    {
        "id": "gameday-retail-catalog",
        "description": "Full 100-item stadium retail catalog (campus bookstore SKUs available at team stores).",
        "query": (
            "FROM stadium-retail-catalog "
            "| KEEP sku, item_name, category, subcategory, unit_price, available_stadium "
            "| SORT category ASC, item_name ASC | LIMIT 100"
        ),
        "tags": ["gameday", "retail", "catalog"],
    },
    {
        "id": "gameday-retail-by-category",
        "description": "Team store merchandise revenue and units sold by category (apparel, headwear, drinkware, gifts, etc.).",
        "query": (
            "FROM stadium-retail-sales "
            "| STATS revenue = SUM(total_amount), units = SUM(quantity), txns = COUNT(*) BY category "
            "| SORT revenue DESC | LIMIT 12"
        ),
        "tags": ["gameday", "retail", "merchandise"],
    },
    {
        "id": "gameday-top-retail-items",
        "description": "Top-selling stadium retail SKUs by revenue and units (from 100-item catalog).",
        "query": (
            "FROM stadium-retail-sales "
            "| STATS revenue = SUM(total_amount), units = SUM(quantity), txns = COUNT(*) BY sku, item_name, category "
            "| SORT revenue DESC | LIMIT 15"
        ),
        "tags": ["gameday", "retail", "bestsellers"],
    },
    {
        "id": "gameday-retail-by-location",
        "description": "Team store location performance: revenue and units by stadium shop (not concessions).",
        "query": (
            "FROM stadium-retail-sales "
            "| STATS revenue = SUM(total_amount), units = SUM(quantity), txns = COUNT(*) BY location_name "
            "| SORT revenue DESC | LIMIT 10"
        ),
        "tags": ["gameday", "retail", "team-store"],
    },
    {
        "id": "gameday-retail-by-sku",
        "description": "Look up a stadium retail SKU and its gameday sales (pass sku like TC-APP-001).",
        "query": (
            "FROM stadium-retail-sales | WHERE sku == ?sku "
            "| STATS revenue = SUM(total_amount), units = SUM(quantity), txns = COUNT(*) "
            "| LIMIT 1"
        ),
        "params": {
            "sku": {"type": "string", "description": "Retail SKU, e.g. TC-APP-001"},
        },
        "tags": ["gameday", "retail", "sku"],
    },
    {
        "id": "gameday-ticket-by-fan-tier",
        "description": "Ticket revenue and scan counts grouped by fan tier (Premium, Alumni, Student, etc.).",
        "query": (
            "FROM paciolan-ticket-events "
            "| STATS revenue = SUM(ticket_price), scans = COUNT(*) BY fan_tier "
            "| SORT revenue DESC | LIMIT 10"
        ),
        "tags": ["gameday", "tickets", "fan-segments"],
    },
    {
        "id": "gameday-ticket-by-gate",
        "description": "Gate traffic: scan counts and ticket revenue by stadium gate.",
        "query": (
            "FROM paciolan-ticket-events "
            "| STATS scans = COUNT(*), revenue = SUM(ticket_price) BY gate "
            "| SORT scans DESC | LIMIT 10"
        ),
        "tags": ["gameday", "tickets", "gates"],
    },
    {
        "id": "gameday-by-game-id",
        "description": "Retail sales summary for a specific game_id from stadium-retail-sales.",
        "query": (
            "FROM stadium-retail-sales | WHERE game_id == ?game_id "
            "| STATS txns = COUNT(*), retail_revenue = SUM(total_amount), units_sold = SUM(quantity) "
            "| LIMIT 1"
        ),
        "params": {
            "game_id": {"type": "string", "description": "Game ID, e.g. GAME-2025-HOME-01"},
        },
        "tags": ["gameday", "retail", "game"],
    },
    {
        "id": "gameday-unusual-purchases",
        "description": "Flag unusual team store purchases: bulk quantity (3+ units) or high-value tickets ($150+). Typical gameday sales are 1-2 units.",
        "query": (
            "FROM stadium-retail-sales "
            "| WHERE quantity >= 3 OR total_amount >= 150 "
            "| KEEP sku, item_name, category, location_name, quantity, unit_price, total_amount, transaction_time "
            "| SORT total_amount DESC | LIMIT 20"
        ),
        "tags": ["gameday", "retail", "security", "anomaly"],
    },
    {
        "id": "gameday-resale-activity",
        "description": "Paciolan ticket resale scan counts and revenue by fan tier and gate (possible scalping / secondary-market activity).",
        "query": (
            "FROM paciolan-ticket-events | WHERE is_resale == true "
            "| STATS resale_scans = COUNT(*), resale_revenue = SUM(ticket_price) BY fan_tier, gate "
            "| SORT resale_scans DESC | LIMIT 12"
        ),
        "tags": ["gameday", "tickets", "security", "resale"],
    },
]

INSTRUCTIONS = """You are the Texas College Athletic Advancement **Game Day Revenue** assistant focused on **team store merchandise**, not concessions.

## Data indices
- **stadium-retail-catalog**: 100 campus bookstore-style SKUs available at stadium team stores (sku, item_name, category, unit_price)
- **stadium-retail-sales**: Gameday team store transactions (sku, item_name, category, location_name, quantity, total_amount)
- **paciolan-ticket-events**: Ticket scans (fan_tier, gate, ticket_type, ticket_price, is_resale)

## Skills — map questions to tools
1. **Total gameday revenue** → gameday-revenue-summary + gameday-retail-summary (tickets + team store retail)
2. **Catalog / what can I buy / 100 items / SKUs** → gameday-retail-catalog
3. **Top sellers / bestsellers / jerseys / hoodies** → gameday-top-retail-items
4. **Merch by category** (apparel, headwear, drinkware, gifts) → gameday-retail-by-category
5. **Team store locations** → gameday-retail-by-location
6. **Specific SKU** → gameday-retail-by-sku
7. **Fan tiers / ticket revenue** → gameday-ticket-by-fan-tier
8. **Gate traffic** → gameday-ticket-by-gate
9. **Game-specific retail** → gameday-by-game-id
10. **Unusual / suspicious / fraud / security / bulk buys / purchasing behavior** → gameday-unusual-purchases
11. **Ticket resale / scalping / secondary market** → gameday-resale-activity (optionally also gameday-unusual-purchases for bulk merch)

## Rules
1. ALWAYS use gameday-* ES|QL tools first. Do NOT use square-pos-transactions or discuss concessions unless explicitly asked.
2. Emphasize the **100-item stadium retail catalog** aligned with campus bookstore merchandise.
3. Format currency as USD. Default game: **GAME-2025-HOME-01**.
4. Tie insights to advancement: upsell premium apparel, cross-sell drinkware/gifts, stock team stores by location.
5. Typical team store sales are **1–2 units**. Flag quantity >= 3, total_amount >= $150, bulk jerseys, or after-hours timestamps as possible resale stocking, employee theft, or POS misuse. Ticket `is_resale == true` is secondary-market activity — summarize by fan tier and gate.
6. All data is simulated for demo purposes only."""


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
        "tags": tool.get("tags", ["gameday", "texas-college"]),
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
        "name": "Texas College Game Day Revenue Assistant",
        "description": "Chat with Paciolan ticket scans and Square POS gameday revenue for Texas College athletics.",
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
    print("Creating Game Day Revenue Agent Builder tools…")
    for tool in TOOLS:
        upsert_tool(kb, api_key, tool)
    print("Creating gameday-revenue-data agent…")
    upsert_agent(kb, api_key)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
