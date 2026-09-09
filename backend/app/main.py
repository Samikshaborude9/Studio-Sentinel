import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .orchestrator.state_machine import init_db
from .routes.incidents import router as incidents_router

GENERATOR_URL = os.getenv("GENERATOR_URL", "https://studio-sentinel.onrender.com")
DEFAULT_GENERATOR_URL = "https://studio-sentinel.onrender.com"

app = FastAPI(title="Studio Sentinel — Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(incidents_router)


@app.on_event("startup")
def _startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/productions")
def productions():
    """Health board data for the frontend dashboard — proxies the generator's
    /status so the frontend only ever talks to the backend."""
    urls = [GENERATOR_URL.rstrip("/")]
    if urls[0] != DEFAULT_GENERATOR_URL:
        urls.append(DEFAULT_GENERATOR_URL)

    last_error = "unknown upstream error"
    for url in urls:
        try:
            resp = requests.get(f"{url}/status", timeout=10)
            resp.raise_for_status()
            return resp.json()
        except (requests.RequestException, ValueError) as exc:
            last_error = str(exc)

    raise HTTPException(status_code=502, detail=f"Telemetry generator unavailable: {last_error}")


@app.get("/shots")
def shots():
    """Live Hollywood studio shot pipeline — proxies the generator's /shots."""
    try:
        resp = requests.get(f"{GENERATOR_URL}/shots", timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        return {"shots": [], "error": str(exc)}


@app.post("/productions/{service}/inject-failure")
def trigger_failure(service: str):
    resp = requests.post(f"{GENERATOR_URL}/inject-failure", params={"service": service}, timeout=10)
    return resp.json()


@app.get("/scenarios")
def get_scenarios():
    resp = requests.get(f"{GENERATOR_URL}/scenarios", timeout=10)
    return resp.json()


@app.post("/inject-scenario")
def inject_scenario_proxy(scenario_id: str):
    resp = requests.post(f"{GENERATOR_URL}/inject-scenario", params={"scenario_id": scenario_id}, timeout=10)
    return resp.json()

