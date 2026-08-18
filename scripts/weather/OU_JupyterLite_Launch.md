# OU Meteorology — Open in JupyterLite

Researchers click **Open in JupyterLite** on a catalog search result and land in a pre-populated notebook scoped to Oklahoma (default bbox).

## Components

| Piece | Location |
|-------|----------|
| Notebook generator (FastAPI) | `services/notebook_generator/` |
| Launch URL builder | `scripts/catalog_jupyterlite.py` |
| Catalog field | `jupyterlite_launch_url` on `ou-met-catalog` |
| Kibana column | `scripts/setup_kibana.py` — Discover + dashboard |
| Backfill | `scripts/backfill_jupyterlite_urls.py` |

## Quick start

```bash
pip install -r requirements-generator.txt

# Generator (public URL must match what the browser can reach)
NOTEBOOK_GENERATOR_PUBLIC_URL=http://localhost:8765 \
  uvicorn services.notebook_generator.app:app --host 0.0.0.0 --port 8765

# Backfill launch URLs on catalog docs + refresh Kibana
python scripts/backfill_jupyterlite_urls.py
python scripts/setup_kibana.py
```

## Launch URL shape

```
https://jupyterlite.example/lab/index.html
  ?fromURL=https%3A%2F%2Fgenerator%2Fnb%3Fsource_url%3D...%26lat_min%3D33%26lat_max%3D37%26lon_min%3D-103%26lon_max%3D-94
```

Default bounding box: Oklahoma (33–37°N, 103–94°W). Generator converts longitude to 0–360 for GFS.

## Demo beat (July 14)

1. Kibana Discover — filter reanalysis, draw Oklahoma bbox.
2. Click **Open in JupyterLite** on a result row.
3. JupyterLite opens; notebook has source URL + subset cells.
4. Run all cells → temperature map in ~20s (browser only).

## Gotchas

- Generator must be **publicly reachable** with CORS — `localhost` only works if JupyterLite is also local.
- GRIB variable names vary — notebook prints `list(ds.data_vars)[:20]` for editing.
- Pyodide is slower than native Python; fine for preview plots.

See [jupyterlite/README.md](jupyterlite/README.md) for deployment options.
