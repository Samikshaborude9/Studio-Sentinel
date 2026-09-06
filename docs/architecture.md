# Studio Sentinel Architecture

Studio Sentinel is an **Autonomous AI Production Control Room** designed for high-throughput Hollywood digital media workflows. It operates across a 4-stage pipeline:

```mermaid
graph LR
    subgraph Hollywood Pipeline
        INGEST["01 / INGEST<br/>(ARRI/RED RAW Dailies)"] --> TRANSCODE["02 / TRANSCODE<br/>(ProRes / ACES Proxies)"]
        TRANSCODE --> RENDER["03 / RENDER FARM<br/>(CUDA VFX / 3D Frames)"]
        RENDER --> DIST["04 / DISTRIBUTION<br/>(Master DCP / Global CDN)"]
    end
```

---

## The Autonomous Multi-Agent Hierarchy

```mermaid
sequenceDiagram
    autonumber
    participant Telemetry as Grafana Cloud (Mimir / Loki)
    participant Director as The Director (Orchestrator)
    participant Investigator as Investigator (Technical Producer)
    participant Advisor as Advisor (Gemini 2.5 Pro)
    participant StudioHead as Studio Head (Executive Gate)
    participant Executor as Executor (Technical Director)

    Telemetry->>Director: Anomaly Threshold Breach Detected (Error >5% or GPU >85%)
    Director->>Director: State: DETECTED -> INVESTIGATING
    Director->>Investigator: Query incident signals for affected service
    Investigator->>Telemetry: PromQL Metrics + Loki LogQL Error Stack
    Telemetry-->>Investigator: Raw Prometheus & Log streams
    Investigator-->>Director: IncidentFindings (Error Rate, Latency, Stack lines)
    Director->>Advisor: Analyze findings & evaluate Hollywood exposure
    Advisor->>Advisor: Gemini 2.5 Pro Diagnosis + SLA Impact Math
    Advisor-->>Director: Recommendation (Root Cause, 1-2 Risk-Scored Options)
    Director->>StudioHead: State: AWAITING_APPROVAL (Display Options & Financial Impact)
    Note over StudioHead: Human Executive Reviews Risk & Authorizes Rollback
    StudioHead->>Director: Approve Option #1 (Rollback to v4.1.9)
    Director->>Executor: State: REMEDIATING (Dispatch Approved Action)
    Executor->>RENDER: Execute Rollback Tool
    loop Telemetry Verification
        Executor->>Telemetry: Poll service status
        Telemetry-->>Executor: Error rate <1%, GPU <50% (Nominal)
    end
    Executor-->>Director: IncidentReport (Turnaround: 3s, 42 Jobs Rescued)
    Director->>Director: State: RESOLVED
```

---

## Core Components

| Component | Directory | Responsibilities | Technologies |
| :--- | :--- | :--- | :--- |
| **Telemetry Generator** | `packages/generator` | Simulates 4 studio services (`ingest`, `transcode`, `render`, `distribution`). Exposes Prometheus metrics, pushes live log streams to Grafana Loki (`/loki/api/v1/push`), and provides failure injection endpoints. | Python 3.11, FastAPI, Prometheus Client, Loki HTTP API |
| **Agent Orchestrator** | `packages/backend` | Deterministic incident state machine, Gemini 2.5 agent runners, Grafana Cloud / Loki API clients, SQLModel database persistence. | FastAPI, Google GenAI SDK, Google ADK, SQLModel, Supabase Postgres |
| **Control Room UI** | `packages/frontend` | Interactive cinematic interface, pipeline topology flow, Recharts real-time telemetry graphs, agent flight recorder, scenario injector. | Next.js 14, TailwindCSS, Recharts, TypeScript |
| **Grafana MCP Server** | Container `mcp-grafana` | Managed Model Context Protocol adapter for Grafana Cloud. | Grafana Labs MCP Image |
