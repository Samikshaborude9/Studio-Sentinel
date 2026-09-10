import os
import time
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .orchestrator.state_machine import init_db
from .routes.incidents import router as incidents_router

GENERATOR_URL = os.getenv("GENERATOR_URL", "https://studio-sentinel.onrender.com")
DEFAULT_GENERATOR_URL = "https://studio-sentinel.onrender.com"
GENERATOR_REQUEST_ATTEMPTS = 2


def _generator_urls() -> list[str]:
    configured_url = GENERATOR_URL.rstrip("/")
    urls = [configured_url]
    if configured_url != DEFAULT_GENERATOR_URL:
        urls.append(DEFAULT_GENERATOR_URL)
    return urls


def _get_generator_json(path: str) -> dict:
    last_error = "unknown upstream error"
    for url in _generator_urls():
        for attempt in range(GENERATOR_REQUEST_ATTEMPTS):
            try:
                resp = requests.get(f"{url}{path}", timeout=15)
                resp.raise_for_status()
                return resp.json()
            except (requests.RequestException, ValueError) as exc:
                last_error = str(exc)
                if attempt + 1 < GENERATOR_REQUEST_ATTEMPTS:
                    time.sleep(1)
    raise HTTPException(status_code=502, detail=f"Telemetry generator unavailable: {last_error}")

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
    return _get_generator_json("/status")


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

