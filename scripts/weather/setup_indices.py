#!/usr/bin/env python3
"""Create ou-met-catalog index with metadata-only mapping."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import CATALOG_INDEX, get_client

CATALOG_MAPPING = {
    "settings": {"number_of_shards": 1, "number_of_replicas": 0},
    "mappings": {
        "_meta": {
            "description": (
                "OU School of Meteorology operational data catalog. "
                "One document per NetCDF/GRIB file with THREDDS metadata and OPeNDAP source URLs. "
                "Elastic holds metadata only — file payloads remain on THREDDS/S3/NFS."
            )
        },
        "properties": {
            "file_id": {"type": "keyword"},
            "data_tier": {"type": "keyword"},
            "file_format": {"type": "keyword"},
            "dataset_name": {"type": "keyword"},
            "title": {"type": "text"},
            "temporal_start": {"type": "date"},
            "temporal_end": {"type": "date"},
            "geo_bbox": {"type": "geo_shape"},
            "variables": {"type": "keyword"},
            "vertical_levels": {"type": "integer"},
            "source_url": {"type": "keyword"},
            "opendap_url": {"type": "keyword"},
            "jupyterlite_launch_url": {"type": "keyword"},
            "file_size_bytes": {"type": "long"},
            "ingested_at": {"type": "date"},
            "owner_group": {"type": "keyword"},
            "access_tier": {"type": "keyword"},
            "catalog_path": {"type": "keyword"},
            "url_path": {"type": "keyword"},
            "httpserver_url": {"type": "keyword"},
            "cdmremote_url": {"type": "keyword"},
            "catalog_page_url": {"type": "keyword"},
            "feature_type": {"type": "keyword"},
            "modified_at": {"type": "date"},
            "access_services": {
                "type": "nested",
                "properties": {
                    "service": {"type": "keyword"},
                    "service_type": {"type": "keyword"},
                    "description": {"type": "text"},
                    "url": {"type": "keyword"},
                },
            },
        },
    },
}


ACCESS_MAPPING_FIELDS = {
    "url_path": {"type": "keyword"},
    "httpserver_url": {"type": "keyword"},
    "cdmremote_url": {"type": "keyword"},
    "catalog_page_url": {"type": "keyword"},
    "feature_type": {"type": "keyword"},
    "modified_at": {"type": "date"},
    "access_services": {
        "type": "nested",
        "properties": {
            "service": {"type": "keyword"},
            "service_type": {"type": "keyword"},
            "description": {"type": "text"},
            "url": {"type": "keyword"},
        },
    },
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--ensure-only",
        action="store_true",
        help="Create index if missing; update mapping without dropping data",
    )
    args = parser.parse_args()

    client = get_client()
    info = client.info()
    print(f"Connected to Elasticsearch {info['version']['number']}")

    if client.indices.exists(index=CATALOG_INDEX):
        if args.ensure_only:
            client.indices.put_mapping(
                index=CATALOG_INDEX,
                body={"properties": ACCESS_MAPPING_FIELDS},
            )
            print(f"  index {CATALOG_INDEX} ready (access mapping updated)")
            return
        client.indices.delete(index=CATALOG_INDEX)
        print(f"  dropped existing {CATALOG_INDEX}")

    client.indices.create(index=CATALOG_INDEX, body=CATALOG_MAPPING)
    print(f"  created index {CATALOG_INDEX}")


if __name__ == "__main__":
    main()
