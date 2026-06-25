# ODMHSAS Fraud & Outcomes Agent (`ok-fraud`)

Powers staff chat on `?template=okmentalhealth` and fraud detail views. The app uses a **hybrid fast path** for common fraud, crisis, and relapse questions before calling Agent Builder.

## Prerequisites

- Agent ID: `ok-fraud` (must match `js/config/templates/okmentalhealth.js` `elastic.fraudAgentId`)
- Indices on gawdzilla ES: `ok-fraud-phantom-billing`, `ok-fraud-*`, `ok-*`, `ok-client`
- API key: `OK_KIBANA_API_KEY` in `.env`

## Setup

```bash
python3 scripts/fraud/setup_agent.py
```

## Custom ES|QL tools

| Tool ID | Purpose |
|---------|---------|
| `ok-fraud-ytd-loss` | YTD total fraud loss |
| `ok-fraud-flagged-claims` | Count of flagged claims |
| `ok-fraud-high-risk` | High-risk claim count (Risk_Score >= 75) |
| `ok-fraud-loss-by-flag` | Loss by Flag_Type |
| `ok-fraud-resolution-rate` | Investigator assignment rate |
| `ok-fraud-high-priority` | Top priority cases |
| `ok-crisis-stats` | Crisis call center KPIs |
| `ok-clinical-relapse` | Statewide relapse rate |

## Verify

1. Open `http://localhost:8089?template=okmentalhealth`
2. Staff login → open chat
3. Try: **"What is the total fraud detected YTD?"** — should use fast path or `ok-fraud-ytd-loss` tool step
