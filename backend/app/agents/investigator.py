"""Investigator Agent (The Technical Producer):
Queries Grafana Cloud (Mimir/Loki) and telemetry sources via MCP / Grafana REST APIs.
Synthesizes error rates, latency spikes, GPU saturation, and Loki error logs into
structured IncidentFindings using Gemini 2.5 Flash.
"""
import json
import os
from ..schemas.findings import IncidentFindings
from ..tools.direct_grafana import fetch_service_status
from ..tools.grafana_api import query_loki_logs, query_grafana_metrics

DIRECT_MODE = os.getenv("DIRECT_MODE", "true").lower() == "true"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


def investigate(service: str) -> IncidentFindings:
    # 1. Fetch raw telemetry from generator
    status = fetch_service_status(service)
    
    # 2. Enrich with live Loki logs if available
    live_loki_logs = query_loki_logs(service, limit=5)
    logs = live_loki_logs if live_loki_logs else status.get("recent_logs", [])
    
    # 3. If in DIRECT_MODE or missing Gemini key, generate deterministic rule-based findings
    if DIRECT_MODE or not GOOGLE_API_KEY:
        return _build_findings_rule_based(service, status, logs)

    # 4. In live mode with Gemini available, use Gemini 2.5 Flash for anomaly summarization
    try:
        return _investigate_with_gemini(service, status, logs)
    except Exception as exc:
        print(f"[Investigator] Gemini investigation failed ({exc}), falling back to direct analysis")
        return _build_findings_rule_based(service, status, logs)


def _build_findings_rule_based(service: str, status: dict, logs: list[str]) -> IncidentFindings:
    anomaly_bits = []
    if status.get("error_rate_pct", 0) > 5:
        anomaly_bits.append(f"error rate {status['error_rate_pct']}% (baseline <1%)")
    if status.get("gpu_util_pct", 0) > 85:
        anomaly_bits.append(f"GPU util {status['gpu_util_pct']}% (near saturation)")
    if status.get("latency_p95_ms", 0) > 2000:
        anomaly_bits.append(f"p95 latency {status['latency_p95_ms']}ms (SLA threshold: 1000ms)")
    
    summary = (
        f"{service.upper()}: " + "; ".join(anomaly_bits)
        if anomaly_bits
        else f"{service.upper()}: nominal telemetry, no SLA breach detected"
    )
    return IncidentFindings(
        service=service,
        error_rate_pct=status.get("error_rate_pct", 0.0),
        latency_p95_ms=status.get("latency_p95_ms", 0.0),
        gpu_util_pct=status.get("gpu_util_pct", 0.0),
        sample_log_lines=logs,
        anomaly_summary=summary,
    )


def _investigate_with_gemini(service: str, status: dict, logs: list[str]) -> IncidentFindings:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GOOGLE_API_KEY)
    prompt = f"""You are the Technical Producer / Investigator Agent for an autonomous Hollywood studio control room (Studio Sentinel).
Analyze the telemetry metrics and log streams collected from Grafana for the '{service}' service:

Telemetry Data:
- Error Rate: {status.get('error_rate_pct', 0.0)}%
- P95 Latency: {status.get('latency_p95_ms', 0.0)}ms
- GPU Utilization: {status.get('gpu_util_pct', 0.0)}%
- Queue Depth: {status.get('queue_depth', 0)}
- Recent Logs: {json.dumps(logs)}

Synthesize this into a concise, professional, cinematic incident finding. State clearly what thresholds were breached.
Return valid JSON adhering to this schema:
{{
  "service": "{service}",
  "error_rate_pct": {status.get('error_rate_pct', 0.0)},
  "latency_p95_ms": {status.get('latency_p95_ms', 0.0)},
  "gpu_util_pct": {status.get('gpu_util_pct', 0.0)},
  "sample_log_lines": {json.dumps(logs[:5])},
  "anomaly_summary": "<concise summary of anomaly and telemetry breach>"
}}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )
    data = json.loads(response.text)
    return IncidentFindings(**data)

