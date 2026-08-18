# SNAP Fraud Detection template (`snapfraud`)

The `snapfraud` template connects to the **gawdzilla** cluster and the `snap-*` indices provisioned by the [snap-demo](https://github.com/) project.

## Prerequisites

1. Load synthetic SNAP data and cluster setup from **snap-demo**:
   - `scripts/setup_cluster.sh`
   - `scripts/generate_data.py` + `scripts/bulk_load.py`
   - `scripts/verify_detections.py`
2. Set `OK_KIBANA_API_KEY` (or `ELASTIC_API_KEY`) in `.env` for gawdzilla access.

## Agent Builder

Provision the `snap-fraud-investigator` agent and ES|QL tools from the snap-demo repo:

```bash
cd ../snap-demo/snap-demo
python3 scripts/setup_agent_builder.py
```

Or run the full College-scholarship-demo agent setup (includes SNAP when snap-demo is present):

```bash
bash scripts/setup_all_agents.sh
```

## Local testing

```
http://localhost:8089?template=snapfraud
```

Staff portal password: `staff`

## Kibana links

| Resource | URL |
|----------|-----|
| Investigator dashboard | `/app/dashboards#/view/130b4789-10ed-400f-890f-23086f5b76e8` |
| Agent Builder | `/app/agent_builder/chat/snap-fraud-investigator` |
| Cases | `/app/observability/cases` |

Base: `https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com`

## Seeded fraud entities

| Scenario | Entity |
|----------|--------|
| Same-cent trafficking | Store `4471` |
| Manual entry | Store `5102` |
| Volume spike (ML) | Store `3890` |
| Large baskets | Store `6123` |
| Drains / broken-up baskets | Store `7701`, `hh_basket_demo_001` |
| Cross-state ID | `ssn_hash_cross_state_demo_001` |
| Deceased transacting | `hh_deceased_demo_001` |
