"""In-memory ring buffer standing in for a Loki push. Swap push_log() for a real
requests.post to LOKI_URL + '/loki/api/v1/push' once Grafana Cloud is wired up."""
import time
import collections

RING = collections.deque(maxlen=200)


def push_log(service: str, line: str):
    RING.append({"ts": time.time(), "service": service, "line": line})


def recent_logs(service: str, limit: int = 5):
    return [e["line"] for e in list(RING)[::-1] if e["service"] == service][:limit]
