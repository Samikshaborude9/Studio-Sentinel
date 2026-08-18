"""DIRECT_MODE stand-in for the mcp-grafana MCP tool calls. Reads the generator's
/status endpoint directly instead of going through PromQL/LogQL/Tempo + MCP.
Swap this module out for real MCPToolset calls once mcp-grafana + Grafana Cloud
are wired up (see backend/app/agents/investigator.py)."""
import os
import requests

GENERATOR_URL = os.getenv("GENERATOR_URL", "http://localhost:9000")


def fetch_service_status(service: str) -> dict:
    resp = requests.get(f"{GENERATOR_URL}/status", timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if service not in data:
        raise ValueError(f"unknown service {service}")
    return data[service]
