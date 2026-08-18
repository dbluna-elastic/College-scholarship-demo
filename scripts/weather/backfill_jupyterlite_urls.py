#!/usr/bin/env python3
"""Backfill jupyterlite_launch_url on existing ou-met-catalog documents."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog_jupyterlite import attach_launch_url
from config import CATALOG_INDEX, get_client


def main() -> None:
    client = get_client()
    resp = client.search(
        index=CATALOG_INDEX,
        size=500,
        query={"exists": {"field": "opendap_url"}},
        _source=["opendap_url", "source_url"],
    )
    hits = resp["hits"]["hits"]
    updated = 0
    for hit in hits:
        doc_id = hit["_id"]
        source = {**hit["_source"]}
        before = source.get("jupyterlite_launch_url")
        attach_launch_url(source)
        after = source.get("jupyterlite_launch_url")
        if after and after != before:
            client.update(
                index=CATALOG_INDEX,
                id=doc_id,
                doc={"jupyterlite_launch_url": after},
            )
            updated += 1
    print(f"  backfilled jupyterlite_launch_url on {updated} / {len(hits)} catalog docs")


if __name__ == "__main__":
    main()
