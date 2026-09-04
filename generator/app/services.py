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

# Built Hollywood Studio Failure Scenarios
FAILURE_PROFILE = {
    "render": {
        "scenario_id": "render_oom",
        "scenario_title": "VFX Render Farm CUDA OOM",
        "narrative": "Shader deploy v4.2 causes GPU VRAM exhaustion on 8K composite batches, threatening daily review cut.",
        "error_rate_pct": (18.0, 38.0),
        "latency_p95_ms": (4500, 9200),
        "gpu_util_pct": (93, 99),
        "queue_depth": (45, 130),
        "log_lines": [
            "ERROR renderer[v4.2]: CUDA out of memory. Tried to allocate 2.14 GiB on device:0",
            "ERROR renderer[v4.2]: shot batch 'dune_seq04_fx' failed after 3 retries, worker OOM-killed",
            "WARN  renderer[v4.2]: GPU memory fragmentation detected, falling back to CPU (slow path)",
            "ERROR renderer[v4.2]: CUDA out of memory. Tried to allocate 1.87 GiB on device:1",
        ],
    },
    "ingest": {
        "scenario_id": "ingest_corrupt",
        "scenario_title": "Dailies Ingest Checksum Failure",
        "narrative": "High-speed camera card reader corrupts ARRI RAW ingest buffer, blocking editor proxy generation.",
        "error_rate_pct": (16.0, 30.0),
        "latency_p95_ms": (2400, 4800),
        "gpu_util_pct": (0, 8),
        "queue_depth": (35, 90),
        "log_lines": [
            "ERROR ingest[camera-daemon]: ARRI RAW MD5 checksum mismatch on reel A088_C004_0904_RAW",
            "ERROR ingest[camera-daemon]: Ingest buffer packet dropped at frame #84102, re-read failed",
            "WARN  ingest[camera-daemon]: Storage array I/O queue backed up, NVMe write latency >450ms",
            "ERROR ingest[camera-daemon]: Stream validation aborted: hash check failed 3 consecutive times",
        ],
    },
    "distribution": {
        "scenario_id": "dist_timeout",
        "scenario_title": "Master DCP Distribution CDN Timeout",
        "narrative": "Global theatrical release DCP package push throttled by CDN edge timeouts, risking worldwide delivery window.",
        "error_rate_pct": (22.0, 42.0),
        "latency_p95_ms": (6000, 11500),
        "gpu_util_pct": (0, 0),
        "queue_depth": (28, 80),
        "log_lines": [
            "ERROR distribution[cdn-edge]: 504 Gateway Timeout pushing encrypted DCP chunk #4019 to region ap-south",
            "ERROR distribution[cdn-edge]: CDN edge bandwidth saturated; origin fallback rejected with 429",
            "WARN  distribution[cdn-edge]: Cache miss cascade on master exhibition playlist stream",
            "ERROR distribution[cdn-edge]: Package QC hash verification socket timed out after 60000ms",
        ],
    },
}

NORMAL_LOG_LINES = {
    "ingest": ["INFO ingest: batch reel B012 uploaded ok", "INFO ingest: ARRI checksum verified 100%"],
    "transcode": ["INFO transcode: ProRes 422 proxy generated", "INFO transcode: ACES color pass complete"],
    "render": ["INFO renderer[v4.1.9]: shot 412 rendered nominal, 340 frames", "INFO renderer: GPU VRAM optimal 48%"],
    "distribution": ["INFO distribution: DCP master delivered to region us-east", "INFO distribution: CDN cache 99.4% warm"],
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
