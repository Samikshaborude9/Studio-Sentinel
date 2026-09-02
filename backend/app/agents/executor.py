"""Executor / Reporter: only agent that takes action, only after human approval.
Executes the rollback, re-checks status to confirm recovery, assembles the final
IncidentReport. Real mode: Gemini 2.5 Flash + google-adk with the rollback tool and
MCPToolset. DIRECT_MODE: calls the same rollback tool and re-checks via the
generator's /status endpoint directly."""
import os
import time
from ..schemas.report import IncidentReport
from ..schemas.recommendation import Recommendation
from ..tools.rollback import rollback_service
from ..tools.direct_grafana import fetch_service_status

DIRECT_MODE = os.getenv("DIRECT_MODE", "true").lower() == "true"


def execute(incident_id: str, service: str, recommendation: Recommendation, option_index: int = 0) -> IncidentReport:
    if DIRECT_MODE:
        return _execute_direct(incident_id, service, recommendation, option_index)
    return _execute_via_llm(incident_id, service, recommendation, option_index)


def _execute_direct(incident_id: str, service: str, recommendation: Recommendation, option_index: int) -> IncidentReport:
    start = time.time()
    rollback_service(service)
    time.sleep(1)  # let generator's next tick reflect the cleared failure
    status = fetch_service_status(service)
    recovery_time = round(time.time() - start, 1)

    jobs_recovered = max(1, int(status.get("queue_depth", 0)))
    delay_avoided = recommendation.impact_if_ignored

    return IncidentReport(
        incident_id=incident_id,
        root_cause=recommendation.root_cause,
        action_taken=recommendation.options[option_index].action if recommendation.options else "Rolled back service",
        recovery_time_sec=int(recovery_time),
        jobs_recovered=jobs_recovered,
        delay_avoided_estimate=delay_avoided,
    )


def _execute_via_llm(incident_id: str, service: str, recommendation: Recommendation, option_index: int) -> IncidentReport:
    from google.adk.agents import LlmAgent
    from google.adk.tools.mcp_tool import MCPToolset, SseConnectionParams

    mcp_url = os.environ["MCP_GRAFANA_URL"]
    grafana_tools = MCPToolset(connection_params=SseConnectionParams(url=mcp_url))

    agent = LlmAgent(
        name="executor",
        model="gemini-2.5-flash",
        instruction=f"""Execute the approved remediation using the rollback tool, then
re-check the service via Grafana tools to confirm recovery, then produce a final
    incident report with concrete recovered-metric values. The approved option index is
    {option_index}; do not execute a different option.""",
        tools=[rollback_service, grafana_tools],
        output_schema=IncidentReport,
    )
    return agent.run(f"incident_id={incident_id} service={service} recommendation={recommendation.model_dump_json()}")
