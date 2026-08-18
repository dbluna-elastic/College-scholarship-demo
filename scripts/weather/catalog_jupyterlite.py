"""JupyterLite launch URL helpers for catalog documents."""

from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "services" / "notebook_generator"))

from build_notebook import build_jupyterlite_launch_url  # noqa: E402

OKLAHOMA_BBOX = {
    "lat_min": 33.0,
    "lat_max": 37.0,
    "lon_min": -103.0,
    "lon_max": -94.0,
}


def jupyterlite_base() -> str:
    return os.getenv(
        "JUPYTERLITE_URL",
        "https://jupyterlite.github.io/demo/lab/index.html",
    )


def generator_public_base() -> str:
    return os.getenv("NOTEBOOK_GENERATOR_PUBLIC_URL", "http://localhost:8765")


def launch_url_for_source(
    source_url: str,
    *,
    lat_min: float | None = None,
    lat_max: float | None = None,
    lon_min: float | None = None,
    lon_max: float | None = None,
    variable: str | None = None,
) -> str | None:
    if not source_url or "dods" not in source_url.lower():
        return None
    bbox = OKLAHOMA_BBOX.copy()
    if lat_min is not None:
        bbox["lat_min"] = lat_min
    if lat_max is not None:
        bbox["lat_max"] = lat_max
    if lon_min is not None:
        bbox["lon_min"] = lon_min
    if lon_max is not None:
        bbox["lon_max"] = lon_max
    return build_jupyterlite_launch_url(
        jupyterlite_base(),
        generator_public_base(),
        source_url,
        variable=variable or os.getenv("JUPYTERLITE_DEFAULT_VARIABLE", "Temperature_surface"),
        **bbox,
    )


def attach_launch_url(doc: dict) -> dict:
    source = doc.get("opendap_url") or doc.get("source_url")
    url = launch_url_for_source(source) if source else None
    if url:
        doc["jupyterlite_launch_url"] = url
    return doc
