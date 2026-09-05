const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export type ServiceStatus = {
  service: string;
  error_rate_pct: number;
  latency_p95_ms: number;
  gpu_util_pct: number;
  queue_depth: number;
  recent_logs: string[];
  queue_trend_per_min: number;
  failing: boolean;
};

export type IncidentFindings = {
  error_rate_pct: number;
  latency_p95_ms: number;
  gpu_util_pct: number;
  sample_log_lines: string[];
  anomaly_summary: string;
};

export type RemediationOption = {
  action_id: "rollback_service" | "restart_service";
  action: string;
  risk_level: "low" | "medium" | "high";
  expected_recovery_min: number;
};

export type Recommendation = {
  root_cause: string;
  confidence_pct: number;
  options: RemediationOption[];
  impact_if_ignored: string;
  impact_if_acted: string;
};

export type IncidentReport = {
  action_taken: string;
  recovery_time_sec: number;
  jobs_recovered: number;
  delay_avoided_estimate: string;
};

export type Incident = {
  id: string;
  service: string;
  state: "DETECTED" | "INVESTIGATING" | "AWAITING_APPROVAL" | "REMEDIATING" | "RESOLVED" | "REJECTED";
  created_at: string;
  updated_at: string;
  findings: IncidentFindings | null;
  recommendation: Recommendation | null;
  report: IncidentReport | null;
  error: string | null;
};


export async function getProductions(): Promise<Record<string, ServiceStatus>> {
  const res = await fetch(`${BASE}/productions`, { cache: "no-store" });
  if (!res.ok) throw new Error("failed to load productions");
  return res.json();
}

export async function injectFailure(service: string) {
  const res = await fetch(`${BASE}/productions/${service}/inject-failure`, { method: "POST" });
  return res.json();
}

export async function createIncident(service: string): Promise<Incident> {
  const res = await fetch(`${BASE}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service }),
  });
  if (!res.ok) throw new Error("failed to create incident");
  return res.json();
}

export async function getIncident(id: string): Promise<Incident> {
  const res = await fetch(`${BASE}/incidents/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("failed to load incident");
  return res.json();
}

export async function listIncidents(): Promise<Incident[]> {
  const res = await fetch(`${BASE}/incidents`, { cache: "no-store" });
  if (!res.ok) throw new Error("failed to load incidents");
  return res.json();
}

export async function approveIncident(id: string, optionIndex = 0): Promise<Incident> {
  const res = await fetch(`${BASE}/incidents/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ option_index: optionIndex }),
  });
  if (!res.ok) throw new Error("failed to approve incident");
  return res.json();
}

export async function rejectIncident(id: string): Promise<Incident> {
  const res = await fetch(`${BASE}/incidents/${id}/reject`, { method: "POST" });
  if (!res.ok) throw new Error("failed to reject incident");
  return res.json();
}

export type Scenario = {

  id: string;
  service: string;
  title: string;
  narrative: string;
};

export async function getScenarios(): Promise<{ scenarios: Scenario[] }> {
  const res = await fetch(`${BASE}/scenarios`, { cache: "no-store" });
  if (!res.ok) throw new Error("failed to load scenarios");
  return res.json();
}

export async function injectScenario(scenarioId: string) {
  const res = await fetch(`${BASE}/inject-scenario?scenario_id=${encodeURIComponent(scenarioId)}`, { method: "POST" });
  if (!res.ok) throw new Error("failed to inject scenario");
  return res.json();
}

export type Shot = {
  id: string;
  project: string;
  aspect_ratio: string;
  director: string;
  service: "render" | "transcode" | "ingest" | "distribution" | string;
  stage_label: string;
  sequence: string;
  resolution: string;
  compute_node: string;
  fps: number;
  total_frames: number;
  completed_frames: number;
  progress_pct: number;
  status: "COMPLETED" | "IN_PROGRESS" | "QUEUED" | "FAILED";
  error_message?: string | null;
  timestamp: string;
  vram_allocated_gb?: number | null;
  preview_url?: string;
  video_url?: string;
};

export async function getShots(): Promise<Shot[]> {
  try {
    const res = await fetch(`${BASE}/shots`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.shots || [];
  } catch {
    return [];
  }
}

