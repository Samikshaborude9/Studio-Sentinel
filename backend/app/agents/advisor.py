"""Advisor Agent (The Systems Director):
Pure reasoning over IncidentFindings. In live mode, leverages Gemini 2.5 Pro / Flash
to perform deep Hollywood root-cause analysis, calculating delivery risk,
schedule slippage, and providing 1-2 risk-scored remediation options.
In DIRECT_MODE or on fallback, uses deterministic logic calibrated to studio metrics.
"""
import json
import os
from ..schemas.findings import IncidentFindings
from ..schemas.recommendation import Recommendation, RemediationOption
from ..tools.direct_grafana import fetch_service_status

DIRECT_MODE = os.getenv("DIRECT_MODE", "true").lower() == "true"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


def advise(findings: IncidentFindings) -> Recommendation:
    if DIRECT_MODE or not GOOGLE_API_KEY:
        return _advise_direct(findings)
    try:
        return _advise_via_gemini(findings)
    except Exception as exc:
        print(f"[Advisor] Gemini advice failed ({exc}), falling back to direct analysis")
        return _advise_direct(findings)


def _advise_direct(findings: IncidentFindings) -> Recommendation:
    status = fetch_service_status(findings.service)
    trend = status.get("queue_trend_per_min", 0.0)

    oom_signal = any("out of memory" in line.lower() or "oom" in line.lower() for line in findings.sample_log_lines)
    corrupt_signal = any("checksum" in line.lower() or "corrupt" in line.lower() or "drop" in line.lower() for line in findings.sample_log_lines)
    timeout_signal = any("timeout" in line.lower() or "504" in line.lower() or "latency" in line.lower() for line in findings.sample_log_lines)

    if findings.gpu_util_pct > 85 and oom_signal:
        root_cause = "Render node v4.2 shader build is exhausting GPU VRAM (CUDA OOM), crashing worker batch processes and backing up composite queues."
        confidence = 94
        options = [
            RemediationOption(action_id="rollback_service", action="Roll back render worker pool to stable release v4.1.9", risk_level="low", expected_recovery_min=3),
            RemediationOption(action_id="restart_service", action="Restart stuck render workers and purge corrupt VRAM allocations", risk_level="medium", expected_recovery_min=6),
        ]
    elif corrupt_signal:
        root_cause = f"{findings.service.upper()} pipeline encountered stream checksum mismatch from camera raw ingest; worker threads retrying continuously."
        confidence = 88
        options = [
            RemediationOption(action_id="restart_service", action=f"Restart {findings.service} ingestion worker daemon and re-validate cache", risk_level="low", expected_recovery_min=2),
        ]
    elif timeout_signal or findings.latency_p95_ms > 3000:
        root_cause = f"{findings.service.upper()} distribution gateway egress bandwidth saturated; CDN edge caching experiencing high cache-miss cascade."
        confidence = 86
        options = [
            RemediationOption(action_id="rollback_service", action="Roll back CDN routing configuration to previous multi-region edge profile", risk_level="low", expected_recovery_min=3),
        ]
    elif findings.error_rate_pct > 5:
        root_cause = f"{findings.service.upper()} service is throwing elevated runtime errors ({findings.error_rate_pct}%); worker threads unstable."
        confidence = 72
        options = [
            RemediationOption(action_id="restart_service", action=f"Restart {findings.service} worker container pool", risk_level="low", expected_recovery_min=2),
        ]
    else:
        root_cause = f"{findings.service.upper()} telemetry is operating within nominal studio baseline."
        confidence = 95
        options = []

    jobs_at_risk = max(1, round(trend * 10)) if trend > 0 else 5
    impact_if_ignored = (
        f"Queue depth accumulating at ~{trend} jobs/min. An estimated {jobs_at_risk} downstream pipeline jobs "
        f"will breach the 08:00 AM executive dailies review window if unmitigated within 10 minutes (~$45,000/hr artist idle cost)."
        if trend > 0 else "Queue depth stable; limited immediate schedule risk, but continued degraded performance threatens final master delivery."
    )
    impact_if_acted = "Rollback restores baseline pipeline throughput within ~3 minutes, preserving morning dailies delivery window."

    return Recommendation(
        root_cause=root_cause,
        confidence_pct=confidence,
        options=options,
        impact_if_ignored=impact_if_ignored,
        impact_if_acted=impact_if_acted,
    )


def _advise_via_gemini(findings: IncidentFindings) -> Recommendation:
    from google import genai
    from google.genai import types

    status = fetch_service_status(findings.service)
    trend = status.get("queue_trend_per_min", 0.0)
    jobs_at_risk = max(1, round(trend * 10)) if trend > 0 else 5

    client = genai.Client(api_key=GOOGLE_API_KEY)
    prompt = f"""You are the Systems Director / Production Advisor Agent in Studio Sentinel, an autonomous AI control room guarding a Hollywood digital media pipeline.
Analyze the following Incident Findings:
{findings.model_dump_json(indent=2)}

Queue trend: ~{trend} jobs/min.

Formulate an executive-level root cause assessment and 1-2 concrete remediation options.
The remediation options must use `action_id`: either 'rollback_service' or 'restart_service'.
Quantify the business impact if ignored (e.g. missed morning dailies review, studio downtime cost) and the impact if acted upon.

Return strictly JSON matching this structure:
{{
  "root_cause": "<detailed Hollywood technical root cause>",
  "confidence_pct": <integer between 70 and 99>,
  "options": [
    {{
      "action_id": "rollback_service",
      "action": "<clear description of action>",
      "risk_level": "low",
      "expected_recovery_min": 3
    }}
  ],
  "impact_if_ignored": "Queue depth accumulating at ~{trend} jobs/min. An estimated {jobs_at_risk} jobs will miss today's dailies review window if unaddressed for 10 minutes.",
  "impact_if_acted": "Restores nominal pipeline throughput in ~3 minutes, protecting scheduled delivery."
}}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    data = json.loads(response.text)
    return Recommendation(**data)

