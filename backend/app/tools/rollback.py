import os
import requests

GENERATOR_URL = os.getenv("GENERATOR_URL", "http://localhost:9000")


def rollback_service(service: str) -> dict:
    """Rolls back the given service by clearing the injected failure condition.
    Real MCP/ADK tool signature — used by the Executor agent."""
    resp = requests.post(f"{GENERATOR_URL}/clear-failure", params={"service": service}, timeout=10)
    return {"status": "rolled back", "service": service, "http_status": resp.status_code}
