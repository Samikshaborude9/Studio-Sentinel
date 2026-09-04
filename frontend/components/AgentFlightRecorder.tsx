"use client";
import React from "react";
import { Incident } from "@/lib/api";

interface FlightRecorderProps {
  incident: Incident;
}

export default function AgentFlightRecorder({ incident }: FlightRecorderProps) {
  const steps = [
    {
      role: "THE DIRECTOR",
      title: "Pipeline Telemetry Anomaly Detected",
      sub: "Orchestrator detected threshold breach on Grafana Prometheus metrics stream.",
      active: true,
      done: true,
      icon: "🎬",
    },
    {
      role: "INVESTIGATOR (TECHNICAL PRODUCER)",
      title: "Grafana Cloud & Loki Log Querying",
      sub: incident.findings
        ? `Queried PromQL & Loki. Error Rate: ${incident.findings.error_rate_pct.toFixed(1)}%, Latency: ${Math.round(
            incident.findings.latency_p95_ms
          )}ms, GPU: ${Math.round(incident.findings.gpu_util_pct)}%`
        : "Querying live Grafana Cloud datasources via MCP protocol…",
      active: true,
      done: !!incident.findings,
      icon: "🔍",
    },
    {
      role: "ADVISOR (GEMINI 2.5 PRO REASONING)",
      title: "Root Cause & Hollywood Risk Assessment",
      sub: incident.recommendation
        ? `Root Cause: ${incident.recommendation.root_cause} (Confidence: ${incident.recommendation.confidence_pct}%)`
        : "Analyzing root cause, calculating delivery window SLA impact…",
      active: !!incident.findings,
      done: !!incident.recommendation,
      icon: "🧠",
    },
    {
      role: "STUDIO HEAD (GOVERNANCE GATE)",
      title: "Human-in-the-Loop Executive Authorization",
      sub:
        incident.state === "AWAITING_APPROVAL"
          ? "CRITICAL DECISION REQUIRED: Studio Head sign-off required to authorize production rollback."
          : incident.state === "REMEDIATING" || incident.state === "RESOLVED"
          ? "Remediation authorized by Studio Head. Cloud IAM audit log recorded."
          : incident.state === "REJECTED"
          ? "Remediation rejected by Studio Head."
          : "Standing by for advisor risk-scored recommendations…",
      active: !!incident.recommendation,
      done: incident.state === "REMEDIATING" || incident.state === "RESOLVED" || incident.state === "REJECTED",
      icon: "🛡️",
      highlight: incident.state === "AWAITING_APPROVAL",
    },
    {
      role: "EXECUTOR (TECHNICAL DIRECTOR)",
      title: "Automated Rollback & Grafana Verification",
      sub: incident.report
        ? `Executed: ${incident.report.action_taken}. Recovered in ${incident.report.recovery_time_sec}s. ${incident.report.jobs_recovered} pipeline jobs rescued.`
        : incident.state === "REMEDIATING"
        ? "Executing rollback tool and polling Grafana telemetry for recovery confirmation…"
        : "Standing by for executive approval…",
      active: incident.state === "REMEDIATING" || incident.state === "RESOLVED",
      done: incident.state === "RESOLVED",
      icon: "⚡",
    },
  ];

  return (
    <div className="border border-panelLine bg-panel rounded-lg p-5 mb-8">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-panelLine">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse" />
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-semibold">
            Autonomous Agent Flight Recorder
          </h2>
        </div>
        <div className="font-mono text-[11px] text-inkDim">
          AGENT STATUS: <span className="text-ok font-semibold">{incident.state}</span>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3.5 p-3.5 rounded border transition-all ${
              step.highlight
                ? "border-signal bg-signal/10 shadow-[0_0_15px_rgba(255,106,43,0.15)]"
                : step.done
                ? "border-ok/30 bg-ok/5"
                : step.active
                ? "border-panelLine bg-board/50"
                : "border-panelLine/40 bg-board/20 opacity-50"
            }`}
          >
            <div className="text-xl mt-0.5">{step.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-inkDim">
                  {step.role}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${
                    step.done
                      ? "text-ok"
                      : step.active
                      ? "text-signal animate-pulse"
                      : "text-inkDim"
                  }`}
                >
                  {step.done ? "✓ COMPLETE" : step.active ? "● ACTIVE" : "WAITING"}
                </span>
              </div>
              <h4 className="text-sm font-medium text-ink mt-0.5">{step.title}</h4>
              <p className="text-[12px] text-inkDim mt-1 leading-relaxed">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
