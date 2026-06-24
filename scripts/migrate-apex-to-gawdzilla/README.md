# Migrate Apex → Gawdzilla (single-cluster demo)

Moves scholarship-demo data and the `studentcounselor` Agent Builder agent from the Apex deployment to Gawdzilla so you can decommission Apex.

## What gets migrated

| Asset | Index / ID |
|-------|------------|
| Student profiles | `students` |
| Scholarship search (RRF / semantic) | `scholarship_index_elser` |
| Scholarship agent tool | `scholarship_index` |
| Counselor policies | `counselor_policies` |
| Agent tools | `counselor_policies`, `gsustudenthelper`, `scholarship_index` |
| Chat agent | `studentcounselor` |

**Note:** `gsustudenthelper` references `web-crawl-test`, which is missing on Apex today. The tool is still copied; add that index separately if you need university web crawl answers.

## Prerequisites

- Apex API key with read access (`ELASTIC_API_KEY` in `.env`)
- Gawdzilla API key with index + Agent Builder write (`OK_KIBANA_API_KEY`)
- ELSER inference endpoint `.elser-2-elastic` on Gawdzilla (already present on standard Elastic Cloud)

## Run

```bash
python3 scripts/migrate-apex-to-gawdzilla/migrate.py
```

Options:

- `--indices-only` — data indices only
- `--agents-only` — Agent Builder tools + agent only

## After migration

1. Point `.env` at Gawdzilla (defaults in `env.template` are updated):

   ```bash
   ELASTIC_ES_URL=https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com:443
   ELASTIC_KB_URL=https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com
   OK_KIBANA_URL=https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com
   OK_ELASTIC_ES_URL=https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com:443
   ```

2. Use one API key for both `ELASTIC_API_KEY` and `OK_KIBANA_API_KEY` (same Gawdzilla deployment), or keep both set to the same value.

3. Rebuild Docker: `docker compose up --build -d`

4. Verify: staff login → counselor dashboard loads students; student login → matched scholarships; chat uses `studentcounselor` on Gawdzilla.
