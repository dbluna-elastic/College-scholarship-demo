# Booster Engagement Drop Timeline — Data Scripts

Implements Phase 1 of the Engagement Drop Timeline build plan for the `booster-engagement-events` index on gawdzilla.

## Prerequisites

- `OK_KIBANA_API_KEY` (or `ELASTIC_API_KEY`) in repo root `.env`
- Optional: `OK_ELASTIC_ES_URL` (defaults to gawdzilla ES endpoint)
- Python 3.9+

## Quick start

```bash
# 1. Extend index mapping with timeline fields
bash scripts/booster/extend_engagement_mapping.sh

# 2. Generate daily NDJSON (evt-daily-* ids)
python3 scripts/booster/generate_engagement_events_daily.py

# 3. Bulk index into booster-engagement-events
bash scripts/booster/bulk_index_engagement_events.sh
```

## Demo donor

- **James Chen** — `ALUM-10001`
- Inflection date: **2025-09-01** (signals drop to zero for at-risk donors)
- Last gift: **2024-11-03** ($50,000)

## Kibana dashboard (manual)

Create the **Engagement Drop Timeline** dashboard in Kibana Lens per the build plan:

1. Panel 1 — Portfolio health (weekly line, all donors)
2. Panel 2 — Single-donor multi-signal timeline with annotations
3. Panel 3 — `delta_from_baseline` bar chart
4. Panel 4 — Event annotation table

Add dashboard controls for `donor_id` and date range. Default donor: `ALUM-10001`.

Update `js/config/templates/texascollege.js` `elastic.dashboards` with the saved dashboard ID once created.

## Agent Builder (booster-donor-data)

Create ES|QL tools and the booster donor chat agent:

```bash
python3 scripts/booster/setup_agent.py
```

Tool IDs: `booster-donor-portfolio-stats`, `booster-at-risk-donors`, `booster-at-risk-major-gifts`, `booster-top-affinity-donors`, `booster-donor-by-id`, `booster-engagement-events-summary`, `booster-case-metrics`.

## Alumni outreach email workflow

Deploy the Elastic Workflow + Agent Builder tool used by **Generate alumni email** on the donor scorecard:

```bash
python3 scripts/booster/setup_workflow.py
```

- Workflow: `texas-college-alumni-outreach-email` (ES|QL donor profile + engagement + AI draft)
- Tool: `booster-alumni-email-workflow` (attached to `booster-donor-data` agent; useful in chat)

**App note:** The donor scorecard button runs the workflow via the Kibana Workflows `/run` API (`js/modules/utils/workflowRunApi.js`), not Agent Builder `tools/_execute`. Agent Builder workflow tools currently drop `tool_params` when their schema is empty, which caused `donor_id` validation failures.

Run `setup_agent.py` after `setup_workflow.py` if you need the agent to reference the workflow tool on a fresh cluster.
