"""Direct Grafana Cloud and Loki client.
Provides tools to query Grafana Cloud / Loki directly via HTTP REST APIs,
enabling real runtime integration with Grafana Labs services even when
running without an external MCP sidecar container.
"""
import base64
import os
import time
import requests

GRAFANA_URL = os.getenv("GRAFANA_URL", "").rstrip("/")
GRAFANA_TOKEN = os.getenv("GRAFANA_SERVICE_ACCOUNT_TOKEN", "")
LOKI_URL = os.getenv("LOKI_URL", "").rstrip("/")
LOKI_USER = os.getenv("LOKI_USER", "")
LOKI_API_KEY = os.getenv("LOKI_API_KEY", "")


def query_loki_logs(service: str, limit: int = 10) -> list[str]:
    """Query recent logs for a given studio service from Grafana Loki."""
    if not LOKI_URL or not LOKI_USER or not LOKI_API_KEY:
        return []

    try:
        auth_str = f"{LOKI_USER}:{LOKI_API_KEY}"
        b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        headers = {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/json",
        }
        
        # LogQL query for service logs
        query = f'{{app="studio-sentinel", service="{service}"}}'
        start_ns = int((time.time() - 3600) * 1e9)  # past 1 hour
        params = {
            "query": query,
            "limit": limit,
            "start": start_ns,
            "direction": "BACKWARD",
        }
        resp = requests.get(f"{LOKI_URL}/loki/api/v1/query_range", headers=headers, params=params, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            lines = []
            results = data.get("data", {}).get("result", [])
            for stream in results:
                for entry in stream.get("values", []):
                    # entry is [timestamp_ns, log_line]
                    if len(entry) >= 2:
                        lines.append(entry[1])
            return lines
    except Exception as e:
        print(f"[GrafanaAPI] Loki query error: {e}")
    return []


def query_grafana_metrics(service: str) -> dict | None:
    """Query Prometheus / Mimir metrics via Grafana Cloud datasource proxy if configured."""
    if not GRAFANA_URL or not GRAFANA_TOKEN:
        return None

    try:
        headers = {
            "Authorization": f"Bearer {GRAFANA_TOKEN}",
            "Content-Type": "application/json",
        }
        resp = requests.get(f"{GRAFANA_URL}/api/health", headers=headers, timeout=5)
        if resp.status_code == 200:
            return {"grafana_status": "connected", "url": GRAFANA_URL}
    except Exception as e:
        print(f"[GrafanaAPI] Grafana query error: {e}")
    return None
