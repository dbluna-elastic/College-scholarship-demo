#!/usr/bin/env python3
"""Delivery classification and provisioning helpers."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from config import CATALOG_INDEX, PROVISIONING_INDEX, get_client

# Datasets that always require admin approval before mount
RESTRICTED_DATASETS = frozenset({"CCS034", "ACARS"})


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def iso_in_minutes(minutes: int) -> str:
    dt = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def new_request_id() -> str:
    return f"req-{uuid.uuid4().hex[:12]}"


def is_opendap_accessible(source_url: str | None) -> bool:
    if not source_url:
        return False
    lower = source_url.lower()
    return "thredds" in lower and ("/dodsc/" in lower or "/dods/" in lower or "/fileserver/" in lower)


def default_mount_path(dataset_name: str, data_tier: str) -> str:
    slug = dataset_name.lower().replace("_", "")
    if data_tier == "reanalysis":
        return f"/mnt/reanalysis/{slug}"
    if dataset_name == "NEXRAD":
        return "/mnt/nexrad"
    return f"/mnt/{slug}"


def classify_delivery(catalog_doc: dict[str, Any]) -> dict[str, Any]:
    """
    Decide how a catalog file reaches the researcher.

    Returns delivery_mode: direct | auto_mount | approval_required
    """
    access = catalog_doc.get("access_tier") or "public"
    tier = catalog_doc.get("data_tier") or ""
    dataset = catalog_doc.get("dataset_name") or ""
    source = catalog_doc.get("opendap_url") or catalog_doc.get("source_url") or ""

    if access == "restricted" or dataset in RESTRICTED_DATASETS:
        return {
            "delivery_mode": "approval_required",
            "needs_provisioning": True,
            "access_tier": "restricted",
            "initial_status": "pending",
            "eta_minutes": 24 * 60,
            "eta_message": "typically within 1 business day after admin approval",
            "researcher_notice": (
                "This dataset requires admin approval before it can be mounted on your VM. "
                "You do not need to request a mount — the system has queued it for review."
            ),
        }

    if tier == "reanalysis":
        return {
            "delivery_mode": "auto_mount",
            "needs_provisioning": True,
            "access_tier": "public",
            "initial_status": "pending",
            "eta_minutes": 5,
            "eta_message": "approximately 3–5 minutes",
            "researcher_notice": (
                "This reanalysis dataset is stored on campus NFS and will be mounted on your VM automatically. "
                "You will be notified when it is ready."
            ),
        }

    if tier == "research" and dataset == "NEXRAD":
        return {
            "delivery_mode": "auto_mount",
            "needs_provisioning": True,
            "access_tier": "public",
            "initial_status": "pending",
            "eta_minutes": 8,
            "eta_message": "approximately 5–10 minutes",
            "researcher_notice": (
                "NEXRAD Level-II files are large and will be mounted on your VM automatically. "
                "You will be notified when ready."
            ),
        }

    if tier == "live" and is_opendap_accessible(source):
        return {
            "delivery_mode": "direct",
            "needs_provisioning": False,
            "access_tier": "public",
            "initial_status": None,
            "eta_minutes": 0,
            "eta_message": "available now",
            "researcher_notice": (
                "This dataset is available immediately via OPeNDAP — open the URL in Jupyter with xarray. "
                "No VM mount is required."
            ),
        }

    if tier == "research" and is_opendap_accessible(source):
        return {
            "delivery_mode": "direct",
            "needs_provisioning": False,
            "access_tier": "public",
            "initial_status": None,
            "eta_minutes": 0,
            "eta_message": "available now",
            "researcher_notice": (
                "This case-study file is HTTP-accessible. Use the OPeNDAP URL directly in Jupyter — no mount needed."
            ),
        }

    return {
        "delivery_mode": "auto_mount",
        "needs_provisioning": True,
        "access_tier": "public",
        "initial_status": "pending",
        "eta_minutes": 5,
        "eta_message": "approximately 3–5 minutes",
        "researcher_notice": (
            "This dataset will be mounted on your VM automatically. You will be notified when it is ready."
        ),
    }


def lookup_catalog_file(
    *,
    dataset_name: str | None = None,
    file_id: str | None = None,
    data_tier: str | None = None,
) -> dict[str, Any] | None:
    client = get_client()
    if file_id:
        try:
            return client.get(index=CATALOG_INDEX, id=file_id)["_source"]
        except Exception:
            return None

    must: list[dict] = []
    if dataset_name:
        must.append({"term": {"dataset_name": dataset_name}})
    if data_tier:
        must.append({"term": {"data_tier": data_tier}})
    if not must:
        return None

    resp = client.search(index=CATALOG_INDEX, size=1, query={"bool": {"must": must}}, sort=["title"])
    hits = resp["hits"]["hits"]
    return hits[0]["_source"] if hits else None


def build_request_doc(
    *,
    researcher_id: str,
    dataset_ref: str,
    dataset_name: str,
    target_vm: str,
    mount_path: str,
    delivery_mode: str,
    researcher_email: str = "",
    access_tier: str = "public",
    source_path: str = "",
    request_id: str | None = None,
    eta_minutes: int = 5,
) -> dict[str, Any]:
    rid = request_id or new_request_id()
    now = utc_now()
    status = "pending" if access_tier == "restricted" else "pending"
    return {
        "request_id": rid,
        "researcher_id": researcher_id,
        "researcher_email": researcher_email,
        "dataset_ref": dataset_ref,
        "dataset_name": dataset_name,
        "target_vm": target_vm,
        "mount_path": mount_path,
        "source_path": source_path or f"/nfs/{dataset_name.lower()}",
        "submitted_at": now,
        "status": status,
        "access_tier": access_tier,
        "delivery_mode": delivery_mode,
        "estimated_ready_at": iso_in_minutes(eta_minutes) if eta_minutes else None,
        "status_history": [
            {
                "timestamp": now,
                "status": status,
                "message": "Auto-queued by catalog agent based on dataset delivery rules",
                "actor": "system",
            }
        ],
    }


def submit_request(**kwargs: Any) -> dict[str, Any]:
    doc = build_request_doc(**kwargs)
    client = get_client()
    client.index(index=PROVISIONING_INDEX, id=doc["request_id"], document=doc, refresh=True)
    return doc


def get_request(request_id: str) -> dict[str, Any] | None:
    client = get_client()
    try:
        return client.get(index=PROVISIONING_INDEX, id=request_id)["_source"]
    except Exception:
        return None


def append_status(
    request_id: str,
    *,
    status: str,
    message: str,
    actor: str = "runner",
    access_url: str | None = None,
    notify: bool = False,
) -> None:
    client = get_client()
    doc = client.get(index=PROVISIONING_INDEX, id=request_id)
    source = doc["_source"]
    now = utc_now()
    history = list(source.get("status_history") or [])
    history.append({"timestamp": now, "status": status, "message": message, "actor": actor})

    update: dict[str, Any] = {"status": status, "status_history": history}
    if status == "complete":
        update["completed_at"] = now
        if access_url:
            update["access_url"] = access_url
    if status == "approved":
        update["approved_at"] = now
        update["approved_by"] = actor
    if notify:
        update["notification_sent_at"] = now
        history[-1]["message"] = f"{message} Notification sent to {source.get('researcher_email') or source.get('researcher_id')}."

    client.update(index=PROVISIONING_INDEX, id=request_id, doc=update, refresh=True)
