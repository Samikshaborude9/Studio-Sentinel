# Devpost Submission — Studio Sentinel
**Google Cloud Summer Blockbuster Hackathon: Agentic Cinema**
**Partner Track: Grafana Labs Track**

---

### 1. Project Title & Tagline
- **Project Title:** Studio Sentinel
- **Tagline:** The Autonomous AI Hollywood Production Control Room powered by Google Gemini & Grafana Cloud.

---

### 2. Track Selection
- **Chosen Track:** Grafana Labs Track
- **Partner Products Used:** Grafana Cloud, Grafana Loki (LogQL), Grafana Mimir (PromQL), Grafana Tempo (Distributed Tracing), `mcp-grafana` (Model Context Protocol server adapter).
- **Google Cloud Products Used:** Gemini 2.5 Flash, Gemini 2.5 Pro, Google Agent Development Kit (ADK), Google GenAI SDK, Google Cloud Run.

---

### 3. Elevator Pitch (The Problem & Magic Moment)
In major studio productions, time is quite literally money. When a 2,000-node VFX render farm crashes due to a bad shader build, or camera raw footage offloads fail before the 08:00 AM executive dailies screening, production grinds to a halt. Studios lose **$45,000 to $80,000 per hour** in idle crew, visual effects artists, and colorists, not to mention contract SLA penalties.

Existing monitoring tools display alerts, but they require groggy on-call engineers to wake up, manually piece together logs across Grafana and Loki, calculate the delivery window exposure, and manually execute rollbacks.

**Studio Sentinel** introduces the **Autonomous AI Production Control Room**:
A cooperative multi-agent network (The Director, Investigator, Advisor, Studio Head, and Executor) that autonomously watches the entire 4-stage Hollywood media pipeline (`Ingest` ➔ `Transcode` ➔ `Render Farm` ➔ `Worldwide Distribution`). When an incident occurs, it correlates live metrics and log streams from Grafana Cloud, deduces the root cause with Gemini 2.5, calculates financial and deadline risk, pauses at a human-in-the-loop executive gate for the Studio Head to approve, safely rolls back the broken release, and confirms telemetry recovery in Grafana within seconds.

---

### 4. What It Does
1. **End-to-End Pipeline Telemetry:** Continuously tracks Prometheus/Mimir metrics (Error Rate, P95 Latency, GPU VRAM, Queue Depth) and pushes structured log streams to **Grafana Loki**.
2. **Multi-Agent Cinematic Crew:**
   - 🎬 **The Director (Orchestrator):** Detects pipeline threshold anomalies and manages the deterministic state machine (`DETECTED` ➔ `INVESTIGATING` ➔ `AWAITING_APPROVAL` ➔ `REMEDIATING` ➔ `RESOLVED`).
   - 🔍 **The Investigator (Technical Producer):** Connects to Grafana Cloud via MCP (`mcp-grafana`) and REST APIs, querying PromQL metrics and Loki LogQL error streams without human intervention.
   - 🧠 **The Advisor (Systems Director):** Powered by **Gemini 2.5 Pro**, performs deep Hollywood root-cause analysis, predicts queue depth trends, and calculates concrete schedule risk (e.g. frames at risk, dollar exposure, missed dailies cutoff). Formulates 1–2 risk-rated remediation strategies.
   - 🛡️ **The Studio Head (Governance & Cloud IAM Gate):** Enforces strict enterprise agent safety. Critical production interventions cannot proceed without human executive sign-off.
   - ⚡ **The Executor (Technical Director):** Once authorized, executes the rollback or restart remediation, verifies recovery telemetry in Grafana, and generates an executive post-mortem incident report.
3. **Cinematic Control Room Interface:**
   - **Hollywood Pipeline Topology:** Interactive 4-stage visualizer showing live throughput, error rates, and health beacons.
   - **Real-Time Telemetry Graphs:** Interactive Recharts time-series stream of PromQL metrics.
   - **Incident Flight Recorder:** Real-time visual dialogue of the multi-agent network reasoning step-by-step.
   - **Hollywood Incident Simulator:** Built-in scenarios simulating high-stakes disasters (VFX Render Farm CUDA OOM, Dailies RAW Ingest Checksum Failure, Worldwide DCP CDN Timeout).

---

### 5. How We Built It
- **Agentic Orchestration:** Built with the new **Google Agent Development Kit (ADK)** and the official **Google GenAI SDK** (`google-genai`). Gemini 2.5 Flash handles low-latency anomaly summarization and verification, while Gemini 2.5 Pro performs complex root-cause diagnosis and risk modeling.
- **Grafana Labs Stack:** Integrated with **Grafana Cloud**. Real-time logs are pushed to **Grafana Loki** (`/loki/api/v1/push`), metrics are exposed in Prometheus format for **Grafana Mimir**, and tools interface via Model Context Protocol (`mcp-grafana`).
- **Backend Core:** FastAPI orchestrator with SQLModel database state persistence supporting both SQLite and **Supabase PostgreSQL** for distributed multi-agent state management.
- **Frontend Experience:** Next.js 14, TailwindCSS, and Recharts, styled as a sleek, high-visibility cinematic control room with radar pulses and dark glassmorphism.

---

### 6. Challenges We Overcame
- **Agent Hallucination vs. Real Telemetry:** We enforced deterministic boundaries. Concrete business numbers (queue backlog rate, turnaround time, recovered jobs) are calculated directly from telemetry slopes and verified Grafana logs, preventing the LLM from inventing metrics.
- **Autonomous Action Safety:** Fully autonomous AI modifying production infrastructure is an unacceptable risk for enterprise studios. We engineered a strict **Human-in-the-Loop Studio Head Approval Gate** modeled directly in state machine code, creating an unbypassable safety checkpoint.
- **Dual-Mode Architecture:** We designed Studio Sentinel to run both connected to live Grafana Cloud & Gemini 2.5, as well as in an offline/direct deterministic mode so judges can evaluate the entire pipeline locally without complex credential setup.

---

### 7. Accomplishments We're Proud Of
- A truly cinematic, cohesive product experience that feels like stepping onto a Hollywood studio backlot.
- Authentic, runtime integration with Grafana Cloud Loki and Google Gemini Enterprise.
- A sub-60-second end-to-end incident turnaround from failure injection to verified recovery.

---

### 8. What's Next
- Direct integration with Hollywood production tracking platforms like Autodesk ShotGrid and ftrack.
- Multi-region failover orchestration across Google Cloud TPU/GPU clusters.
- Automated Slack/Discord executive dispatch bot for mobile Studio Head sign-offs.
