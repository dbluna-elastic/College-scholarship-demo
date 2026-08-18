#!/usr/bin/env python3
"""
Generate stadium retail catalog (100 BKSTR-style items) and gameday sales into Gawdzilla.

Indexes:
  - stadium-retail-catalog  (100 SKUs available at stadium team stores)
  - stadium-retail-sales    (gameday merchandise transactions)

Usage:
    python3 scripts/gameday/generate_stadium_retail.py
    python3 scripts/gameday/generate_stadium_retail.py --bulk
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG_INDEX = "stadium-retail-catalog"
SALES_INDEX = "stadium-retail-sales"
GAME_ID = "GAME-2025-HOME-01"
CATALOG_NDJSON = Path(__file__).resolve().parent / "stadium_retail_catalog.ndjson"
SALES_NDJSON = Path(__file__).resolve().parent / "stadium_retail_sales.ndjson"

# BKSTR / campus bookstore-style merchandise (Texas College branded for demo)
CATALOG_SPECS: list[tuple[str, str, str, float]] = [
    # (category, subcategory, item_name, unit_price) — 100 items
    *[( "apparel", "t_shirts", name, price) for name, price in [
        ("Runner Performance Tee", 32), ("Arch Logo Short Sleeve Tee", 28), ("Vintage Wash Football Tee", 30),
        ("Women's V-Neck Spirit Tee", 30), ("Long Sleeve Thermal Tee", 38), ("Tie-Dye Game Day Tee", 34),
        ("Comfort Colors Pocket Tee", 36), ("Athletic Training Tee", 29), ("Alumni Est. Tee", 32),
        ("Homecoming 2025 Tee", 35),
    ]],
    *[( "apparel", "polos", name, price) for name, price in [
        ("Men's Pique Polo", 48), ("Women's Dry-Fit Polo", 46), ("Coach's Sideline Polo", 52),
        ("Alumni Association Polo", 50), ("Youth Performance Polo", 38),
    ]],
    *[( "apparel", "hoodies_sweatshirts", name, price) for name, price in [
        ("Runner Fleece Hoodie", 65), ("Crewneck Sweatshirt", 55), ("Full-Zip Track Jacket", 72),
        ("Women's Cropped Hoodie", 58), ("Sideline Quarter-Zip Pullover", 68), ("Champion Reverse Weave Hoodie", 75),
        ("Lightweight Stadium Hoodie", 62), ("Alumni Legacy Crew", 58),
    ]],
    *[( "apparel", "jerseys", name, price) for name, price in [
        ("Replica Football Jersey", 89), ("Authentic Limited Jersey", 120), ("Youth Replica Jersey", 65),
        ("Basketball Replica Jersey", 79), ("Baseball Pinstripe Jersey", 75), ("Hockey Style Jersey", 72),
    ]],
    *[( "apparel", "outerwear", name, price) for name, price in [
        ("Stadium Jacket", 95), ("Packable Rain Poncho", 18), ("Insulated Vest", 68),
        ("Sideline Coach's Jacket", 110), ("Women's Softshell Jacket", 88),
    ]],
    *[( "headwear", "caps", name, price) for name, price in [
        ("Structured Flex Fit Cap", 28), ("Adjustable Dad Hat", 24), ("Performance Visor", 22),
        ("Knit Cuffed Beanie", 26), ("Sideline Bucket Hat", 30), ("Women's Ponytail Cap", 28),
        ("Camo Logo Cap", 26), ("Gold Rush Limited Cap", 32),
    ]],
    *[( "headwear", "specialty", name, price) for name, price in [
        ("Winter Pom Beanie", 28), ("Sun Bucket Hat", 24), ("Graduation Cord Cap", 30),
        ("Trucker Mesh Back Hat", 26),
    ]],
    *[( "accessories", "bags", name, price) for name, price in [
        ("Drawstring Sport Pack", 18), ("Clear Stadium Bag", 22), ("Laptop Backpack", 55),
        ("Crossbody Gameday Bag", 35), ("Duffle Gym Bag", 48), ("Mini Belt Bag", 32),
    ]],
    *[( "accessories", "spirit", name, price) for name, price in [
        ("Woven Lanyard", 8), ("Car Magnet Set", 12), ("Auto Decal 2-Pack", 10),
        ("Spirit Towel", 15), ("Rally Towel", 12), ("Face Paint Kit", 14),
        ("Temporary Tattoo Sheet", 6), ("Logo Keychain", 8), ("Lapel Pin", 10),
    ]],
    *[( "drinkware", "bottles", name, price) for name, price in [
        ("Stainless Tumbler 20oz", 28), ("Insulated Water Bottle", 32), ("Logo Coffee Mug", 16),
        ("Tailgate Cup 4-Pack", 20), ("Stadium Sippy Cup", 14), ("Travel Tumbler 30oz", 34),
        ("Ceramic Latte Mug", 18), ("Glass Pint Set", 24),
    ]],
    *[( "gifts_collectibles", "home", name, price) for name, price in [
        ("Felt Pennant", 14), ("Garden Flag", 22), ("House Banner", 38),
        ("Ornament Ball", 16), ("Plush Mascot", 24), ("Bobblehead Mascot", 28),
        ("Mini Helmet", 35), ("Collectible Pin Set", 18), ("Logo Coaster Set", 16),
    ]],
    *[( "gifts_collectibles", "tailgate", name, price) for name, price in [
        ("Tailgate Chair", 45), ("Stadium Blanket", 42), ("Canopy Sidewall Panel", 55),
        ("Cornhole Board Set", 120), ("Cooler Tote", 38),
    ]],
    *[( "books_alumni", "graduation", name, price) for name, price in [
        ("Diploma Frame 8.5x11", 45), ("Graduation Stole", 38), ("Alumni Directory", 25),
        ("Campus History Book", 32), ("Yearbook Hardcover", 55),
    ]],
    *[( "books_alumni", "supplies", name, price) for name, price in [
        ("Spiral Notebook 5-Subject", 12), ("Logo Pen 3-Pack", 8), ("Sticky Notes Cube", 6),
        ("Scientific Calculator", 18), ("Blue Book Exam Pack", 5),
    ]],
    *[( "youth_kids", "apparel", name, price) for name, price in [
        ("Youth Spirit Tee", 22), ("Toddler Romper", 28), ("Kids Hoodie", 38),
        ("Youth Snapback Cap", 20), ("Baby Onesie", 24),         ("Youth Jersey", 45), ("Mini Basketball", 14),
    ]],
]

assert len(CATALOG_SPECS) == 100, f"Expected 100 catalog items, got {len(CATALOG_SPECS)}"

LOCATIONS = [
    ("Main Team Store — North Concourse", "North"),
    ("Alumni Pavilion Shop", "East"),
    ("South End Zone Pro Shop", "South"),
    ("Club Level Merch Kiosk", "Premium"),
    ("Kids Corner Store", "West"),
]

CATEGORY_WEIGHTS = {
    "apparel": 0.38,
    "headwear": 0.14,
    "accessories": 0.12,
    "drinkware": 0.10,
    "gifts_collectibles": 0.12,
    "books_alumni": 0.06,
    "youth_kids": 0.08,
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


def build_catalog() -> list[dict]:
    items = []
    for idx, (category, subcategory, item_name, unit_price) in enumerate(CATALOG_SPECS, start=1):
        sku = f"TC-{category[:3].upper()}-{idx:03d}"
        items.append({
            "sku": sku,
            "item_name": item_name,
            "category": category,
            "subcategory": subcategory,
            "unit_price": float(unit_price),
            "store_source": "campus_bookstore",
            "bkstr_style": True,
            "available_stadium": True,
            "search_text": f"{item_name} {category} {subcategory} texas college team store merchandise",
        })
    return items


def weighted_choice(items: list[dict]) -> dict:
    by_cat: dict[str, list[dict]] = {}
    for item in items:
        by_cat.setdefault(item["category"], []).append(item)
    cats = list(CATEGORY_WEIGHTS.keys())
    weights = [CATEGORY_WEIGHTS[c] for c in cats]
    category = random.choices(cats, weights=weights, k=1)[0]
    return random.choice(by_cat[category])


def _sale_from_item(
    item: dict,
    *,
    location_name: str,
    location_zone: str,
    quantity: int,
    transaction_time: str,
    transaction_id: str,
) -> dict:
    unit = float(item["unit_price"])
    return {
        "transaction_id": transaction_id,
        "sku": item["sku"],
        "item_name": item["item_name"],
        "category": item["category"],
        "subcategory": item["subcategory"],
        "game_id": GAME_ID,
        "location_name": location_name,
        "location_zone": location_zone,
        "quantity": quantity,
        "unit_price": unit,
        "total_amount": round(unit * quantity, 2),
        "transaction_time": transaction_time,
        "source_system": "square_clover",
        "sale_type": "retail",
    }


def build_anomaly_sales(catalog: list[dict]) -> list[dict]:
    """A handful of demo security outliers: bulk jerseys, after-hours, wrong-store volume."""
    by_name = {item["item_name"]: item for item in catalog}
    authentic = by_name["Authentic Limited Jersey"]
    replica = by_name["Replica Football Jersey"]
    cornhole = by_name["Cornhole Board Set"]
    tumbler = by_name["Stainless Tumbler 20oz"]
    return [
        _sale_from_item(
            authentic,
            location_name="Club Level Merch Kiosk",
            location_zone="Premium",
            quantity=12,
            transaction_time="2025-09-06T02:17:44Z",
            transaction_id="anom-bulk-authentic-jerseys",
        ),
        _sale_from_item(
            replica,
            location_name="Kids Corner Store",
            location_zone="West",
            quantity=8,
            transaction_time="2025-09-06T16:41:12Z",
            transaction_id="anom-kids-corner-replica-jerseys",
        ),
        _sale_from_item(
            cornhole,
            location_name="South End Zone Pro Shop",
            location_zone="South",
            quantity=5,
            transaction_time="2025-09-06T03:08:05Z",
            transaction_id="anom-after-hours-cornhole",
        ),
        _sale_from_item(
            tumbler,
            location_name="Main Team Store — North Concourse",
            location_zone="North",
            quantity=18,
            transaction_time="2025-09-06T14:22:31Z",
            transaction_id="anom-bulk-tumblers",
        ),
    ]


def build_sales(catalog: list[dict], count: int = 6200) -> list[dict]:
    base = datetime(2025, 9, 6, 11, 0, tzinfo=timezone.utc)
    sales = []
    for _ in range(count):
        item = weighted_choice(catalog)
        loc_name, loc_zone = random.choice(LOCATIONS)
        qty = random.choices([1, 2, 3], weights=[0.78, 0.18, 0.04], k=1)[0]
        offset_min = random.randint(0, 360)
        ts = base + timedelta(minutes=offset_min, seconds=random.randint(0, 59))
        sales.append(_sale_from_item(
            item,
            location_name=loc_name,
            location_zone=loc_zone,
            quantity=qty,
            transaction_time=ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
            transaction_id=str(uuid.uuid4()),
        ))
    sales.extend(build_anomaly_sales(catalog))
    return sales


def write_ndjson(path: Path, index: str, docs: list[dict]) -> None:
    lines = []
    for doc in docs:
        lines.append(json.dumps({"index": {"_index": index}}))
        lines.append(json.dumps(doc))
    path.write_text("\n".join(lines) + "\n")
    print(f"  Wrote {len(docs)} docs -> {path.name}")


def upsert_docs(es_url: str, api_key: str, index: str, docs: list[dict], id_field: str) -> None:
    lines = []
    for doc in docs:
        lines.append(json.dumps({"index": {"_index": index, "_id": doc[id_field]}}))
        lines.append(json.dumps(doc))
    payload = ("\n".join(lines) + "\n").encode("utf-8")
    req = urllib.request.Request(
        f"{es_url.rstrip('/')}/_bulk",
        data=payload,
        method="POST",
        headers={"Authorization": f"ApiKey {api_key}", "Content-Type": "application/x-ndjson"},
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
    if result.get("errors"):
        failed = [i for i in result.get("items", []) if i.get("index", {}).get("error")]
        raise RuntimeError(f"Bulk index errors: {json.dumps(failed[:2], indent=2)}")
    print(f"  Upserted {len(docs)} anomaly sales into {index}")


def bulk_index(es_url: str, api_key: str, path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(path)
    req = urllib.request.Request(
        f"{es_url.rstrip('/')}/_bulk",
        data=path.read_bytes(),
        method="POST",
        headers={"Authorization": f"ApiKey {api_key}", "Content-Type": "application/x-ndjson"},
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
    if result.get("errors"):
        failed = [i for i in result.get("items", []) if i.get("index", {}).get("error")]
        raise RuntimeError(f"Bulk index errors: {json.dumps(failed[:2], indent=2)}")
    print(f"  Bulk indexed {path.name}")


def ensure_indices(es_url: str, api_key: str) -> None:
    mapping = {
        "mappings": {
            "properties": {
                "sku": {"type": "keyword"},
                "item_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "category": {"type": "keyword"},
                "subcategory": {"type": "keyword"},
                "unit_price": {"type": "float"},
                "store_source": {"type": "keyword"},
                "bkstr_style": {"type": "boolean"},
                "available_stadium": {"type": "boolean"},
                "search_text": {"type": "text"},
                "game_id": {"type": "keyword"},
                "location_name": {"type": "keyword"},
                "location_zone": {"type": "keyword"},
                "quantity": {"type": "integer"},
                "total_amount": {"type": "float"},
                "transaction_time": {"type": "date"},
                "transaction_id": {"type": "keyword"},
                "source_system": {"type": "keyword"},
                "sale_type": {"type": "keyword"},
            }
        }
    }
    for index in (CATALOG_INDEX, SALES_INDEX):
        req = urllib.request.Request(
            f"{es_url.rstrip('/')}/{index}",
            data=json.dumps(mapping).encode(),
            method="PUT",
            headers={"Authorization": f"ApiKey {api_key}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req) as resp:
                resp.read()
            print(f"  [index {index}] ready")
        except urllib.error.HTTPError as e:
            if e.code == 400:
                print(f"  [index {index}] exists (skipped create)")
            else:
                raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bulk", action="store_true", help="Bulk index to Elasticsearch")
    parser.add_argument("--upsert-anomalies", action="store_true", help="Index only the demo security outlier sales")
    parser.add_argument("--sales", type=int, default=6200, help="Number of sale lines to generate")
    args = parser.parse_args()

    load_dotenv()
    random.seed(42)

    catalog = build_catalog()
    sales = build_sales(catalog, args.sales)
    anomalies = build_anomaly_sales(catalog)

    print(f"Catalog: {len(catalog)} items | Sales: {len(sales)} lines | Anomalies: {len(anomalies)}")
    if args.bulk or not args.upsert_anomalies:
        write_ndjson(CATALOG_NDJSON, CATALOG_INDEX, catalog)
        write_ndjson(SALES_NDJSON, SALES_INDEX, sales)

    if not args.bulk and not args.upsert_anomalies:
        print("Run with --bulk to index into Gawdzilla, or --upsert-anomalies for security outliers only.")
        return 0

    api_key = os.environ.get("OK_KIBANA_API_KEY") or os.environ.get("ELASTIC_API_KEY", "")
    es_url = os.environ.get("OK_ELASTIC_ES_URL", "https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com:443")
    if not api_key:
        print("Set OK_KIBANA_API_KEY in .env", file=sys.stderr)
        return 1

    print(f"Elasticsearch: {es_url}")
    ensure_indices(es_url, api_key)
    if args.upsert_anomalies:
        upsert_docs(es_url, api_key, SALES_INDEX, anomalies, "transaction_id")
    if args.bulk:
        bulk_index(es_url, api_key, CATALOG_NDJSON)
        bulk_index(es_url, api_key, SALES_NDJSON)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
