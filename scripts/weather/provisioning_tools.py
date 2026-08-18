#!/usr/bin/env python3
"""Shared Agent Builder tool definitions for provisioning."""

from __future__ import annotations

from typing import Any

PROVISIONING_ESQL_TOOLS: list[dict[str, Any]] = [
    {
        "id": "ou-met-resolve-catalog-file",
        "type": "esql",
        "description": (
            "Look up catalog file_id, source_url, access_tier, and data_tier from ou-met-catalog. "
            "Use to determine whether a dataset needs VM mount, admin approval, or direct OPeNDAP access."
        ),
        "tags": ["ou-met", "catalog", "provisioning"],
        "configuration": {
            "query": (
                "FROM ou-met-catalog\n"
                "| WHERE dataset_name == ?dataset_name AND data_tier == ?data_tier\n"
                "| KEEP file_id, dataset_name, title, data_tier, source_url, opendap_url, access_tier\n"
                "| SORT title\n"
                "| LIMIT ?limit"
            ),
            "params": {
                "dataset_name": {"type": "string", "description": "Catalog dataset_name e.g. GFS, NEXRAD, HRRR"},
                "data_tier": {"type": "string", "description": "Data tier: live, reanalysis, or research"},
                "limit": {"type": "integer", "description": "Max matches (default 3)"},
            },
        },
    },
    {
        "id": "ou-met-check-provision-status",
        "type": "esql",
        "description": (
            "Check provisioning request status, estimated_ready_at, access_url, and notification state. "
            "Use when researcher asks if their data is ready."
        ),
        "tags": ["ou-met", "provisioning"],
        "configuration": {
            "query": (
                "FROM provisioning-requests\n"
                "| WHERE request_id == ?request_id\n"
                "| KEEP request_id, status, delivery_mode, dataset_name, target_vm, mount_path, "
                "access_url, estimated_ready_at, notification_sent_at, submitted_at, completed_at, failure_reason\n"
                "| LIMIT 1"
            ),
            "params": {
                "request_id": {"type": "string", "description": "Provisioning request_id"},
            },
        },
    },
    {
        "id": "ou-met-list-provision-queue",
        "type": "esql",
        "description": "Ops queue: pending, approved, or in-progress provisioning requests.",
        "tags": ["ou-met", "provisioning", "ops"],
        "configuration": {
            "query": (
                "FROM provisioning-requests\n"
                "| WHERE status IN (\"pending\", \"approved\", \"provisioning\")\n"
                "| KEEP request_id, researcher_id, dataset_name, target_vm, status, access_tier, delivery_mode, submitted_at\n"
                "| SORT submitted_at DESC\n"
                "| LIMIT ?limit"
            ),
            "params": {
                "limit": {"type": "integer", "description": "Max results (default 20)"},
            },
        },
    },
]

SUBMIT_WORKFLOW_ID = "ou-met-submit-provision-request"

SUBMIT_WORKFLOW_TOOL: dict[str, Any] = {
    "id": "ou-met-submit-provision-request",
    "type": "workflow",
    "description": (
        "INTERNAL: Auto-queue a VM mount when delivery rules require provisioning. "
        "Call ONLY after classifying delivery_mode as auto_mount or approval_required. "
        "Do NOT ask the user to request a mount. "
        "Requires request_id (req- + 12 hex), researcher_id, researcher_email, dataset_ref, dataset_name, "
        "target_vm, mount_path, submitted_at (UTC ISO), delivery_mode, estimated_ready_at (UTC ISO), "
        "access_tier (public|restricted), source_path."
    ),
    "tags": ["ou-met", "provisioning", "workflow"],
    "configuration": {"workflow_id": SUBMIT_WORKFLOW_ID},
}

UNIFIED_AGENT_INSTRUCTIONS = """You are the OU School of Meteorology data assistant.

Researchers ask for data in plain language. They should NEVER need to say "mount", "provision", or "copy to VM".
You find datasets, decide how they are delivered, and handle provisioning automatically when needed.

## Delivery rules (apply to EVERY matched catalog file)
Inspect data_tier, access_tier, dataset_name, and source_url from catalog results.

**direct** — ONLY when data_tier is "live" OR (data_tier is "research" AND source_url contains "dodsC"):
- Response: available now via OPeNDAP, cite source_url
- NEVER call ou-met-submit-provision-request for direct datasets

**auto_mount** — when data_tier is "reanalysis", OR (data_tier is "research" AND dataset_name is "NEXRAD"):
- Auto-queue mount silently; ETA 3–5 min (5–10 for NEXRAD)
- Call ou-met-submit-provision-request with delivery_mode auto_mount

**approval_required** — when access_tier is "restricted" OR dataset_name is "CCS034" or "ACARS":
- Auto-queue for admin review; ETA ~1 business day after approval
- Call ou-met-submit-provision-request with access_tier restricted, delivery_mode approval_required

## Defaults (use when not in the user's message)
- researcher_id: demo-researcher
- researcher_email: demo-researcher@ou.edu
- target_vm: researcher-vm-14.met.ou.edu
- mount_path: /mnt/reanalysis/{dataset} or /mnt/nexrad or /mnt/{dataset}

## Workflow when provisioning is needed
1. Find best catalog match (tier/variable/date/search tools)
2. Classify delivery per rules above
3. Generate request_id = "req-" + 12 hex chars
4. submitted_at and estimated_ready_at = UTC ISO (estimated_ready_at = now + 5 min for auto_mount, + 24h for approval)
5. Call ou-met-submit-provision-request
6. Respond with: what was found, delivery_mode, ETA, request_id, notification promise

## When user asks "is my data ready?"
- Use ou-met-check-provision-status
- If status complete and access_url set: tell them it is ready and give access_url
- If notification_sent_at is set: confirm they were notified

## Tool selection
- Catalog search: ou-met-search-by-tier, ou-met-search-by-variable, ou-met-search-by-date, ou-met-list-catalog, platform.core.search
- Classify / resolve: ou-met-resolve-catalog-file
- Auto-provision: ou-met-submit-provision-request (only for auto_mount or approval_required)
- Status: ou-met-check-provision-status

## Rules
- NEVER ask "would you like me to mount this?"
- ALWAYS explain ETA in plain language
- ALWAYS cite source_url for direct-access datasets
- Reanalysis GFS uses dataset_name "GFS" and data_tier "reanalysis"
- Never claim bytes are stored in Elastic

## Examples
- "I need GFS reanalysis for September 2017" → find GFS reanalysis → auto_mount → notify in ~5 min
- "What HRRR files are available?" → live OPeNDAP → direct URLs, no mount
- "I need CCS034 research data" → approval_required → notify after admin approval"""

OPS_AGENT_INSTRUCTIONS = """You are the OU Meteorology provisioning ops assistant for Sean and Corey.

Monitor the provisioning queue. Summarize pending vs approval-required requests.
When asked to approve a request, explain that ops runs: python scripts/provision_runner_stub.py --approve <request_id>

Use ou-met-list-provision-queue and ou-met-check-provision-status."""
