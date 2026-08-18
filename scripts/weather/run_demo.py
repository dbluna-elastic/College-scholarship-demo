#!/usr/bin/env python3
"""One-shot OU Met Catalog demo setup for College scholarship demo."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent


def run(script: str, *args: str) -> None:
    cmd = [sys.executable, str(SCRIPTS / script), *args]
    print(f"\n>>> {' '.join(cmd)}")
    subprocess.check_call(cmd)


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision OU Met catalog demo on Gawdzilla")
    parser.add_argument(
        "--skip-crawl",
        action="store_true",
        help="Skip THREDDS crawl (use when ou-met-catalog is already populated)",
    )
    parser.add_argument(
        "--ensure-indices",
        action="store_true",
        help="Create/update indices without dropping existing catalog data",
    )
    args = parser.parse_args()

    if args.ensure_indices or args.skip_crawl:
        run("setup_indices.py", "--ensure-only")
        run("setup_provisioning_index.py")
    else:
        run("setup_indices.py")
        run("thredds_crawler.py", "--max-per-root", "25", "--xarray-budget", "10")

    run("setup_agent_builder.py")
    run("setup_provisioning_agent.py")
    run("seed_provisioning_requests.py", "--replace")
    run("backfill_jupyterlite_urls.py")
    run("setup_kibana.py")
    print("\nOU Met demo ready.")
    print("  Template:  ?template=oumet")
    print("  Catalog:   ou-met-catalog-agent")
    print("  Ops:       ou-met-provisioning-agent")
    print("  Generator: uvicorn services.notebook_generator.app:app --port 8765")


if __name__ == "__main__":
    main()
