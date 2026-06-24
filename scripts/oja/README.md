# OJA (okoja template) — Gawdzilla setup

Juvenile justice demo data from [okjjusticedata](https://github.com/) lives in four indices:

| Index | Description |
|-------|-------------|
| `youth_profiles` | Youth demographics, offense, supervision |
| `case_notes` | Officer notes and follow-ups |
| `assessments` | Risk assessment scores |
| `outcomes` | Discharge and recidivism |

## Load data (if needed)

Data is already on Gawdzilla in most environments. To reload from the sibling `okjjusticedata` repo:

```bash
python3 /path/to/okjjusticedata/okjjusticedata/bulk_load.py \
  --host "$OK_ELASTIC_ES_URL" \
  --api-key "$OK_KIBANA_API_KEY" \
  --recreate
```

## Agent Builder

Create `ok-oja-data` and ES|QL tools:

```bash
python3 scripts/oja/setup_workflow.py
python3 scripts/oja/setup_agent.py
```

### Supervisor email workflow

`setup_workflow.py` deploys:

- Workflow `oja-supervisor-email-draft` — ES|QL youth data + AI email draft
- Tool `oja-supervisor-email-workflow` — invoked from the **Generate supervisor email** button on the youth scorecard

Tool IDs (must match `agentChatStream.js` labels):

- `oja-youth-stats`
- `oja-high-risk-youth`
- `oja-recidivism-summary`
- `oja-youth-by-id`
- `oja-case-notes-search`
- `oja-county-caseload`

## App

Open `http://localhost:8089?template=okoja`. Staff login (`password: staff`) opens the OJA Operations Portal.
