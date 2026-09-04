"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listIncidents, Incident } from "@/lib/api";
import StateBadge from "@/components/StateBadge";

export default function IncidentLog() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const data = await listIncidents();
        if (alive) setIncidents(data);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-panelLine">
        <div>
          <Link
            href="/"
            className="font-mono text-xs text-inkDim hover:text-signal tracking-widest inline-flex items-center gap-1 mb-2"
          >
            ← BACK TO CONTROL ROOM
          </Link>
          <h1 className="text-xl font-bold font-display tracking-tight text-ink">
            Studio Production Incident History
          </h1>
          <p className="text-xs text-inkDim mt-0.5">
            Audit trail of all autonomous escalations, risk assessments, and human approvals.
          </p>
        </div>
        <div className="font-mono text-xs text-inkDim">
          TOTAL LOGGED: <span className="text-signal font-semibold">{incidents.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {incidents.length === 0 && (
          <div className="border border-panelLine bg-panel rounded-lg p-8 text-center font-mono text-xs text-inkDim">
            No incidents recorded yet. Use the Hollywood Incident Simulator on the dashboard to trigger an incident.
          </div>
        )}

        {incidents.map((inc) => (
          <Link
            key={inc.id}
            href={`/incidents/${inc.id}`}
            className="block border border-panelLine bg-panel rounded-lg p-4 hover:border-signal/50 hover:bg-panel/80 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-signal/15 text-signal border border-signal/30 uppercase font-semibold">
                  {inc.service}
                </span>
                <span className="font-mono text-xs text-ink font-semibold">
                  #{inc.id}
                </span>
                <span className="font-mono text-[11px] text-inkDim">
                  {new Date(inc.created_at).toLocaleString()}
                </span>
              </div>
              <StateBadge state={inc.state} />
            </div>

            <p className="text-xs text-inkDim line-clamp-1">
              {inc.recommendation?.root_cause ||
                inc.findings?.anomaly_summary ||
                "Incident being analyzed by autonomous agents…"}
            </p>

            {inc.report && (
              <div className="mt-2 pt-2 border-t border-panelLine/60 flex items-center gap-4 font-mono text-[11px] text-ok">
                <span>✓ Recovered in {inc.report.recovery_time_sec}s</span>
                <span>• {inc.report.jobs_recovered} jobs rescued</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
