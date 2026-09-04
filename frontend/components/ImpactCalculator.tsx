"use client";
import React from "react";
import { Recommendation, IncidentReport } from "@/lib/api";

interface ImpactProps {
  recommendation: Recommendation | null;
  report: IncidentReport | null;
}

export default function ImpactCalculator({ recommendation, report }: ImpactProps) {
  if (!recommendation && !report) return null;

  return (
    <div className="border border-panelLine bg-panel rounded-lg p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">💰</span>
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-inkDim font-semibold">
          Hollywood Production Financial & Schedule Exposure
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="border border-panelLine/80 bg-board/60 rounded p-3">
          <span className="font-mono text-[10px] text-inkDim block uppercase tracking-wider">
            STUDIO DOWNTIME RATE
          </span>
          <div className="text-xl font-mono text-ink font-bold mt-1">$45,000 / hr</div>
          <span className="text-[11px] text-inkDim mt-1 block">
            VFX artists, colorists & stage crew idle cost
          </span>
        </div>

        <div className="border border-panelLine/80 bg-board/60 rounded p-3">
          <span className="font-mono text-[10px] text-inkDim block uppercase tracking-wider">
            CRITICAL DEADLINE
          </span>
          <div className="text-xl font-mono text-warn font-bold mt-1">08:00 AM DAILIES</div>
          <span className="text-[11px] text-inkDim mt-1 block">
            Executive review cutoff with director & studio heads
          </span>
        </div>

        <div className="border border-panelLine/80 bg-board/60 rounded p-3">
          <span className="font-mono text-[10px] text-inkDim block uppercase tracking-wider">
            {report ? "RECOVERY ACHIEVED" : "SLA RECOVERY WINDOW"}
          </span>
          <div className={`text-xl font-mono font-bold mt-1 ${report ? "text-ok" : "text-signal"}`}>
            {report ? `${report.recovery_time_sec}s RESCUE` : "~3 MIN ESTIMATE"}
          </div>
          <span className="text-[11px] text-inkDim mt-1 block">
            {report
              ? `${report.jobs_recovered} production jobs restored to queue`
              : "Rollback restores baseline pipeline throughput"}
          </span>
        </div>
      </div>

      {recommendation && !report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="border border-crit/40 bg-crit/10 rounded p-3 text-crit">
            <span className="font-bold block mb-1">⚠ EXPOSURE IF IGNORED</span>
            <p className="text-[12px] text-inkDim leading-relaxed">
              {recommendation.impact_if_ignored}
            </p>
          </div>
          <div className="border border-ok/40 bg-ok/10 rounded p-3 text-ok">
            <span className="font-bold block mb-1">✓ OUTCOME IF ACTED</span>
            <p className="text-[12px] text-inkDim leading-relaxed">
              {recommendation.impact_if_acted}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
