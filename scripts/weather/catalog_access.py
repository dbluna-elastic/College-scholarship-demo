"""THREDDS access service metadata helpers for ou-met-catalog."""

from __future__ import annotations

from typing import Any
from urllib.parse import urljoin, urlparse

THREDDS_BASE = "https://thredds.ucar.edu/thredds"

SERVICE_META: dict[str, tuple[str, str]] = {
    "OPENDAP": ("data_access", "Access dataset through OPeNDAP using the DAP2 protocol."),
    "HTTPServer": ("data_access", "HTTP file download."),
    "CdmRemote": ("data_access", "Provides index subsetting on remote CDM datasets, using ncstream."),
    "WMS": ("data_access", "Web Map Service for map imagery."),
    "WCS": ("data_access", "Web Coverage Service for gridded data subsets."),
    "NCSS": ("data_access", "NetCDF Subset Service for spatial/temporal subsets."),
}


def thredds_base_from_catalog_url(catalog_url: str) -> str:
    parsed = urlparse(catalog_url)
    return f"{parsed.scheme}://{parsed.netloc}"


def build_service_urls(catalog_url: str, url_path: str) -> tuple[str | None, str | None, str | None]:
    base = thredds_base_from_catalog_url(catalog_url)
    opendap = urljoin(base + "/", f"thredds/dodsC/{url_path}")
    httpserver = urljoin(base + "/", f"thredds/fileServer/{url_path}")
    cdmremote = urljoin(base + "/", f"thredds/cdmremote/{url_path}?req=cdl")
    return opendap, httpserver, cdmremote


def build_catalog_page_url(url_path: str) -> str:
    if "/" in url_path:
        parent = url_path.rsplit("/", 1)[0]
        return f"{THREDDS_BASE}/catalog/{parent}/catalog.html?dataset={url_path}"
    return f"{THREDDS_BASE}/catalog/catalog.html?dataset={url_path}"


def normalize_service_name(name: str) -> str:
    key = (name or "").strip()
    aliases = {
        "opendap": "OPENDAP",
        "httpserver": "HTTPServer",
        "http": "HTTPServer",
        "cdmremote": "CdmRemote",
        "wms": "WMS",
        "wcs": "WCS",
        "ncss": "NCSS",
    }
    lower = key.lower()
    if lower in aliases:
        return aliases[lower]
    if key.upper() == key and key:
        return key
    return key[:1].upper() + key[1:] if key else key


def url_path_from_opendap(opendap_url: str | None) -> str | None:
    if not opendap_url:
        return None
    for marker in ("/thredds/dodsC/", "/dodsC/"):
        if marker in opendap_url:
            return opendap_url.split(marker, 1)[1].split("?", 1)[0]
    return None


def url_path_from_httpserver(httpserver_url: str | None) -> str | None:
    if not httpserver_url:
        return None
    for marker in ("/thredds/fileServer/", "/fileServer/"):
        if marker in httpserver_url:
            return httpserver_url.split(marker, 1)[1].split("?", 1)[0]
    return None


def infer_url_path(doc: dict[str, Any]) -> str | None:
    path = doc.get("url_path")
    if path:
        return str(path)
    path = url_path_from_opendap(doc.get("opendap_url"))
    if path:
        return path
    return url_path_from_httpserver(doc.get("httpserver_url"))


def feature_type_from_dataset(ds: Any) -> str | None:
    for attr in ("feature_type", "featureType"):
        value = getattr(ds, attr, None)
        if value:
            return str(value)
    try:
        props = getattr(ds, "properties", None) or {}
        for key in ("featureType", "feature_type"):
            if props.get(key):
                return str(props[key])
    except Exception:
        pass
    return None


def modified_at_from_dataset(ds: Any) -> str | None:
    try:
        dates = getattr(ds, "dates", None) or {}
        if isinstance(dates, dict):
            for key in ("modified", "Modificaton", "modification"):
                if dates.get(key):
                    return str(dates[key])
        for attr in ("date_modified", "modified"):
            value = getattr(ds, attr, None)
            if value:
                return str(value)
    except Exception:
        pass
    return None


def extract_access_services(ds: Any, catalog_url: str, url_path: str) -> list[dict[str, str]]:
    opendap, httpserver, cdmremote = build_service_urls(catalog_url, url_path)
    merged: dict[str, str] = {
        "OPENDAP": opendap,
        "HTTPServer": httpserver,
        "CdmRemote": cdmremote,
    }

    access_urls = getattr(ds, "access_urls", None) or {}
    if isinstance(access_urls, dict):
        for raw_name, url in access_urls.items():
            if not url:
                continue
            merged[normalize_service_name(str(raw_name))] = str(url)

    services: list[dict[str, str]] = []
    for service_name, url in merged.items():
        if not url:
            continue
        service_type, description = SERVICE_META.get(
            service_name,
            ("data_access", f"Access dataset via {service_name}."),
        )
        services.append({
            "service": service_name,
            "service_type": service_type,
            "description": description,
            "url": url,
        })

    preferred = ("OPENDAP", "HTTPServer", "CdmRemote", "WMS", "WCS", "NCSS")
    order = {name: idx for idx, name in enumerate(preferred)}
    services.sort(key=lambda row: order.get(row["service"], 99))
    return services


def access_fields_from_dataset(ds: Any, catalog_url: str, url_path: str) -> dict[str, Any]:
    services = extract_access_services(ds, catalog_url, url_path)
    opendap = next((s["url"] for s in services if s["service"] == "OPENDAP"), None)
    httpserver = next((s["url"] for s in services if s["service"] == "HTTPServer"), None)
    cdmremote = next((s["url"] for s in services if s["service"] == "CdmRemote"), None)
    feature_type = feature_type_from_dataset(ds)
    modified_at = modified_at_from_dataset(ds)

    fields: dict[str, Any] = {
        "url_path": url_path,
        "access_services": services,
        "catalog_page_url": build_catalog_page_url(url_path),
        "httpserver_url": httpserver,
        "cdmremote_url": cdmremote,
        "source_url": opendap or httpserver,
        "opendap_url": opendap,
    }
    if feature_type:
        fields["feature_type"] = feature_type
    if modified_at:
        fields["modified_at"] = modified_at
    return fields


def access_fields_from_doc(doc: dict[str, Any], catalog_url: str | None = None) -> dict[str, Any]:
    """Rebuild access metadata for an existing catalog document (backfill)."""
    url_path = infer_url_path(doc)
    if not url_path:
        return {}

    base_catalog = catalog_url or f"{THREDDS_BASE}/catalog.html"
    opendap, httpserver, cdmremote = build_service_urls(base_catalog, url_path)
    services: list[dict[str, str]] = []
    for service_name, url in (
        ("OPENDAP", doc.get("opendap_url") or opendap),
        ("HTTPServer", doc.get("httpserver_url") or httpserver),
        ("CdmRemote", doc.get("cdmremote_url") or cdmremote),
    ):
        if not url:
            continue
        service_type, description = SERVICE_META[service_name]
        services.append({
            "service": service_name,
            "service_type": service_type,
            "description": description,
            "url": str(url),
        })

    fields: dict[str, Any] = {
        "url_path": url_path,
        "access_services": services,
        "catalog_page_url": doc.get("catalog_page_url") or build_catalog_page_url(url_path),
        "httpserver_url": doc.get("httpserver_url") or httpserver,
        "cdmremote_url": doc.get("cdmremote_url") or cdmremote,
    }
    if doc.get("feature_type"):
        fields["feature_type"] = doc["feature_type"]
    if doc.get("modified_at"):
        fields["modified_at"] = doc["modified_at"]
    return fields
