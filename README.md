# Studio Sentinel 🎬
### Autonomous AI Production Control Room for Hollywood Media Pipelines
**Google Cloud Agentic Cinema Hackathon — Grafana Labs Track ($15,000 Prize Pool)**

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Agentic%20Cinema-4285F4?logo=googlecloud&logoColor=white)](https://agentic-cinema.devpost.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Pro%20%2F%20Flash-8E75B2?logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Grafana Labs](https://img.shields.io/badge/Grafana%20Labs-Cloud%20%26%20Loki-F46800?logo=grafana&logoColor=white)](https://grafana.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

In major film and television productions, unexpected technical failures can stall an entire studio lot. When a 2,000-node VFX render farm runs out of GPU memory, or camera raw footage offloads fail before the morning dailies screening, production grinds to a halt—costing studios **$45,000 to $80,000 per hour** in idle crew and contractual delivery delay penalties.

**Studio Sentinel** is an **Autonomous AI Production Control Room** that guards the 4-stage Hollywood digital media pipeline:
1. 📹 **01 / Ingest**: High-throughput ARRI/RED 8K RAW camera footage offload & checksum validation.
2. 🎞️ **02 / Transcode**: Automated editorial proxy generation and ACES color grading pipeline.
3. ⚡ **03 / Render Farm**: GPU-accelerated VFX & 3D raytracing nodes (CUDA batch workers).
4. 🌐 **04 / Distribution**: Encrypted Master DCI Packages (DCP) and global theatrical CDN streaming.

Powered by **Google Gemini 2.5**, the **Google Agent Development Kit (ADK)**, and **Grafana Cloud (Mimir, Loki, Tempo, and `mcp-grafana`)**, Studio Sentinel continuously monitors telemetry, detects pipeline anomalies, formulates risk-scored remediation strategies, enforces an executive human-in-the-loop governance gate, and autonomously verifies pipeline recovery in seconds.

---

## System Architecture

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

## The Autonomous Multi-Agent Crew

- 🎬 **The Director (Orchestrator):** Manages the deterministic incident state machine (`DETECTED` ➔ `INVESTIGATING` ➔ `AWAITING_APPROVAL` ➔ `REMEDIATING` ➔ `RESOLVED`).
- 🔍 **The Investigator (Technical Producer):** Connects to Grafana Cloud via Model Context Protocol (`mcp-grafana`) and REST APIs, querying PromQL metrics and Loki LogQL error streams without human intervention.
- 🧠 **The Advisor (Systems Director):** Powered by **Gemini 2.5 Pro**, performs deep Hollywood root-cause analysis, predicts queue depth trends, and calculates concrete schedule risk (e.g. frames at risk, dollar exposure, missed dailies cutoff). Formulates 1–2 risk-rated remediation strategies.
- 🛡️ **The Studio Head (Governance & Cloud IAM Gate):** Enforces strict enterprise agent safety. Critical production interventions cannot proceed without human executive sign-off.
- ⚡ **The Executor (Technical Director):** Once authorized, executes the rollback or restart remediation, verifies recovery telemetry in Grafana, and generates an executive post-mortem incident report.

---

## Built-In Hollywood Incident Scenarios

Studio Sentinel includes 3 realistic studio disaster modes to evaluate multi-agent performance:
1. **VFX Render Farm CUDA OOM (`render`)**: Shader release v4.2 causes 98% GPU VRAM exhaustion on 8K composite batches, crashing workers and halting the visual effects pipeline.
2. **Dailies RAW Ingest Checksum Failure (`ingest`)**: High-speed camera card reader corruption triggers MD5 mismatch on ARRI RAW reels, threatening the morning director review.
3. **Master DCP Distribution CDN Timeout (`distribution`)**: Global premiere encrypted DCP delivery stream stalls from edge 504 timeouts, endangering simultaneous worldwide theatrical release.

---

## Quickstart Guide

### Prerequisites
- Docker & Docker Compose (or Python 3.11+ and Node.js 18+)

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Samikshaborude9/Studio-Sentinel.git
cd Studio-Sentinel
cp .env.example .env
```

### 2. Run with Docker Compose
```bash
docker compose up --build
```

- **Frontend Control Room:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs:** [http://localhost:8080/docs](http://localhost:8080/docs)
- **Telemetry Generator:** [http://localhost:9000/metrics](http://localhost:9000/metrics)

---

## Live Grafana Cloud & Gemini Configuration

To connect Studio Sentinel to live Grafana Cloud and Gemini Enterprise:

1. In `.env`, set `DIRECT_MODE=false`.
2. Add your `GOOGLE_API_KEY`.
3. Add your Grafana Cloud credentials:
   ```env
   GRAFANA_URL=https://yourstack.grafana.net
   GRAFANA_SERVICE_ACCOUNT_TOKEN=glsa_...
   LOKI_URL=https://logs-prod-xxx.grafana.net
   LOKI_USER=1770208
   LOKI_API_KEY=glc_...
   ```
4. Start the stack. The generator will push live log streams to Grafana Loki (`/loki/api/v1/push`), and Gemini 2.5 agents will query Grafana Cloud in real time.

---

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
