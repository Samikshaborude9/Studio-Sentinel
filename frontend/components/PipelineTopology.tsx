"use client";
import React from "react";
import { ServiceStatus } from "@/lib/api";

const STAGES = [
  {
    key: "ingest",
    label: "01 / INGEST",
    role: "RAW Camera Offload & Dailies",
    icon: "📹",
    description: "ARRI / RED 8K RAW footage, checksums & storage offload",
  },
  {
    key: "transcode",
    label: "02 / TRANSCODE",
    role: "Editorial Proxies & ACES",
    icon: "🎞️",
    description: "ProRes proxy generation, ACES color grading pipeline",
  },
  {
    key: "render",
    label: "03 / RENDER FARM",
    role: "VFX & 3D Lighting Farm",
    icon: "⚡",
    description: "CUDA GPU batch nodes, raytracing & composite frames",
  },
  {
    key: "distribution",
    label: "04 / DISTRIBUTION",
    role: "Master DCP & Global CDN",
    icon: "🌐",
    description: "Encrypted DCI packages, worldwide theatrical streaming",
  },
];

interface PipelineProps {
  statuses: Record<string, ServiceStatus> | null;
  onSelectService: (service: string) => void;
  activeService?: string;
}

export default function PipelineTopology({ statuses, onSelectService, activeService }: PipelineProps) {
  return (
    <div className="border border-panelLine bg-panel/60 backdrop-blur-sm rounded-lg p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse" />
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-inkDim">
            Hollywood Production Pipeline Topology
          </h2>
        </div>
        <div className="font-mono text-[11px] text-inkDim/70">
          REAL-TIME GRAFANA TELEMETRY BUS ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {STAGES.map((stage, idx) => {
          const status = statuses?.[stage.key];
          const isFailing = status?.failing || (status?.error_rate_pct ?? 0) > 5;
          const isSelected = activeService === stage.key;

          return (
            <div key={stage.key} className="relative flex flex-col">
              {/* Card */}
              <div
                onClick={() => onSelectService(stage.key)}
                className={`group cursor-pointer rounded-md border p-4 transition-all duration-300 relative overflow-hidden ${
                  isFailing
                    ? "border-crit/80 bg-crit/10 shadow-[0_0_20px_rgba(255,77,77,0.15)]"
                    : isSelected
                    ? "border-signal bg-signal/10"
                    : "border-panelLine bg-panel hover:border-panelLine/80 hover:bg-panel/80"
                }`}
              >
                {/* Scanline top accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-colors ${
                    isFailing ? "bg-crit animate-pulse" : isSelected ? "bg-signal" : "bg-transparent group-hover:bg-panelLine"
                  }`}
                />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{stage.icon}</span>
                    <div>
                      <div className="font-mono text-[11px] font-semibold tracking-wider text-ink">
                        {stage.label}
                      </div>
                      <div className="text-[11px] text-inkDim truncate">{stage.role}</div>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border ${
                      isFailing
                        ? "border-crit/50 bg-crit/20 text-crit animate-pulse"
                        : "border-ok/30 bg-ok/10 text-ok"
                    }`}
                  >
                    {isFailing ? "CRITICAL" : "NOMINAL"}
                  </span>
                </div>

                <p className="text-[12px] text-inkDim mb-4 line-clamp-2 leading-relaxed">
                  {stage.description}
                </p>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-panelLine/60 font-mono text-[11px]">
                  <div>
                    <span className="text-[10px] text-inkDim block">ERROR RATE</span>
                    <span className={isFailing ? "text-crit font-bold" : "text-ink"}>
                      {status ? `${status.error_rate_pct.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-inkDim block">P95 LATENCY</span>
                    <span className={status && status.latency_p95_ms > 2000 ? "text-warn" : "text-ink"}>
                      {status ? `${Math.round(status.latency_p95_ms)}ms` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-inkDim block">QUEUE DEPTH</span>
                    <span className="text-ink">{status ? `${status.queue_depth} jobs` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-inkDim block">GPU VRAM</span>
                    <span className={status && status.gpu_util_pct > 80 ? "text-warn font-bold" : "text-ink"}>
                      {status ? `${Math.round(status.gpu_util_pct)}%` : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-right">
                  <span className="font-mono text-[10px] text-signal/80 group-hover:text-signal tracking-widest uppercase">
                    Inspect Stage →
                  </span>
                </div>
              </div>

              {/* Connecting arrow for desktop */}
              {idx < STAGES.length - 1 && (
                <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-panelLine text-sm font-bold">
                  ▶
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
