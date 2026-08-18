"""Baseline + failure-state metric ranges for the four simulated studio services."""
import random
from dataclasses import dataclass, field

SERVICES = ["ingest", "transcode", "render", "distribution"]

BASELINE = {
    "ingest":       {"error_rate_pct": (0.0, 0.5), "latency_p95_ms": (80, 150),  "gpu_util_pct": (0, 0),   "queue_depth": (0, 5)},
    "transcode":    {"error_rate_pct": (0.0, 0.8), "latency_p95_ms": (200, 400), "gpu_util_pct": (0, 0),   "queue_depth": (0, 8)},
    "render":       {"error_rate_pct": (0.0, 0.5), "latency_p95_ms": (500, 900), "gpu_util_pct": (30, 55), "queue_depth": (0, 6)},
    "distribution": {"error_rate_pct": (0.0, 0.3), "latency_p95_ms": (50, 120),  "gpu_util_pct": (0, 0),   "queue_depth": (0, 3)},
}

# The one built end-to-end demo failure: a bad `renderer v4.2` deploy.
FAILURE_PROFILE = {
    "render": {
        "error_rate_pct": (15.0, 35.0),
        "latency_p95_ms": (4000, 9000),
        "gpu_util_pct": (92, 99),
        "queue_depth": (40, 120),
        "log_lines": [
            "ERROR renderer[v4.2]: CUDA out of memory. Tried to allocate 2.14 GiB",
            "ERROR renderer[v4.2]: shot batch failed after 3 retries, worker OOM-killed",
            "WARN  renderer[v4.2]: GPU memory fragmentation detected, falling back to CPU (slow path)",
            "ERROR renderer[v4.2]: CUDA out of memory. Tried to allocate 1.87 GiB",
        ],
    }
}

NORMAL_LOG_LINES = {
    "ingest": ["INFO ingest: batch uploaded ok", "INFO ingest: checksum verified"],
    "transcode": ["INFO transcode: job completed", "INFO transcode: queued 4 jobs"],
    "render": ["INFO renderer[v4.2]: shot rendered ok, 340 frames", "INFO renderer[v4.2]: queue drained"],
    "distribution": ["INFO distribution: delivered to region us-east", "INFO distribution: cache warm"],
}


@dataclass
class ServiceState:
    name: str
    failing: bool = False
    # rolling history of queue depth, used to compute "impact if ignored" deterministically
    queue_history: list = field(default_factory=list)

    def sample(self):
        profile = FAILURE_PROFILE.get(self.name, {}) if self.failing else {}
        base = BASELINE[self.name]

        def pick(key):
            lo, hi = profile.get(key, base[key])
            return round(random.uniform(lo, hi), 2)

        error_rate = pick("error_rate_pct")
        latency = pick("latency_p95_ms")
        gpu = pick("gpu_util_pct")
        queue = pick("queue_depth")

        self.queue_history.append(queue)
        self.queue_history = self.queue_history[-30:]

        log_pool = profile.get("log_lines", NORMAL_LOG_LINES[self.name]) if self.failing else NORMAL_LOG_LINES[self.name]
        log_line = random.choice(log_pool)

        return {
            "service": self.name,
            "error_rate_pct": error_rate,
            "latency_p95_ms": latency,
            "gpu_util_pct": gpu,
            "queue_depth": queue,
            "log_line": log_line,
        }

    def queue_trend_per_min(self):
        """Rough slope of queue depth over recent history, jobs/min. Used for delay-avoided math."""
        if len(self.queue_history) < 2:
            return 0.0
        return round((self.queue_history[-1] - self.queue_history[0]) / max(1, len(self.queue_history)) * 12, 2)


STATE = {name: ServiceState(name) for name in SERVICES}
