# Studio Sentinel — 3-Minute Hackathon Demo Video Script
**Google Cloud Agentic Cinema Hackathon (Grafana Labs Track)**
*Target Video Duration: 2:50 - 3:00 (YouTube / Vimeo format, clear English audio)*

---

### Rubric Mapping Checklist
- [x] **Technological Implementation:** Show real runtime Gemini 2.5 + Grafana Cloud / Loki integration & MCP querying.
- [x] **Design:** Walk through the cohesive, cinematic Hollywood Control Room UI, interactive pipeline topology, and live telemetry graphs.
- [x] **Potential Impact:** Highlight concrete numbers: $45,000/hr downtime cost, 08:00 AM dailies deadline, frames rescued.
- [x] **Quality of the Idea:** Showcase the multi-agent crew (Director, Investigator, Advisor, Studio Head, Executor) and the human-in-the-loop safety gate.

---

### Second-by-Second Production Script

#### **[0:00 – 0:35] Part 1: The Hollywood Dilemma & The Hook**
- **Visual:** Open on the Studio Sentinel Dashboard (`http://localhost:3000`). Show the high-tech, dark-mode cinematic interface with the 4 pipeline stages (`01/INGEST`, `02/TRANSCODE`, `03/RENDER FARM`, `04/DISTRIBUTION`) pulsing in nominal green.
- **Voiceover:**
  > *"Welcome to Studio Sentinel, the autonomous AI production control room built for Google Cloud's Agentic Cinema hackathon, competing in the Grafana Labs track.*
  >
  > *In modern film and television production, time is everything. A single corrupted raw footage card, an edge CDN timeout, or a bad shader release crashing the VFX render farm doesn't just delay a movie—it costs studios between $45,000 and $80,000 an hour in idle artists, stage crews, and missed delivery windows.*
  >
  > *Studio Sentinel automates incident response across the entire digital media pipeline using a coordinated network of Gemini 2.5 agents integrated directly with Grafana Cloud."*

---

#### **[0:35 – 1:15] Part 2: Architecture & Live Incident Injection**
- **Visual:**
  - Hover over the **Pipeline Topology** card to highlight the 4 stages.
  - Point to the **Real-Time Telemetry Stream** showing live PromQL metrics.
  - Scroll to the **Hollywood Incident Simulator** and click on **'VFX Render Farm CUDA OOM'**.
  - Click **'INJECT SCENARIO & WATCH AGENTS'**.
- **Voiceover:**
  > *"Our pipeline is continuously monitored through Grafana Cloud—Mimir for Prometheus metrics, Loki for structured log streams, and Tempo for distributed tracing.*
  >
  > *Let's simulate a real Hollywood disaster: a bad v4.2 shader deployment just hit the VFX render farm during final 8K composite frames. Let's trigger the incident.*
  >
  > *Immediately, the telemetry shows GPU utilization spiking to 98% and error rates soaring past 30%. In seconds, our autonomous agent pipeline takes over."*

---

#### **[1:15 – 2:05] Part 3: The Multi-Agent Flight Recorder & Gemini 2.5 Analysis**
- **Visual:**
  - The UI navigates to the Incident Detail page (`/incidents/{id}`).
  - Point to the **Agent Flight Recorder** showing the step-by-step agent coordination.
  - Highlight the **Investigator Agent** (Technical Producer) extracting live error logs from Grafana Loki (`CUDA out of memory`, `worker OOM-killed`).
  - Highlight the **Advisor Agent** (Gemini 2.5 Pro) presenting the root cause, confidence score (94%), and the **Hollywood Financial & Schedule Exposure Card** ($45,000/hr downtime, 08:00 AM Dailies cutoff).
- **Voiceover:**
  > *"Here is the multi-agent flight recorder in real-time:*
  >
  > *First, **The Director** orchestrates the escalation lifecycle.*
  > *Next, **The Investigator**—acting as our Technical Producer—queries Grafana Cloud via MCP and Loki REST APIs, capturing exact CUDA out-of-memory stack traces without any human intervention.*
  >
  > *Then, **The Advisor**, powered by **Gemini 2.5**, diagnoses the failure: shader build v4.2 is exhausting VRAM under heavy batch load. Crucially, it deterministically calculates the business exposure: queue depth is accumulating at 8 jobs per minute, and if unaddressed, 80 composite shots will miss the 08:00 AM executive dailies screening.*
  >
  > *It provides two risk-scored remediation options: an immediate low-risk rollback to stable v4.1.9, or a worker restart."*

---

#### **[2:05 – 2:40] Part 4: The Studio Head Approval Gate & Automated Recovery**
- **Visual:**
  - Zoom in on the amber-glowing **Studio Head Approval Gate** card.
  - Click **'✓ AUTHORIZE & EXECUTE REMEDIATION'**.
  - Watch the state transition to `REMEDIATING` with active loader.
  - Show the state transition to `RESOLVED`, displaying the **Incident Resolution Report** (e.g. Recovery time: 3s, 42 jobs rescued, delivery window protected).
- **Voiceover:**
  > *"Because this is enterprise production infrastructure, we enforce safety: the **Studio Head Governance Gate** requires human executive authorization before altering production systems.*
  >
  > *As the Studio Head, I click 'Authorize Remediation'.*
  >
  > *Now, **The Executor Agent** takes over. It dispatches the automated rollback tool, purges stuck VRAM allocations, and continuously polls Grafana telemetry until the render farm returns to nominal baselines.*
  >
  > *And we are resolved! In just 3 seconds, the broken release was rolled back, 42 render jobs were rescued, and the 08:00 AM dailies screening is saved."*

---

#### **[2:40 – 3:00] Part 5: Conclusion & Red Carpet Summary**
- **Visual:**
  - Click **'← BACK TO PRODUCTION CONTROL ROOM'** to show the topology turning back to healthy green.
  - Show the **Incident History Log** recording the full audit trail.
  - Show Grafana Cloud dashboard in background tab.
- **Voiceover:**
  > *"Studio Sentinel transforms Hollywood enterprise chaos into a deterministic, cinematic production—uniting Google Cloud Gemini Enterprise, Google ADK, and Grafana Cloud.*
  >
  > *Thank you, and see you on the red carpet!"*
