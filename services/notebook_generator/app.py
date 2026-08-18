#!/usr/bin/env python3
"""FastAPI notebook generator for JupyterLite fromURL= launches."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services" / "notebook_generator"))

from build_notebook import build_notebook, build_jupyterlite_launch_url  # noqa: E402

app = FastAPI(title="OU Met Notebook Generator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

JUPYTERLITE_URL = os.getenv(
    "JUPYTERLITE_URL",
    "https://jupyterlite.github.io/demo/lab/index.html",
)
GENERATOR_PUBLIC_URL = os.getenv("NOTEBOOK_GENERATOR_PUBLIC_URL", "http://localhost:8765")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/nb")
def notebook(
    source_url: str,
    lat_min: float = 33.0,
    lat_max: float = 37.0,
    lon_min: float = -103.0,
    lon_max: float = -94.0,
    variable: str | None = None,
):
    nb = build_notebook(source_url, lat_min, lat_max, lon_min, lon_max, variable)
    return JSONResponse(
        content=nb,
        headers={
            "Content-Disposition": 'attachment; filename="preview.ipynb"',
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.get("/launch")
def launch_url(
    source_url: str,
    lat_min: float = 33.0,
    lat_max: float = 37.0,
    lon_min: float = -103.0,
    lon_max: float = -94.0,
    variable: str | None = None,
) -> dict:
    """Return the full JupyterLite launch URL (for Kibana templates and testing)."""
    url = build_jupyterlite_launch_url(
        JUPYTERLITE_URL,
        GENERATOR_PUBLIC_URL,
        source_url,
        lat_min=lat_min,
        lat_max=lat_max,
        lon_min=lon_min,
        lon_max=lon_max,
        variable=variable,
    )
    return {"jupyterlite_url": url, "source_url": source_url}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("NOTEBOOK_GENERATOR_PORT", "8765"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
