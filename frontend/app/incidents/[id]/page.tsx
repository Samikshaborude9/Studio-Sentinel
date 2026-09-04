"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getIncident, approveIncident, rejectIncident, Incident } from "@/lib/api";
import StateBadge from "@/components/StateBadge";
import AgentFlightRecorder from "@/components/AgentFlightRecorder";
import ImpactCalculator from "@/components/ImpactCalculator";

const RISK_COLOR: Record<string, string> = {
  low: "text-ok border-ok/40 bg-ok/5",
  medium: "text-warn border-warn/40 bg-warn/5",
  high: "text-crit border-crit/40 bg-crit/5",
};

export default function IncidentDetail() {
  const params = useParams();
  const id = params.id as string;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [selectedOption, setSelectedOption] = useState(0);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const data = await getIncident(id);
        if (alive) setIncident(data);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  if (!incident) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="font-mono text-xs text-inkDim flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-signal animate-ping" />
          ESTABLISHING DIRECT CONNECTION TO INCIDENT FLIGHT BUS…
        </div>
      </div>
    );
  }

  async function handleApprove() {
    setActing(true);
    setActionError(null);
    try {
      const updated = await approveIncident(id, selectedOption);
      setIncident(updated);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "approval failed");
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    setActing(true);
    setActionError(null);
    try {
      const updated = await rejectIncident(id);
      setIncident(updated);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "rejection failed");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Link & Incident Header */}
      <div>
        <Link
          href="/"
          className="font-mono text-xs text-inkDim hover:text-signal tracking-widest inline-flex items-center gap-1 mb-4"
        >
          ← BACK TO PRODUCTION CONTROL ROOM
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-panelLine">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl font-bold text-ink uppercase tracking-wider">
                {incident.service} PIPELINE
              </span>
              <span className="font-mono text-xs text-inkDim">/ INCIDENT #{incident.id}</span>
            </div>
            <p className="text-xs text-inkDim mt-1">
              Escalated at {new Date(incident.created_at).toLocaleTimeString()} • Guarded by Gemini
              & Grafana Multi-Agent Network
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://jumborafter1646.grafana.net/"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] border border-panelLine bg-panel text-inkDim hover:text-signal px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
            >
              <span>📊</span> OPEN GRAFANA CLOUD ↗
            </a>
            <StateBadge state={incident.state} />
          </div>
        </div>
      </div>

      {incident.error && (
        <div className="border border-crit/40 bg-crit/10 rounded p-4 font-mono text-xs text-crit">
          <strong>Execution Notice:</strong> {incident.error}
        </div>
      )}

      {actionError && (
        <div className="border border-crit/40 bg-crit/10 rounded p-4 font-mono text-xs text-crit">
          <strong>Action Failed:</strong> {actionError}
        </div>
      )}

      {/* Multi-Agent Flight Recorder (Step-by-step reasoning feed) */}
      <AgentFlightRecorder incident={incident} />

      {/* Hollywood Financial & Schedule Exposure Card */}
      <ImpactCalculator recommendation={incident.recommendation} report={incident.report} />

      {/* Investigator Findings */}
      {incident.findings && (
        <Panel title="INVESTIGATOR AGENT (TECHNICAL PRODUCER) — GRAFANA FINDINGS" icon="🔍">
          <p className="text-sm text-ink mb-4 leading-relaxed font-medium">
            {incident.findings.anomaly_summary}
          </p>

          <div className="grid grid-cols-3 gap-4 font-mono text-sm mb-4">
            <Stat label="ERROR RATE" value={`${incident.findings.error_rate_pct.toFixed(1)}%`} />
            <Stat label="P95 LATENCY" value={`${Math.round(incident.findings.latency_p95_ms)}ms`} />
            <Stat label="GPU UTIL" value={`${incident.findings.gpu_util_pct.toFixed(0)}%`} />
          </div>

          <div className="mt-3 pt-3 border-t border-panelLine">
            <span className="font-mono text-[10px] text-inkDim block uppercase tracking-wider mb-2">
              Recent Loki Log Lines (Grafana Cloud LogQL):
            </span>
            <div className="font-mono text-[11px] text-inkDim/90 space-y-1 bg-board/60 p-3 rounded border border-panelLine/60">
              {incident.findings.sample_log_lines.map((line, i) => (
                <div key={i} className="truncate text-inkDim hover:text-ink">
                  <span className="text-signal/80 mr-2">▸</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* Advisor Recommendation */}
      {incident.recommendation && (
        <Panel title="ADVISOR AGENT (SYSTEMS DIRECTOR) — GEMINI 2.5 REASONING" icon="🧠">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-xs text-inkDim">AI CONFIDENCE:</span>
            <span className="font-mono text-sm text-signal font-bold">
              {incident.recommendation.confidence_pct}%
            </span>
          </div>
          <p className="text-sm text-ink mb-5 leading-relaxed bg-board/40 p-3 rounded border border-panelLine">
            {incident.recommendation.root_cause}
          </p>

          <div className="mb-2">
            <span className="font-mono text-[10px] text-inkDim block uppercase tracking-wider mb-2">
              Proposed Remediation Strategies:
            </span>
            <div className="space-y-2">
              {incident.recommendation.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedOption(i)}
                  aria-pressed={selectedOption === i}
                  className={`flex w-full items-center justify-between border rounded p-3 text-left transition-all ${
                    selectedOption === i
                      ? "border-signal bg-signal/10 shadow-sm"
                      : "border-panelLine bg-board/30 hover:border-panelLine/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-signal font-mono text-xs">#{i + 1}</span>
                    <span className="text-sm text-ink font-medium">{opt.action}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className={`border px-2 py-0.5 rounded ${RISK_COLOR[opt.risk_level]}`}>
                      {opt.risk_level.toUpperCase()} RISK
                    </span>
                    <span className="text-inkDim">~{opt.expected_recovery_min} min</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* Studio Head Human-in-the-Loop Governance Gate */}
      {incident.state === "AWAITING_APPROVAL" && (
        <div className="border-2 border-signal/60 bg-signal/5 rounded-lg p-6 shadow-xl shadow-signal/10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-bold">
                  Studio Head Approval Gate (Executive Authorization)
                </h3>
              </div>
              <p className="text-xs text-inkDim mt-1">
                Autonomous agent safety policy enforced. Infrastructure remediation requires human
                executive sign-off before proceeding.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleApprove}
              disabled={acting}
              className="font-mono text-xs font-semibold tracking-wider bg-signal text-board hover:bg-signal/90 px-6 py-3 rounded transition-all shadow-md shadow-signal/20 disabled:opacity-40 flex items-center gap-2"
            >
              {acting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-board border-t-transparent rounded-full animate-spin" />
                  DISPATCHING EXECUTOR…
                </>
              ) : (
                <>
                  <span>✓</span> AUTHORIZE & EXECUTE REMEDIATION
                </>
              )}
            </button>

            <button
              onClick={handleReject}
              disabled={acting}
              className="font-mono text-xs tracking-wider border border-panelLine bg-board text-inkDim hover:border-crit hover:text-crit px-5 py-3 rounded transition-colors disabled:opacity-40"
            >
              REJECT PROPOSAL
            </button>
          </div>
        </div>
      )}

      {/* Remediation in progress */}
      {incident.state === "REMEDIATING" && (
        <Panel title="EXECUTOR AGENT (TECHNICAL DIRECTOR) — REMEDIATING" icon="⚡">
          <div className="flex items-center gap-3 font-mono text-xs text-warn p-3 bg-board/50 rounded border border-warn/30">
            <span className="w-3 h-3 border-2 border-warn border-t-transparent rounded-full animate-spin" />
            Executing rollback tool, resetting GPU cache, and polling Grafana telemetry for nominal
            recovery baseline…
          </div>
        </Panel>
      )}

      {/* Incident Post-Mortem Report */}
      {incident.report && (
        <Panel title="INCIDENT RESOLUTION REPORT — POST-MORTEM" icon="📋">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-sm mb-4">
            <Stat label="RECOVERY TIME" value={`${incident.report.recovery_time_sec}s`} />
            <Stat label="JOBS RESCUED" value={`${incident.report.jobs_recovered}`} />
            <Stat label="REMEDIATION DISPATCHED" value={incident.report.action_taken} small />
          </div>
          <div className="border border-ok/40 bg-ok/10 rounded p-3 font-mono text-xs text-ok leading-relaxed">
            <strong>Production Outcome:</strong> {incident.report.delay_avoided_estimate}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-panelLine bg-panel rounded-lg p-5">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-inkDim mb-4 pb-2 border-b border-panelLine/60">
        {icon && <span>{icon}</span>}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="border border-panelLine/60 bg-board/40 p-3 rounded">
      <div className={small ? "text-xs text-ink truncate font-medium" : "text-base text-ink font-bold"}>
        {value}
      </div>
      <div className="text-[10px] text-inkDim tracking-wider mt-1">{label}</div>
    </div>
  );
}
