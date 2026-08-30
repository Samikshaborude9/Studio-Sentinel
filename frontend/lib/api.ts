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

export type Incident = {
  id: string;
  service: string;
  state: "DETECTED" | "INVESTIGATING" | "AWAITING_APPROVAL" | "REMEDIATING" | "RESOLVED" | "REJECTED";
  created_at: string;
  updated_at: string;
  findings: {
    error_rate_pct: number;
    latency_p95_ms: number;
    gpu_util_pct: number;
    sample_log_lines: string[];
    anomaly_summary: string;
  } | null;
  recommendation: {
    root_cause: string;
    confidence_pct: number;
    options: { action: string; risk_level: "low" | "medium" | "high"; expected_recovery_min: number }[];
    impact_if_ignored: string;
    impact_if_acted: string;
  } | null;
  report: {
    action_taken: string;
    recovery_time_sec: number;
    jobs_recovered: number;
    delay_avoided_estimate: string;
  } | null;
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

export async function approveIncident(id: string): Promise<Incident> {
  const res = await fetch(`${BASE}/incidents/${id}/approve`, { method: "POST" });
  return res.json();
}

export async function rejectIncident(id: string): Promise<Incident> {
  const res = await fetch(`${BASE}/incidents/${id}/reject`, { method: "POST" });
  return res.json();
}
