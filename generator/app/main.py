"""Telemetry generator: simulates 4 studio services, exposes Prometheus metrics,
an in-memory log/trace feed, and failure injection endpoints. Runs a background
loop pushing fresh samples every ~5s."""
import asyncio
import contextlib
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from .services import STATE, SERVICES
from .metrics import record_sample, render_metrics
from .logs import push_log, recent_logs
from .traces import emit_span, recent_spans

app = FastAPI(title="Studio Sentinel — Telemetry Generator")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


async def _tick_loop():
    while True:
        for svc in STATE.values():
            sample = svc.sample()
            record_sample(sample)
            push_log(svc.name, sample["log_line"])
            emit_span(svc.name, sample["latency_p95_ms"], error=sample["error_rate_pct"] > 5)
        await asyncio.sleep(5)


@app.on_event("startup")
async def _startup():
    app.state.task = asyncio.create_task(_tick_loop())


@app.on_event("shutdown")
async def _shutdown():
    app.state.task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await app.state.task


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/metrics")
def metrics():
    return Response(content=render_metrics(), media_type="text/plain")


@app.get("/status")
def status():
    """Convenience endpoint for DIRECT_MODE — everything an agent would otherwise
    have to gather via separate PromQL/LogQL/Tempo MCP calls, in one shot."""
    out = {}
    for name, svc in STATE.items():
        latest = svc.sample()
        out[name] = {
            **latest,
            "recent_logs": recent_logs(name),
            "recent_spans": recent_spans(name),
            "queue_trend_per_min": svc.queue_trend_per_min(),
            "failing": svc.failing,
        }
    return out


@app.post("/inject-failure")
def inject_failure(service: str = "render"):
    if service not in STATE:
        return Response(status_code=404, content=f"unknown service {service}")
    STATE[service].failing = True
    return {"service": service, "failing": True}


@app.post("/clear-failure")
def clear_failure(service: str = "render"):
    if service not in STATE:
        return Response(status_code=404, content=f"unknown service {service}")
    STATE[service].failing = False
    return {"service": service, "failing": False}


@app.get("/services")
def list_services():
    return {"services": SERVICES}
