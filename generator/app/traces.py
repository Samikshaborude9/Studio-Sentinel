"""Minimal OTel span emission stub. In production this exports to Tempo's OTLP endpoint;
here it just records span-shaped dicts in memory so /status has something trace-like to show."""
import time
import uuid
import collections

SPANS = collections.deque(maxlen=100)


def emit_span(service: str, duration_ms: float, error: bool):
    SPANS.append({
        "trace_id": uuid.uuid4().hex[:16],
        "service": service,
        "duration_ms": duration_ms,
        "error": error,
        "ts": time.time(),
    })


def recent_spans(service: str, limit: int = 5):
    return [s for s in list(SPANS)[::-1] if s["service"] == service][:limit]
