"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getIncident, approveIncident, rejectIncident, Incident } from "@/lib/api";
import StateBadge from "@/components/StateBadge";

const RISK_COLOR: Record<string, string> = {
  low: "text-ok border-ok/40",
  medium: "text-warn border-warn/40",
  high: "text-crit border-crit/40",
};

export default function IncidentDetail() {
  const params = useParams();
  const id = params.id as string;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [acting, setActing] = useState(false);

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
    return <div className="font-mono text-xs text-inkDim">loading incident…</div>;
  }

  async function handleApprove() {
    setActing(true);
    await approveIncident(id);
    setActing(false);
  }

  async function handleReject() {
    setActing(true);
    await rejectIncident(id);
    setActing(false);
  }

  return (
    <div>
      <Link href="/" className="font-mono text-xs text-inkDim hover:text-signal tracking-widest">
        ← CONTROL ROOM
      </Link>

      <div className="flex items-center justify-between mt-4 mb-8">
        <div>
          <h1 className="font-mono text-lg text-ink">
            {incident.service.toUpperCase()} <span className="text-inkDim">/ {incident.id}</span>
          </h1>
        </div>
        <StateBadge state={incident.state} />
      </div>

      {incident.error && (
        <div className="mb-6 border border-crit/40 bg-crit/5 rounded-sm px-4 py-3 font-mono text-xs text-crit">
          {incident.error}
        </div>
      )}

      {/* INVESTIGATING */}
      {incident.state === "INVESTIGATING" && !incident.findings && (
        <Panel title="INVESTIGATOR">
          <div className="font-mono text-xs text-inkDim">querying metrics, logs, and traces…</div>
        </Panel>
      )}

      {/* FINDINGS */}
      {incident.findings && (
        <Panel title="INVESTIGATOR — FINDINGS">
          <p className="text-sm text-ink mb-4">{incident.findings.anomaly_summary}</p>
          <div className="grid grid-cols-3 gap-4 font-mono text-sm mb-4">
            <Stat label="ERROR RATE" value={`${incident.findings.error_rate_pct.toFixed(1)}%`} />
            <Stat label="P95 LATENCY" value={`${Math.round(incident.findings.latency_p95_ms)}ms`} />
            <Stat label="GPU UTIL" value={`${incident.findings.gpu_util_pct.toFixed(0)}%`} />
          </div>
          <div className="font-mono text-[11px] text-inkDim space-y-1">
            {incident.findings.sample_log_lines.map((line, i) => (
              <div key={i} className="truncate">▸ {line}</div>
            ))}
          </div>
        </Panel>
      )}

      {/* RECOMMENDATION */}
      {incident.recommendation && (
        <Panel title="ADVISOR — RECOMMENDATION">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-xs text-inkDim">CONFIDENCE</span>
            <span className="font-mono text-sm text-signal">{incident.recommendation.confidence_pct}%</span>
          </div>
          <p className="text-sm text-ink mb-4">{incident.recommendation.root_cause}</p>

          <div className="space-y-2 mb-4">
            {incident.recommendation.options.map((opt, i) => (
              <div
                key={i}
                className="flex items-center justify-between border border-panelLine rounded-sm px-3 py-2"
              >
                <span className="text-sm text-ink">{opt.action}</span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className={`border px-2 py-0.5 rounded-sm ${RISK_COLOR[opt.risk_level]}`}>
                    {opt.risk_level.toUpperCase()}
                  </span>
                  <span className="text-inkDim">~{opt.expected_recovery_min}m</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-[11px] mb-2">
            <div className="border border-crit/30 rounded-sm px-3 py-2">
              <div className="text-crit mb-1">IF IGNORED</div>
              <div className="text-inkDim leading-relaxed">{incident.recommendation.impact_if_ignored}</div>
            </div>
            <div className="border border-ok/30 rounded-sm px-3 py-2">
              <div className="text-ok mb-1">IF ACTED</div>
              <div className="text-inkDim leading-relaxed">{incident.recommendation.impact_if_acted}</div>
            </div>
          </div>
        </Panel>
      )}

      {/* APPROVAL GATE */}
      {incident.state === "AWAITING_APPROVAL" && (
        <div className="flex gap-3 mb-8">
          <button
            onClick={handleApprove}
            disabled={acting}
            className="font-mono text-xs tracking-widest bg-signal text-board px-5 py-2.5 rounded-sm hover:bg-signal/90 transition-colors disabled:opacity-40"
          >
            APPROVE REMEDIATION
          </button>
          <button
            onClick={handleReject}
            disabled={acting}
            className="font-mono text-xs tracking-widest border border-panelLine text-inkDim px-5 py-2.5 rounded-sm hover:border-crit hover:text-crit transition-colors disabled:opacity-40"
          >
            REJECT
          </button>
        </div>
      )}

      {incident.state === "REMEDIATING" && (
        <Panel title="EXECUTOR">
          <div className="font-mono text-xs text-warn pulse-signal">executing remediation…</div>
        </Panel>
      )}

      {/* REPORT */}
      {incident.report && (
        <Panel title="INCIDENT REPORT">
          <div className="grid grid-cols-3 gap-4 font-mono text-sm mb-4">
            <Stat label="RECOVERY TIME" value={`${incident.report.recovery_time_sec}s`} />
            <Stat label="JOBS RECOVERED" value={`${incident.report.jobs_recovered}`} />
            <Stat label="ACTION TAKEN" value={incident.report.action_taken} small />
          </div>
          <div className="border border-ok/30 rounded-sm px-3 py-2 font-mono text-[11px] text-ok">
            {incident.report.delay_avoided_estimate}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 border border-panelLine bg-panel rounded-sm px-5 py-4">
      <div className="font-mono text-[11px] tracking-widest text-inkDim mb-3">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className={small ? "text-xs text-ink truncate" : "text-ink"}>{value}</div>
      <div className="text-[10px] text-inkDim tracking-wider mt-1">{label}</div>
    </div>
  );
}
