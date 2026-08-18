#!/usr/bin/env python3
"""Create provisioning-requests index for mount/copy workflow tracking."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import PROVISIONING_INDEX, get_client

PROVISIONING_MAPPING = {
    "settings": {"number_of_shards": 1, "number_of_replicas": 0},
    "mappings": {
        "_meta": {
            "description": (
                "OU Meteorology data provisioning requests. "
                "Elastic orchestrates NFS mount/copy workflows — metadata and audit only."
            )
        },
        "properties": {
            "request_id": {"type": "keyword"},
            "researcher_id": {"type": "keyword"},
            "researcher_email": {"type": "keyword"},
            "dataset_ref": {"type": "keyword"},
            "dataset_name": {"type": "keyword"},
            "target_vm": {"type": "keyword"},
            "mount_path": {"type": "keyword"},
            "source_path": {"type": "keyword"},
            "submitted_at": {"type": "date"},
            "approved_at": {"type": "date"},
            "approved_by": {"type": "keyword"},
            "completed_at": {"type": "date"},
            "status": {"type": "keyword"},
            "status_history": {
                "type": "nested",
                "properties": {
                    "timestamp": {"type": "date"},
                    "status": {"type": "keyword"},
                    "message": {"type": "text"},
                    "actor": {"type": "keyword"},
                },
            },
            "access_url": {"type": "keyword"},
            "access_tier": {"type": "keyword"},
            "delivery_mode": {"type": "keyword"},
            "permission_status": {"type": "keyword"},
            "provision_status": {"type": "keyword"},
            "workflow_label": {"type": "keyword"},
            "estimated_ready_at": {"type": "date"},
            "notification_sent_at": {"type": "date"},
            "expires_at": {"type": "date"},
            "failure_reason": {"type": "text"},
        },
    },
}


def main() -> None:
    client = get_client()
    if not client.indices.exists(index=PROVISIONING_INDEX):
        client.indices.create(index=PROVISIONING_INDEX, body=PROVISIONING_MAPPING)
        print(f"  created index {PROVISIONING_INDEX}")
        return

    client.indices.put_mapping(index=PROVISIONING_INDEX, body={"properties": PROVISIONING_MAPPING["mappings"]["properties"]})
    print(f"  index {PROVISIONING_INDEX} ready (mapping updated)")


if __name__ == "__main__":
    main()
