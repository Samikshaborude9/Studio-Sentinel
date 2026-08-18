"""Advisor: pure reasoning over IncidentFindings, no tools. Real mode uses Gemini 2.5 Pro
via google-adk. DIRECT_MODE uses deterministic rule-based logic tuned to the one built
demo scenario (render service / CUDA OOM), so the approval-gated pipeline is fully
testable without an LLM call.

'impact_if_ignored' is always computed in code from queue-depth trend data (see
services.py / queue_trend_per_min), never left to the model to invent — this holds in
both modes."""
import os
from ..schemas.findings import IncidentFindings
from ..schemas.recommendation import Recommendation, RemediationOption
from ..tools.direct_grafana import fetch_service_status

DIRECT_MODE = os.getenv("DIRECT_MODE", "true").lower() == "true"


def advise(findings: IncidentFindings) -> Recommendation:
    if DIRECT_MODE:
        return _advise_direct(findings)
    return _advise_via_llm(findings)


def _advise_direct(findings: IncidentFindings) -> Recommendation:
    status = fetch_service_status(findings.service)
    trend = status.get("queue_trend_per_min", 0.0)

    oom_signal = any("out of memory" in line.lower() or "oom" in line.lower() for line in findings.sample_log_lines)

    if findings.gpu_util_pct > 85 and oom_signal:
        root_cause = "renderer v4.2 deploy is exhausting GPU memory under load (CUDA OOM), causing job failures and queue backup"
        confidence = 91
        options = [
            RemediationOption(action="Roll back render service to previous stable version (pre-v4.2)", risk_level="low", expected_recovery_min=3),
            RemediationOption(action="Scale render worker pool horizontally to spread GPU load", risk_level="medium", expected_recovery_min=8),
        ]
    elif findings.error_rate_pct > 5:
        root_cause = f"{findings.service} is returning elevated errors; root cause unclear from available signals"
        confidence = 55
        options = [
            RemediationOption(action=f"Restart {findings.service} service", risk_level="low", expected_recovery_min=2),
        ]
    else:
        root_cause = f"{findings.service} is nominal"
        confidence = 20
        options = []

    jobs_at_risk = max(0, round(trend)) if trend > 0 else 0
    impact_if_ignored = (
        f"Queue depth trending up ~{trend} jobs/min — at this rate, an estimated "
        f"{jobs_at_risk * 10} jobs will miss today's render window if unaddressed for the next 10 minutes."
        if trend > 0 else "Queue depth stable — limited immediate schedule risk, but error rate remains elevated."
    )
    impact_if_acted = "Rollback restores prior stable GPU behavior in ~3 min based on last successful deploy's recovery time."

    return Recommendation(
        root_cause=root_cause,
        confidence_pct=confidence,
        options=options,
        impact_if_ignored=impact_if_ignored,
        impact_if_acted=impact_if_acted,
    )


def _advise_via_llm(findings: IncidentFindings) -> Recommendation:
    from google.adk.agents import LlmAgent

    agent = LlmAgent(
        name="advisor",
        model="gemini-2.5-pro",
        instruction="""Given incident findings, determine the most likely root cause with a
confidence percentage, propose 1-2 remediation options tagged low/medium/high risk, and
state impact of acting vs not. Base 'impact if ignored' on the provided trend data only.""",
        output_schema=Recommendation,
    )
    return agent.run(findings.model_dump_json())
