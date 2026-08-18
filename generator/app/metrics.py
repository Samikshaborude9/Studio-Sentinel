"""Prometheus-format metrics exposition for the /metrics endpoint."""
from prometheus_client import Gauge, CollectorRegistry, generate_latest

registry = CollectorRegistry()

error_rate_g = Gauge("studio_error_rate_pct", "Error rate percent", ["service"], registry=registry)
latency_g = Gauge("studio_latency_p95_ms", "P95 latency ms", ["service"], registry=registry)
gpu_g = Gauge("studio_gpu_util_pct", "GPU utilization percent", ["service"], registry=registry)
queue_g = Gauge("studio_queue_depth", "Queue depth", ["service"], registry=registry)


def record_sample(sample: dict):
    svc = sample["service"]
    error_rate_g.labels(service=svc).set(sample["error_rate_pct"])
    latency_g.labels(service=svc).set(sample["latency_p95_ms"])
    gpu_g.labels(service=svc).set(sample["gpu_util_pct"])
    queue_g.labels(service=svc).set(sample["queue_depth"])


def render_metrics() -> bytes:
    return generate_latest(registry)
