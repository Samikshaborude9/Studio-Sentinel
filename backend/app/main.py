import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .orchestrator.state_machine import init_db
from .routes.incidents import router as incidents_router

GENERATOR_URL = os.getenv("GENERATOR_URL", "http://localhost:9000")

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
    resp = requests.get(f"{GENERATOR_URL}/status", timeout=10)
    resp.raise_for_status()
    return resp.json()


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

