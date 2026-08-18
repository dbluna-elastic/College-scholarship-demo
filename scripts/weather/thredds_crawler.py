#!/usr/bin/env python3
"""
Crawl Unidata THREDDS catalogs and index metadata into ou-met-catalog.

Walks public THREDDS XML catalogs, extracts file metadata (no payload ingest),
and optionally enriches a subset of NetCDF files via xarray header reads.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog_jupyterlite import attach_launch_url
from catalog_access import access_fields_from_dataset
from config import CATALOG_INDEX, get_client

THREDDS_BASE = "https://thredds.ucar.edu/thredds"

# Catalog roots mapped to data tiers and dataset families.
# Optional per-root: max_per_root, max_depth, max_refs
CATALOG_ROOTS: list[dict[str, Any]] = [
    # --- live operational models ---
    {
        "url": f"{THREDDS_BASE}/catalog/grib/NCEP/HRRR/CONUS_2p5km/catalog.html",
        "data_tier": "live",
        "dataset_name": "HRRR",
        "owner_group": "unidata",
        "max_per_root": 30,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/grib/NCEP/GFS/Global_0p25deg/catalog.html",
        "data_tier": "live",
        "dataset_name": "GFS",
        "owner_group": "unidata",
        "max_per_root": 30,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/grib/NCEP/GFS/Global_0p5deg/catalog.html",
        "data_tier": "live",
        "dataset_name": "GFS",
        "owner_group": "unidata",
        "max_per_root": 25,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/grib/NCEP/NAM/CONUS_12km/catalog.html",
        "data_tier": "live",
        "dataset_name": "NAM",
        "owner_group": "unidata",
        "max_per_root": 25,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/grib/NCEP/RAP/CONUS_13km/catalog.html",
        "data_tier": "live",
        "dataset_name": "RAP",
        "owner_group": "unidata",
        "max_per_root": 25,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/grib/NCEP/RAP/CONUS_20km/catalog.html",
        "data_tier": "live",
        "dataset_name": "RAP",
        "owner_group": "unidata",
        "max_per_root": 25,
    },
    # --- reanalysis / analysis ---
    {
        "url": f"{THREDDS_BASE}/catalog/grib/NCEP/GFS/Global_0p25deg_ana/catalog.html",
        "data_tier": "reanalysis",
        "dataset_name": "GFS_ANA",
        "owner_group": "unidata",
        "max_per_root": 30,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/irma/model/gfs_ana/catalog.html",
        "data_tier": "reanalysis",
        "dataset_name": "GFS_ANA",
        "owner_group": "unidata",
        "max_per_root": 20,
        "max_depth": 3,
    },
    # --- research / case studies ---
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/catalog.html",
        "data_tier": "research",
        "dataset_name": "CASE_STUDY",
        "owner_group": "unidata",
        "max_per_root": 10,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/ccs034/netcdf/catalog.html",
        "data_tier": "research",
        "dataset_name": "CCS034",
        "owner_group": "unidata",
        "max_per_root": 50,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/ccs034/acars/catalog.html",
        "data_tier": "research",
        "dataset_name": "ACARS",
        "owner_group": "unidata",
        "max_per_root": 20,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/idvtest/grids/catalog.html",
        "data_tier": "research",
        "dataset_name": "CASE_STUDY",
        "owner_group": "unidata",
        "max_per_root": 20,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/vgee_demo/catalog.html",
        "data_tier": "research",
        "dataset_name": "CASE_STUDY",
        "owner_group": "unidata",
        "max_per_root": 10,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/july18_2002/grids/catalog.html",
        "data_tier": "research",
        "dataset_name": "CASE_STUDY",
        "owner_group": "unidata",
        "max_per_root": 10,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/moisture_transport/nam/catalog.html",
        "data_tier": "research",
        "dataset_name": "NAM",
        "owner_group": "unidata",
        "max_per_root": 10,
    },
    # --- historical NEXRAD (Hurricane Irma case study) ---
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/irma/nexrad/KAMX/catalog.html",
        "data_tier": "research",
        "dataset_name": "NEXRAD",
        "owner_group": "unidata",
        "max_per_root": 25,
        "max_depth": 3,
        "max_refs": 3,
    },
    {
        "url": f"{THREDDS_BASE}/catalog/casestudies/irma/nexrad/KTBW/catalog.html",
        "data_tier": "research",
        "dataset_name": "NEXRAD",
        "owner_group": "unidata",
        "max_per_root": 25,
        "max_depth": 3,
        "max_refs": 3,
    },
]

BATCH = 50


def catalog_xml_url(catalog_html_url: str) -> str:
    return catalog_html_url.replace("catalog.html", "catalog.xml")


def file_format_from_path(url_path: str) -> str:
    lower = url_path.lower()
    if lower.endswith(".nc") or lower.endswith(".nc4") or lower.endswith(".cdf"):
        return "netcdf"
    if lower.endswith(".grib") or lower.endswith(".grib2") or ".grb" in lower:
        return "grib2"
    if lower.endswith(".ar2v") or "nexrad" in lower:
        return "nexrad_l2"
    return "unknown"


def dataset_name_from_path(url_path: str, default: str) -> str:
    upper = url_path.upper()
    for token in ("HRRR", "GFS", "NEXRAD", "MRMS", "ERA5", "RAP", "NAM", "ACARS", "CCS034"):
        if token in upper:
            return token
    return default


def temporal_from_filename(name: str, url_path: str) -> tuple[str | None, str | None]:
    """Extract temporal bounds from common meteorology filename patterns."""
    text = f"{name} {url_path}"

    m = re.search(r"(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})", text)
    if m:
        y, mo, d, h, mi = m.groups()
        start = f"{y}-{mo}-{d}T{h}:{mi}:00Z"
        return start, start

    m = re.search(r"(\d{4})(\d{2})(\d{2})_(\d{6})", text)
    if m:
        y, mo, d, hms = m.groups()
        start = f"{y}-{mo}-{d}T{hms[0:2]}:{hms[2:4]}:{hms[4:6]}Z"
        return start, start

    m = re.search(r"(\d{10})_", text)
    if m:
        ts = m.group(1)
        start = f"{ts[0:4]}-{ts[4:6]}-{ts[6:8]}T{ts[8:10]}:00:00Z"
        return start, start

    m = re.search(r"(\d{4})\.(\d{4})\.(\d{4})", text)
    if m:
        y, md, hm = m.groups()
        start = f"{y}-{md[0:2]}-{md[2:4]}T{hm[0:2]}:{hm[2:4]}:00Z"
        return start, start

    return None, None


def parse_iso_date(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            if fmt.endswith("%z") and value.endswith("Z"):
                dt = datetime.strptime(value.replace("Z", "+0000"), "%Y-%m-%dT%H:%M:%S%z")
            elif fmt.endswith("%z"):
                dt = datetime.strptime(value, fmt)
            else:
                dt = datetime.strptime(value.replace("Z", ""), fmt.replace("%z", ""))
                if value.endswith("Z"):
                    dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            continue
    return None


def bbox_from_catalog(ds: Any) -> dict | None:
    try:
        if hasattr(ds, "geospatial_coverage") and ds.geospatial_coverage:
            gc = ds.geospatial_coverage
            north = getattr(gc, "northlimit", None) or getattr(gc, "north", None)
            south = getattr(gc, "southlimit", None) or getattr(gc, "south", None)
            east = getattr(gc, "eastlimit", None) or getattr(gc, "east", None)
            west = getattr(gc, "westlimit", None) or getattr(gc, "west", None)
            if all(v is not None for v in (north, south, east, west)):
                return {
                    "type": "envelope",
                    "coordinates": [[float(west), float(north)], [float(east), float(south)]],
                }
    except Exception:
        pass
    return None


def temporal_from_catalog(ds: Any) -> tuple[str | None, str | None]:
    try:
        if hasattr(ds, "time_coverage") and ds.time_coverage:
            tc = ds.time_coverage
            start = parse_iso_date(str(getattr(tc, "start", None) or getattr(tc, "begin", None)))
            end = parse_iso_date(str(getattr(tc, "end", None) or getattr(tc, "end_time", None)))
            return start, end
    except Exception:
        pass
    return None, None


def build_service_urls(catalog_url: str, url_path: str) -> tuple[str | None, str | None]:
    from catalog_access import build_service_urls as _build

    opendap, httpserver, _cdmremote = _build(catalog_url, url_path)
    return opendap, httpserver


def stable_file_id(url_path: str, catalog_path: str) -> str:
    raw = f"{catalog_path}|{url_path}"
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def enrich_with_xarray(opendap_url: str) -> dict[str, Any]:
    import xarray as xr

    with xr.open_dataset(opendap_url, decode_times=True) as ds:
        variables = sorted(str(v) for v in ds.data_vars)
        levels: list[int] = []
        for dim in ("level", "isobaric", "height", "pressure", "z"):
            if dim in ds.dims:
                try:
                    levels = [int(x) for x in ds[dim].values[:20]]
                except Exception:
                    pass
                break
        temporal_start = temporal_end = None
        for tname in ("time", "Time", "valid_time"):
            if tname in ds.coords:
                times = ds[tname].values
                if len(times):
                    temporal_start = parse_iso_date(str(times[0]))
                    temporal_end = parse_iso_date(str(times[-1]))
                break
        return {
            "variables": variables[:50],
            "vertical_levels": levels,
            "temporal_start": temporal_start,
            "temporal_end": temporal_end,
        }


def walk_catalog(
    catalog_url: str,
    data_tier: str,
    dataset_name: str,
    owner_group: str,
    max_depth: int = 2,
    max_per_root: int = 15,
    max_refs: int = 8,
    xarray_budget: int = 0,
) -> list[dict[str, Any]]:
    from siphon.catalog import TDSCatalog

    docs: list[dict[str, Any]] = []
    xarray_used = 0
    xml_url = catalog_xml_url(catalog_url)
    catalog_path = catalog_url.replace(THREDDS_BASE, "").replace("/catalog.html", "")

    def _dataset_to_doc(name: str, ds: Any, path_prefix: str) -> dict[str, Any] | None:
        nonlocal xarray_used
        url_path = getattr(ds, "url_path", None)
        if not url_path:
            return None
        fmt = file_format_from_path(url_path)
        if fmt == "unknown":
            return None

        opendap, httpserver = build_service_urls(catalog_url, url_path)
        access_fields = access_fields_from_dataset(ds, catalog_url, url_path)
        temporal_start, temporal_end = temporal_from_catalog(ds)
        if not temporal_start:
            fn_start, fn_end = temporal_from_filename(name, url_path)
            temporal_start = temporal_start or fn_start
            temporal_end = temporal_end or fn_end
        geo_bbox = bbox_from_catalog(ds)
        variables: list[str] = []
        vertical_levels: list[int] = []

        if fmt == "netcdf" and xarray_budget > 0 and xarray_used < xarray_budget and opendap:
            try:
                extra = enrich_with_xarray(opendap)
                variables = extra.get("variables", [])
                vertical_levels = extra.get("vertical_levels", [])
                temporal_start = temporal_start or extra.get("temporal_start")
                temporal_end = temporal_end or extra.get("temporal_end")
                xarray_used += 1
                print(f"      xarray enriched: {name[:50]}")
            except Exception as exc:
                print(f"      xarray skip: {exc}")

        if not variables:
            name_lower = name.lower()
            if (
                "reflect" in name_lower
                or "dbz" in name_lower
                or "nexrad" in name_lower
                or "level2" in name_lower
                or url_path.lower().endswith(".ar2v")
            ):
                variables = ["reflectivity"]
            elif "temp" in name_lower:
                variables = ["temperature"]
            elif "wind" in name_lower:
                variables = ["u_wind", "v_wind"]
            elif "grib" in url_path.lower() or fmt == "grib2":
                variables = ["grib_variable"]

        size = getattr(ds, "size", None) or getattr(ds, "data_size", None)
        try:
            file_size = int(size) if size else None
        except (TypeError, ValueError):
            file_size = None

        doc = {
            "file_id": stable_file_id(url_path, catalog_path),
            "data_tier": data_tier,
            "file_format": fmt,
            "dataset_name": dataset_name_from_path(url_path, dataset_name),
            "title": name,
            "temporal_start": temporal_start,
            "temporal_end": temporal_end,
            "geo_bbox": geo_bbox,
            "variables": variables,
            "vertical_levels": vertical_levels or None,
            **access_fields,
            "file_size_bytes": file_size,
            "ingested_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "owner_group": owner_group,
            "access_tier": "public",
            "catalog_path": f"{path_prefix}/{name}",
        }
        return {k: v for k, v in doc.items() if v is not None}

    def _walk(cat: TDSCatalog, depth: int, path_prefix: str, refs_followed: int) -> int:
        if depth > max_depth or len(docs) >= max_per_root:
            return refs_followed

        for name, ds in getattr(cat, "datasets", {}).items():
            if len(docs) >= max_per_root:
                break
            doc = _dataset_to_doc(name, ds, path_prefix)
            if doc:
                if not doc.get("geo_bbox") and data_tier in ("live", "reanalysis", "research"):
                    doc["geo_bbox"] = {
                        "type": "envelope",
                        "coordinates": [[-103.0, 37.0], [-94.4, 33.6]],
                    }
                attach_launch_url(doc)
                docs.append(doc)

        if depth >= max_depth or len(docs) >= max_per_root:
            return refs_followed

        for sub_name, sub_ref in list(getattr(cat, "catalog_refs", {}).items())[:max_refs]:
            if len(docs) >= max_per_root or refs_followed >= max_refs:
                break
            sub_url = getattr(sub_ref, "href", None)
            if not sub_url:
                continue
            if not sub_url.startswith("http"):
                sub_url = urljoin(catalog_url.rsplit("/", 1)[0] + "/", sub_url)
            sub_xml = sub_url.replace(".html", ".xml") if ".html" in sub_url else sub_url
            if not sub_xml.endswith(".xml"):
                sub_xml = sub_xml.replace("catalog", "catalog.xml") if "catalog" in sub_xml else sub_xml + ".xml"
            try:
                print(f"    ref: {sub_name[:60]}")
                sub_cat = TDSCatalog(sub_xml)
                refs_followed += 1
                refs_followed = _walk(sub_cat, depth + 1, f"{path_prefix}/{sub_name}", refs_followed)
            except Exception as exc:
                print(f"    skip ref {sub_name[:40]}: {exc}")
                continue
        return refs_followed

    try:
        print(f"    fetching {xml_url}")
        cat = TDSCatalog(xml_url)
        _walk(cat, 0, catalog_path, 0)
    except Exception as exc:
        print(f"  WARN failed {catalog_url}: {exc}")

    return docs


def bulk_index(client, docs: list[dict[str, Any]]) -> int:
    ops: list[dict] = []
    for doc in docs:
        ops.append({"index": {"_index": CATALOG_INDEX, "_id": doc["file_id"]}})
        ops.append(doc)
        if len(ops) >= BATCH * 2:
            resp = client.bulk(operations=ops)
            if resp.get("errors"):
                bad = [i for i in resp["items"] if "error" in i.get("index", {})]
                raise RuntimeError(f"Bulk errors: {bad[:2]}")
            ops = []
    if ops:
        resp = client.bulk(operations=ops)
        if resp.get("errors"):
            bad = [i for i in resp["items"] if "error" in i.get("index", {})]
            raise RuntimeError(f"Bulk errors: {bad[:2]}")
    return len(docs)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-per-root", type=int, default=25, help="Default max docs per catalog root")
    parser.add_argument("--max-depth", type=int, default=2, help="Default catalog recursion depth")
    parser.add_argument("--max-refs", type=int, default=12, help="Default max sub-catalog refs per root")
    parser.add_argument("--xarray-budget", type=int, default=10, help="NetCDF files to enrich via xarray (0=skip)")
    args = parser.parse_args()

    client = get_client()
    all_docs: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    print("Crawling THREDDS catalogs...")
    for root in CATALOG_ROOTS:
        root_max = root.get("max_per_root", args.max_per_root)
        root_depth = root.get("max_depth", args.max_depth)
        root_refs = root.get("max_refs", args.max_refs)
        print(f"  {root['data_tier']}: {root['url']} (max={root_max}, depth={root_depth})")
        docs = walk_catalog(
            root["url"],
            root["data_tier"],
            root["dataset_name"],
            root["owner_group"],
            max_depth=root_depth,
            max_per_root=root_max,
            max_refs=root_refs,
            xarray_budget=args.xarray_budget,
        )
        for doc in docs:
            if doc["file_id"] not in seen_ids:
                seen_ids.add(doc["file_id"])
                all_docs.append(doc)
        print(f"    -> {len(docs)} datasets")

    if not all_docs:
        raise RuntimeError("No documents crawled — check network/THREDDS availability")

    n = bulk_index(client, all_docs)
    client.indices.refresh(index=CATALOG_INDEX)
    print(f"\nIndexed {n} documents into {CATALOG_INDEX}")

    tiers = {}
    for d in all_docs:
        tiers[d["data_tier"]] = tiers.get(d["data_tier"], 0) + 1
    print("  by tier:", tiers)


if __name__ == "__main__":
    main()
