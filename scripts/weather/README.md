# OU Meteorology weather template setup

Provisions the `oumet` template on Gawdzilla (same cluster as other demo templates).

## Prerequisites

From repo root, set in `.env`:

- `ELASTIC_ES_URL` (or `ELASTICSEARCH_URL`)
- `OK_KIBANA_URL` / `ELASTIC_KB_URL`
- `OK_KIBANA_API_KEY` (or `ELASTIC_API_KEY`)

## Quick setup (catalog already populated)

```bash
python3 scripts/weather/run_demo.py --skip-crawl
```

## Full setup (recreate catalog from THREDDS)

```bash
python3 scripts/weather/run_demo.py
```

## Individual scripts

| Script | Purpose |
|--------|---------|
| `setup_indices.py` | Create `ou-met-catalog` index |
| `setup_provisioning_index.py` | Create `provisioning-requests` index |
| `thredds_crawler.py` | Crawl THREDDS and bulk-index metadata |
| `setup_agent_builder.py` | `ou-met-catalog-agent` + ES\|QL tools |
| `setup_provisioning_agent.py` | Ops agent + provision workflow |
| `seed_provisioning_requests.py` | Seed 20 demo requests (`--replace` to refresh) |
| `backfill_jupyterlite_urls.py` | Add `jupyterlite_launch_url` to catalog docs |
| `setup_kibana.py` | Kibana data view + **Open in JupyterLite** column |

## JupyterLite launch

```bash
pip install -r requirements-generator.txt
uvicorn services.notebook_generator.app:app --port 8765
```

See [OU_JupyterLite_Launch.md](./OU_JupyterLite_Launch.md).

## Template

Open `http://localhost:8089?template=oumet` (or `npm run dev` on port 5173).

- Public chat: `ou-met-catalog-agent`
- Staff login (`staff` / any campus ID): provisioning ops portal
- Ops chat: `ou-met-provisioning-agent`
