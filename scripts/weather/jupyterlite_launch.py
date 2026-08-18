#!/usr/bin/env python3
"""Print or test JupyterLite launch URLs for catalog OPeNDAP files."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "notebook_generator"))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from build_notebook import build_jupyterlite_launch_url  # noqa: E402

DEFAULT_SOURCE = (
    "https://thredds.ucar.edu/thredds/dodsC/grib/NCEP/GFS/Global_0p25deg/Best"
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build JupyterLite launch URL")
    parser.add_argument("--source-url", default=DEFAULT_SOURCE)
    parser.add_argument("--lat-min", type=float, default=33.0)
    parser.add_argument("--lat-max", type=float, default=37.0)
    parser.add_argument("--lon-min", type=float, default=-103.0)
    parser.add_argument("--lon-max", type=float, default=-94.0)
    parser.add_argument("--variable", default="Temperature_surface")
    args = parser.parse_args()

    jupyterlite = os.getenv(
        "JUPYTERLITE_URL",
        "https://jupyterlite.github.io/demo/lab/index.html",
    )
    generator = os.getenv("NOTEBOOK_GENERATOR_PUBLIC_URL", "http://localhost:8765")

    url = build_jupyterlite_launch_url(
        jupyterlite,
        generator,
        args.source_url,
        lat_min=args.lat_min,
        lat_max=args.lat_max,
        lon_min=args.lon_min,
        lon_max=args.lon_max,
        variable=args.variable,
    )
    print(url)
    print("\nStart generator:  uvicorn services.notebook_generator.app:app --port 8765")
    print("Set NOTEBOOK_GENERATOR_PUBLIC_URL to a public URL JupyterLite can reach.")


if __name__ == "__main__":
    main()
