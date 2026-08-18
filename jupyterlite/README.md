# JupyterLite deployment (OU Met catalog demo)

JupyterLite is a static site — no server required after build.

## Quick demo (no build)

Use the public JupyterLite demo with the notebook generator:

```bash
# Terminal 1 — generator (must be reachable from the browser; use ngrok for remote JupyterLite)
pip install -r requirements-generator.txt
NOTEBOOK_GENERATOR_PUBLIC_URL=http://localhost:8765 \
  uvicorn services.notebook_generator.app:app --port 8765

# Terminal 2 — print a launch URL
python scripts/jupyterlite_launch.py
```

Open the printed URL in a browser. JupyterLite fetches the generated `.ipynb` via `?fromURL=`.

## GitHub Pages (recommended for July 14)

1. Fork [jupyterlite/demo](https://github.com/jupyterlite/demo) or add `jupyterlite-core` to this repo.
2. Build:
   ```bash
   pip install jupyterlite-core
   jupyter lite build --contents jupyterlite/contents
   ```
3. Deploy `_output/` to GitHub Pages or S3.
4. Set `JUPYTERLITE_URL` in `.env` to your deployed URL.

## Config files

- `jupyter-lite.json` — site metadata
- `jupyter_lite_config.json` — Pyodide kernel settings

Packages (`xarray`, `netcdf4`, `matplotlib`) install at runtime via the `%pip install` cell in generated notebooks (~10–15s first run).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `JUPYTERLITE_URL` | Base JupyterLite lab URL |
| `NOTEBOOK_GENERATOR_PUBLIC_URL` | Public `/nb` endpoint (CORS required) |
| `NOTEBOOK_GENERATOR_PORT` | Local uvicorn port (default 8765) |
| `JUPYTERLITE_DEFAULT_VARIABLE` | Default GRIB variable for plot cell |

## CORS

The generator must return `Access-Control-Allow-Origin: *` on `/nb` — JupyterLite fetches cross-origin in the browser.

THREDDS (`thredds.ucar.edu`) already allows OPeNDAP CORS for demo data.
