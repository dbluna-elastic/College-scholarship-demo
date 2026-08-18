#!/usr/bin/env python3
"""Seed provisioning-requests with demo workflow variants for the oumet staff portal."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import PROVISIONING_INDEX, get_client

RESEARCHERS = [
    ("grad-avery", "avery.nguyen@ou.edu", "researcher-vm-11.met.ou.edu"),
    ("grad-brooks", "brooks.chen@ou.edu", "researcher-vm-12.met.ou.edu"),
    ("postdoc-kim", "kim.park@ou.edu", "researcher-vm-13.met.ou.edu"),
    ("faculty-morales", "morales@met.ou.edu", "researcher-vm-14.met.ou.edu"),
    ("grad-singh", "singh@ou.edu", "researcher-vm-15.met.ou.edu"),
    ("undergrad-taylor", "taylor@ou.edu", "researcher-vm-16.met.ou.edu"),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def iso_ago(hours: int) -> str:
    dt = datetime.now(timezone.utc) - timedelta(hours=hours)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def iso_ahead(minutes: int) -> str:
    dt = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def doc(
    *,
    suffix: str,
    dataset_name: str,
    dataset_ref: str,
    delivery_mode: str,
    status: str,
    permission_status: str,
    provision_status: str,
    workflow_label: str,
    researcher_idx: int,
    mount_path: str,
    hours_ago: int = 2,
    eta_minutes: int | None = 5,
    access_tier: str = "public",
    approved_by: str | None = None,
    access_url: str | None = None,
    failure_reason: str | None = None,
    extra_history: list[dict] | None = None,
) -> dict:
    rid = f"req-seed-{suffix}"
    r_id, email, vm = RESEARCHERS[researcher_idx % len(RESEARCHERS)]
    submitted = iso_ago(hours_ago)
    base_history = [
        {
            "timestamp": submitted,
            "status": "pending",
            "message": "Auto-queued by catalog agent based on dataset delivery rules",
            "actor": "system",
        }
    ]
    if permission_status == "approved" and approved_by:
        base_history.append({
            "timestamp": iso_ago(max(1, hours_ago - 1)),
            "status": "approved",
            "message": "Admin approved restricted dataset request",
            "actor": approved_by,
        })
    if provision_status == "in_progress":
        base_history.append({
            "timestamp": iso_ago(1),
            "status": "provisioning",
            "message": "Runner started mount/copy",
            "actor": "runner",
        })
    if provision_status == "complete":
        base_history.append({
            "timestamp": iso_ago(1),
            "status": "provisioning",
            "message": "Runner started mount/copy",
            "actor": "runner",
        })
        base_history.append({
            "timestamp": iso_ago(0),
            "status": "completed",
            "message": f"Dataset mounted at {mount_path}",
            "actor": "runner",
        })
    if permission_status == "denied":
        base_history.append({
            "timestamp": iso_ago(1),
            "status": "failed",
            "message": failure_reason or "Permission denied by data steward",
            "actor": "corey",
        })
    if extra_history:
        base_history.extend(extra_history)

    payload = {
        "request_id": rid,
        "researcher_id": r_id,
        "researcher_email": email,
        "dataset_ref": dataset_ref,
        "dataset_name": dataset_name,
        "target_vm": vm,
        "mount_path": mount_path,
        "source_path": f"/nfs/{dataset_name.lower()}",
        "submitted_at": submitted,
        "status": status,
        "access_tier": access_tier,
        "delivery_mode": delivery_mode,
        "permission_status": permission_status,
        "provision_status": provision_status,
        "workflow_label": workflow_label,
        "estimated_ready_at": iso_ahead(eta_minutes) if eta_minutes else None,
        "status_history": base_history,
    }
    if approved_by:
        payload["approved_at"] = iso_ago(max(1, hours_ago - 1))
        payload["approved_by"] = approved_by
    if access_url:
        payload["access_url"] = access_url
        payload["completed_at"] = iso_ago(0)
        payload["notification_sent_at"] = iso_ago(0)
    if failure_reason:
        payload["failure_reason"] = failure_reason
    return payload


# 20 demo requests covering auto-approve, permission, provisioning, and combinations.
SEED_REQUESTS: list[dict] = [
    # --- Auto-approved → awaiting provisioning (no permission gate) ---
    doc(suffix="001", dataset_name="GFS", dataset_ref="GFS reanalysis Sep 2017", delivery_mode="auto_mount",
        status="pending", permission_status="auto_approved", provision_status="pending",
        workflow_label="Auto-approved · Awaiting provisioning", researcher_idx=0,
        mount_path="/mnt/reanalysis/gfs", hours_ago=4, eta_minutes=5),
    doc(suffix="002", dataset_name="NAM", dataset_ref="NAM 12km reanalysis 2019", delivery_mode="auto_mount",
        status="pending", permission_status="auto_approved", provision_status="pending",
        workflow_label="Auto-approved · Awaiting provisioning", researcher_idx=1,
        mount_path="/mnt/reanalysis/nam", hours_ago=3, eta_minutes=4),
    doc(suffix="003", dataset_name="RAP", dataset_ref="RAP 13km archive Q3 2020", delivery_mode="auto_mount",
        status="approved", permission_status="auto_approved", provision_status="pending",
        workflow_label="Auto-approved · Queued for mount", researcher_idx=2,
        mount_path="/mnt/reanalysis/rap", hours_ago=6, eta_minutes=3),

    # --- Auto-approved → provisioning in progress ---
    doc(suffix="004", dataset_name="NEXRAD", dataset_ref="NEXRAD Irma 2017 L2", delivery_mode="auto_mount",
        status="provisioning", permission_status="auto_approved", provision_status="in_progress",
        workflow_label="Auto-approved · Provisioning in progress", researcher_idx=3,
        mount_path="/mnt/nexrad", hours_ago=2, eta_minutes=8),
    doc(suffix="005", dataset_name="GFS", dataset_ref="GFS 0.25° monthly means", delivery_mode="auto_mount",
        status="provisioning", permission_status="auto_approved", provision_status="in_progress",
        workflow_label="Auto-approved · Provisioning in progress", researcher_idx=4,
        mount_path="/mnt/reanalysis/gfs", hours_ago=1, eta_minutes=2),

    # --- Auto-approved → complete ---
    doc(suffix="006", dataset_name="HRRR", dataset_ref="HRRR archive case study", delivery_mode="auto_mount",
        status="completed", permission_status="auto_approved", provision_status="complete",
        workflow_label="Auto-approved · Complete", researcher_idx=0,
        mount_path="/mnt/hrrr", hours_ago=12,
        access_url="researcher-vm-11.met.ou.edu:/mnt/hrrr", eta_minutes=None),
    doc(suffix="007", dataset_name="GFS", dataset_ref="GFS ANAL 2018 summer", delivery_mode="auto_mount",
        status="completed", permission_status="auto_approved", provision_status="complete",
        workflow_label="Auto-approved · Complete", researcher_idx=1,
        mount_path="/mnt/reanalysis/gfs", hours_ago=24,
        access_url="researcher-vm-12.met.ou.edu:/mnt/reanalysis/gfs", eta_minutes=None),

    # --- Awaiting permission only (restricted, not yet approved) ---
    doc(suffix="008", dataset_name="CCS034", dataset_ref="CCS034 research collection", delivery_mode="approval_required",
        status="pending", permission_status="pending", provision_status="not_required",
        workflow_label="Awaiting permission", researcher_idx=2,
        mount_path="/mnt/research/ccs034", hours_ago=8, eta_minutes=1440, access_tier="restricted"),
    doc(suffix="009", dataset_name="ACARS", dataset_ref="ACARS regional profiles 2016", delivery_mode="approval_required",
        status="pending", permission_status="pending", provision_status="not_required",
        workflow_label="Awaiting permission", researcher_idx=3,
        mount_path="/mnt/research/acars", hours_ago=5, eta_minutes=1440, access_tier="restricted"),
    doc(suffix="010", dataset_name="CCS034", dataset_ref="CCS034 hurricane case subset", delivery_mode="approval_required",
        status="pending", permission_status="pending", provision_status="not_required",
        workflow_label="Awaiting permission", researcher_idx=4,
        mount_path="/mnt/research/ccs034", hours_ago=30, eta_minutes=1440, access_tier="restricted"),
    doc(suffix="011", dataset_name="ACARS", dataset_ref="ACARS CONUS ascent/descent", delivery_mode="approval_required",
        status="pending", permission_status="pending", provision_status="not_required",
        workflow_label="Awaiting permission", researcher_idx=5,
        mount_path="/mnt/research/acars", hours_ago=18, eta_minutes=1440, access_tier="restricted"),

    # --- Permission approved → awaiting provisioning ---
    doc(suffix="012", dataset_name="CCS034", dataset_ref="CCS034 May 2019 field campaign", delivery_mode="approval_required",
        status="approved", permission_status="approved", provision_status="pending",
        workflow_label="Permission granted · Awaiting provisioning", researcher_idx=0,
        mount_path="/mnt/research/ccs034", hours_ago=10, eta_minutes=15,
        access_tier="restricted", approved_by="sean"),
    doc(suffix="013", dataset_name="ACARS", dataset_ref="ACARS Gulf moisture study", delivery_mode="approval_required",
        status="approved", permission_status="approved", provision_status="pending",
        workflow_label="Permission granted · Awaiting provisioning", researcher_idx=1,
        mount_path="/mnt/research/acars", hours_ago=7, eta_minutes=12,
        access_tier="restricted", approved_by="corey"),

    # --- Permission approved + provisioning in progress ---
    doc(suffix="014", dataset_name="CCS034", dataset_ref="CCS034 supercell episode", delivery_mode="approval_required",
        status="provisioning", permission_status="approved", provision_status="in_progress",
        workflow_label="Permission granted · Provisioning in progress", researcher_idx=2,
        mount_path="/mnt/research/ccs034", hours_ago=4, eta_minutes=6,
        access_tier="restricted", approved_by="sean"),
    doc(suffix="015", dataset_name="ACARS", dataset_ref="ACARS boundary-layer transect", delivery_mode="approval_required",
        status="provisioning", permission_status="approved", provision_status="in_progress",
        workflow_label="Permission granted · Provisioning in progress", researcher_idx=3,
        mount_path="/mnt/research/acars", hours_ago=3, eta_minutes=5,
        access_tier="restricted", approved_by="corey"),

    # --- Full pipeline complete (permission + provision) ---
    doc(suffix="016", dataset_name="CCS034", dataset_ref="CCS034 archived mesonet merge", delivery_mode="approval_required",
        status="completed", permission_status="approved", provision_status="complete",
        workflow_label="Permission granted · Complete", researcher_idx=4,
        mount_path="/mnt/research/ccs034", hours_ago=48,
        access_tier="restricted", approved_by="sean",
        access_url="researcher-vm-15.met.ou.edu:/mnt/research/ccs034", eta_minutes=None),
    doc(suffix="017", dataset_name="ACARS", dataset_ref="ACARS cold-season sample", delivery_mode="approval_required",
        status="completed", permission_status="approved", provision_status="complete",
        workflow_label="Permission granted · Complete", researcher_idx=5,
        mount_path="/mnt/research/acars", hours_ago=36,
        access_tier="restricted", approved_by="corey",
        access_url="researcher-vm-16.met.ou.edu:/mnt/research/acars", eta_minutes=None),

    # --- Permission denied ---
    doc(suffix="018", dataset_name="CCS034", dataset_ref="CCS034 export-controlled subset", delivery_mode="approval_required",
        status="failed", permission_status="denied", provision_status="not_required",
        workflow_label="Permission denied", researcher_idx=0,
        mount_path="/mnt/research/ccs034", hours_ago=20, eta_minutes=None,
        access_tier="restricted",
        failure_reason="Export-control review: researcher not on approved access list"),

    # --- Auto-approved failed provision ---
    doc(suffix="019", dataset_name="NEXRAD", dataset_ref="NEXRAD mosaic 2015", delivery_mode="auto_mount",
        status="failed", permission_status="auto_approved", provision_status="failed",
        workflow_label="Auto-approved · Provisioning failed", researcher_idx=1,
        mount_path="/mnt/nexrad", hours_ago=14, eta_minutes=None,
        failure_reason="NFS source path unreachable from runner pod"),

    # --- Combination: permission pending while auto-mount sibling queued (distinct row) ---
    doc(suffix="020", dataset_name="GFS", dataset_ref="GFS reanalysis Jan 2013", delivery_mode="auto_mount",
        status="pending", permission_status="auto_approved", provision_status="pending",
        workflow_label="Auto-approved · Awaiting provisioning (backlog)", researcher_idx=2,
        mount_path="/mnt/reanalysis/gfs", hours_ago=72, eta_minutes=10,
        extra_history=[{
            "timestamp": iso_ago(70),
            "status": "pending",
            "message": "Queued behind restricted-dataset approval backlog",
            "actor": "system",
        }]),
]


def bulk_index(client, docs: list[dict], *, replace: bool) -> int:
    from elasticsearch.helpers import bulk

    actions = []
    for d in docs:
        if replace:
            actions.append({
                "_op_type": "index",
                "_index": PROVISIONING_INDEX,
                "_id": d["request_id"],
                "_source": d,
            })
        else:
            if client.exists(index=PROVISIONING_INDEX, id=d["request_id"]):
                continue
            actions.append({
                "_index": PROVISIONING_INDEX,
                "_id": d["request_id"],
                "_source": d,
            })

    if not actions:
        print("  no new documents to index")
        return 0

    ok, errors = bulk(client, actions, refresh=True)
    if errors:
        raise RuntimeError(f"bulk index errors: {errors[:3]}")
    print(f"  indexed {ok} provisioning requests")
    return ok


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed 20 OU Met provisioning demo requests")
    parser.add_argument("--replace", action="store_true", help="Overwrite req-seed-* documents")
    args = parser.parse_args()

    client = get_client()
    count = bulk_index(client, SEED_REQUESTS, replace=args.replace)
    print(f"Done. {count} documents in {PROVISIONING_INDEX} (seed ids req-seed-001 … req-seed-020).")


if __name__ == "__main__":
    main()
