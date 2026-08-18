from pydantic import BaseModel


class IncidentFindings(BaseModel):
    service: str
    error_rate_pct: float
    latency_p95_ms: float
    gpu_util_pct: float
    sample_log_lines: list[str]
    anomaly_summary: str
