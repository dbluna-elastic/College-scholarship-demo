"""Build a Jupyter notebook JSON document for JupyterLite fromURL= launch."""

from __future__ import annotations

from urllib.parse import quote


def normalize_longitude(lon: float) -> float:
    """GFS and many global datasets use 0-360 longitude."""
    if lon < 0:
        return lon + 360
    return lon


def build_notebook(
    source_url: str,
    lat_min: float,
    lat_max: float,
    lon_min: float,
    lon_max: float,
    variable: str | None = None,
) -> dict:
    lon_min_n = normalize_longitude(lon_min)
    lon_max_n = normalize_longitude(lon_max)

    intro = (
        f"# Meteorology data preview\n\n"
        f"**Source:** `{source_url}`\n\n"
        f"**Bounding box:** lat {lat_min}–{lat_max}, lon {lon_min}–{lon_max} "
        f"(lon {lon_min_n}–{lon_max_n} if dataset uses 0–360)\n\n"
        f"This notebook streams data via OPeNDAP — nothing is downloaded locally "
        f"except the bytes you actually plot.\n\n"
        f"GRIB variable names vary by dataset. Run the load cell and inspect "
        f"`list(ds.data_vars)` before plotting."
    )

    setup_code = "%pip install -q xarray netcdf4 matplotlib\nimport xarray as xr"

    load_code = (
        f'url = "{source_url}"\n'
        f"ds = xr.open_dataset(url)\n"
        f"print(list(ds.data_vars)[:20])  # inspect available variables\n"
        f"ds"
    )

    var_hint = variable or "Temperature_surface"
    plot_code = (
        "# Subset to the requested region and plot\n"
        f'subset = ds["{var_hint}"].sel(\n'
        f"    lat=slice({lat_max}, {lat_min}),  # lat often decreasing\n"
        f"    lon=slice({lon_min_n}, {lon_max_n}),\n"
        f").isel(time=0)\n"
        f'subset.plot(cmap="RdYlBu_r", figsize=(10, 6))'
    )

    return {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": {
            "kernelspec": {"name": "python", "display_name": "Python (Pyodide)"},
            "language_info": {"name": "python"},
        },
        "cells": [
            {"cell_type": "markdown", "metadata": {}, "source": intro},
            {
                "cell_type": "code",
                "metadata": {},
                "source": setup_code,
                "execution_count": None,
                "outputs": [],
            },
            {
                "cell_type": "code",
                "metadata": {},
                "source": load_code,
                "execution_count": None,
                "outputs": [],
            },
            {
                "cell_type": "code",
                "metadata": {},
                "source": plot_code,
                "execution_count": None,
                "outputs": [],
            },
        ],
    }


def build_generator_url(
    generator_base: str,
    source_url: str,
    lat_min: float = 33.0,
    lat_max: float = 37.0,
    lon_min: float = -103.0,
    lon_max: float = -94.0,
    variable: str | None = None,
) -> str:
    """Notebook generator /nb URL with query parameters."""
    base = generator_base.rstrip("/")
    if not base.endswith("/nb"):
        base = f"{base}/nb"
    params = [
        f"source_url={quote(source_url, safe='')}",
        f"lat_min={lat_min}",
        f"lat_max={lat_max}",
        f"lon_min={lon_min}",
        f"lon_max={lon_max}",
    ]
    if variable:
        params.append(f"variable={quote(variable, safe='')}")
    return f"{base}?{'&'.join(params)}"


def build_jupyterlite_launch_url(
    jupyterlite_base: str,
    generator_base: str,
    source_url: str,
    lat_min: float = 33.0,
    lat_max: float = 37.0,
    lon_min: float = -103.0,
    lon_max: float = -94.0,
    variable: str | None = None,
) -> str:
    """Full JupyterLite lab URL with fromURL= pointing at the generator."""
    nb_url = build_generator_url(
        generator_base,
        source_url,
        lat_min=lat_min,
        lat_max=lat_max,
        lon_min=lon_min,
        lon_max=lon_max,
        variable=variable,
    )
    lite = jupyterlite_base.rstrip("/")
    if "/lab" not in lite:
        lite = f"{lite}/lab/index.html"
    return f"{lite}?fromURL={quote(nb_url, safe='')}"
