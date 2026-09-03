# Wyoming data classification template (`wyoming`)

The `wyoming` template surfaces the **synthetic** ETS classification corpus from [data-classification-tool](https://github.com/) in this multi-tenant demo.

Indices (must exist on the demo Elasticsearch cluster — gawdzilla via `/api/elastic/ok-fraud/es`):

| Index | Role |
|-------|------|
| `wyo-classified-public` | Public documents |
| `wyo-classified-internal` | Internal documents |
| `wyo-classified-confidential` | Confidential documents |
| `wyo-classified-restricted` | Restricted documents |
| `wyo-public-share` | Public-share zone (spillage demo) |
| `wyo-spillage-alerts` | Alert index for restricted-in-public-share |

Dashboard: `wyo-classification-overview`.

## Load data

From the **data-classification-tool** repo (not this one):

```bash
python scripts/setup_cluster.py --phase all
python scripts/generate_corpus.py
python scripts/load_corpus.py
python scripts/verify_corpus.py
```

Point that tool’s `.env` `ELASTICSEARCH_URL` / `KIBANA_URL` at the **same** cluster this demo proxies (Gawdzilla), or KPIs in `?template=wyoming` will be empty.

## Open the portal

```
http://localhost:8089?template=wyoming
```

Staff login: password `staff`.

## Chat agent

Provision `wyo-classify` and its ES|QL tools on Gawdzilla:

```bash
python3 scripts/wyoming/setup_agent.py
```

Demo prompts: snapshot counts, documents by level, pending queue, owner agencies, restricted files in public share.

The review-console confirm/override UI stays in data-classification-tool (`apps/review-console`). This template is the showcase: landing, KPIs, pending queue, agency breakdown, Kibana link, and chat.
