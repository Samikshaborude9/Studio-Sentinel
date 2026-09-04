"""Log buffer and live Grafana Loki push adapter.
Stores logs in-memory for immediate status queries, and asynchronously pushes
log streams to Grafana Cloud Loki via the /loki/api/v1/push REST endpoint.
"""
import base64
import collections
import os
import threading
import time
import requests

LOKI_URL = os.getenv("LOKI_URL", "").rstrip("/")
LOKI_USER = os.getenv("LOKI_USER", "")
LOKI_API_KEY = os.getenv("LOKI_API_KEY", "")

RING = collections.deque(maxlen=300)


def _async_push_loki(service: str, line: str, ts_ns: str):
    if not LOKI_URL or not LOKI_USER or not LOKI_API_KEY:
        return
    try:
        auth_str = f"{LOKI_USER}:{LOKI_API_KEY}"
        b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        headers = {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/json",
        }
        payload = {
            "streams": [
                {
                    "stream": {
                        "app": "studio-sentinel",
                        "service": service,
                        "environment": "production",
                    },
                    "values": [
                        [ts_ns, line],
                    ],
                }
            ]
        }
        requests.post(f"{LOKI_URL}/loki/api/v1/push", headers=headers, json=payload, timeout=3)
    except Exception as exc:
        # Non-blocking: failure to reach Loki does not crash the generator
        pass


def push_log(service: str, line: str):
    now = time.time()
    RING.append({"ts": now, "service": service, "line": line})

    if LOKI_URL and LOKI_USER and LOKI_API_KEY:
        ts_ns = str(int(now * 1e9))
        threading.Thread(target=_async_push_loki, args=(service, line, ts_ns), daemon=True).start()


def recent_logs(service: str, limit: int = 5):
    return [e["line"] for e in list(RING)[::-1] if e["service"] == service][:limit]

