"""Investigator: the only agent that touches Grafana. In real mode it's a google-adk
LlmAgent (Gemini 2.5 Flash) wired to mcp-grafana via MCPToolset, querying PromQL/LogQL/
Tempo. In DIRECT_MODE it reads the generator's /status endpoint directly instead — same
output shape, no Grafana/Gemini dependency, so the rest of the pipeline is testable
before those are wired up.

NOTE: the real-mode ADK wiring below follows the patterns in the project's technical
docs. google-adk's exact API (LlmAgent / MCPToolset / SseConnectionParams signatures)
is unverified against a live install — check it against the current ADK quickstart
before relying on it.
"""
import os
from ..schemas.findings import IncidentFindings
from ..tools.direct_grafana import fetch_service_status

DIRECT_MODE = os.getenv("DIRECT_MODE", "true").lower() == "true"


def investigate(service: str) -> IncidentFindings:
    if DIRECT_MODE:
        return _investigate_direct(service)
    return _investigate_via_mcp(service)


def _investigate_direct(service: str) -> IncidentFindings:
    status = fetch_service_status(service)
    anomaly_bits = []
    if status["error_rate_pct"] > 5:
        anomaly_bits.append(f"error rate {status['error_rate_pct']}% (baseline <1%)")
    if status["gpu_util_pct"] > 85:
        anomaly_bits.append(f"GPU util {status['gpu_util_pct']}%")
    if status["latency_p95_ms"] > 2000:
        anomaly_bits.append(f"p95 latency {status['latency_p95_ms']}ms")
    summary = (
        f"{service}: " + "; ".join(anomaly_bits) if anomaly_bits else f"{service}: nominal, no anomaly detected"
    )
    return IncidentFindings(
        service=service,
        error_rate_pct=status["error_rate_pct"],
        latency_p95_ms=status["latency_p95_ms"],
        gpu_util_pct=status["gpu_util_pct"],
        sample_log_lines=status["recent_logs"],
        anomaly_summary=summary,
    )


def _investigate_via_mcp(service: str) -> IncidentFindings:
    from google.adk.agents import LlmAgent
    from google.adk.tools.mcp_tool import MCPToolset, SseConnectionParams

    mcp_url = os.environ["MCP_GRAFANA_URL"]
    grafana_tools = MCPToolset(connection_params=SseConnectionParams(url=mcp_url))

    agent = LlmAgent(
        name="investigator",
        model="gemini-2.5-flash",
        instruction="""You investigate production health using the available Grafana tools.
Given a target service name, query its current metrics, recent error-level logs, and
any related traces. Only report what the tools return — do not guess at numbers.""",
        tools=[grafana_tools],
        output_schema=IncidentFindings,
    )
    return agent.run(f"Investigate service: {service}")
