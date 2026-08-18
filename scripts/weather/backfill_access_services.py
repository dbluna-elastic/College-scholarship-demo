#!/usr/bin/env python3
"""Backfill access_services and related THREDDS access fields on ou-met-catalog docs."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog_access import access_fields_from_doc
from config import CATALOG_INDEX, get_client


def main() -> None:
    client = get_client()
    resp = client.search(
        index=CATALOG_INDEX,
        size=1000,
        query={"match_all": {}},
        _source=True,
    )
    hits = resp["hits"]["hits"]
    updated = 0
    skipped = 0

    for hit in hits:
        doc_id = hit["_id"]
        source = {**hit.get("_source", {})}
        if source.get("access_services"):
            skipped += 1
            continue

        fields = access_fields_from_doc(source)
        if not fields.get("access_services"):
            skipped += 1
            continue

        client.update(index=CATALOG_INDEX, id=doc_id, doc=fields)
        updated += 1

    client.indices.refresh(index=CATALOG_INDEX)
    print(f"  backfilled access metadata on {updated} docs ({skipped} skipped) in {CATALOG_INDEX}")


if __name__ == "__main__":
    main()
