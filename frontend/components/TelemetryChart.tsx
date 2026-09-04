"use client";
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ServiceStatus } from "@/lib/api";

interface TelemetryChartProps {
  statuses: Record<string, ServiceStatus> | null;
  selectedService: string;
}

type Point = {
  time: string;
  error_rate: number;
  latency: number;
  gpu: number;
  queue: number;
};

export default function TelemetryChart({ statuses, selectedService }: TelemetryChartProps) {
  const [history, setHistory] = useState<Point[]>([]);

  useEffect(() => {
    if (!statuses || !statuses[selectedService]) return;
    const s = statuses[selectedService];
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    const newPt: Point = {
      time: timeStr,
      error_rate: s.error_rate_pct,
      latency: Math.round(s.latency_p95_ms),
      gpu: Math.round(s.gpu_util_pct),
      queue: s.queue_depth,
    };

    setHistory((prev) => {
      const next = [...prev, newPt];
      return next.slice(-20); // keep last 20 ticks
    });
  }, [statuses, selectedService]);

  const current = statuses?.[selectedService];

  return (
    <div className="border border-panelLine bg-panel rounded-lg p-5 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-inkDim">
              Live Grafana Telemetry Stream
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-signal/15 text-signal border border-signal/30 uppercase font-semibold">
              {selectedService}
            </span>
          </div>
          <p className="text-xs text-inkDim mt-1">
            Real-time PromQL time series feed — monitored by Investigator Agent (Technical Producer).
          </p>
        </div>

        {current && (
          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-[10px] text-inkDim block">ERRORS</span>
              <span className={current.error_rate_pct > 5 ? "text-crit font-bold" : "text-ink"}>
                {current.error_rate_pct.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-inkDim block">P95 LATENCY</span>
              <span className={current.latency_p95_ms > 2000 ? "text-warn font-bold" : "text-ink"}>
                {Math.round(current.latency_p95_ms)}ms
              </span>
            </div>
            <div>
              <span className="text-[10px] text-inkDim block">GPU UTIL</span>
              <span className={current.gpu_util_pct > 80 ? "text-warn font-bold" : "text-ink"}>
                {Math.round(current.gpu_util_pct)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-inkDim block">QUEUE</span>
              <span className="text-ink">{current.queue_depth} jobs</span>
            </div>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        {history.length < 2 ? (
          <div className="h-full flex items-center justify-center font-mono text-xs text-inkDim">
            Gathering live PromQL telemetry points…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6A2B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF6A2B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#23272E" vertical={false} />
              <XAxis dataKey="time" stroke="#8A909B" fontSize={10} tickLine={false} />
              <YAxis stroke="#8A909B" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#14171C",
                  borderColor: "#23272E",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <Area
                type="monotone"
                dataKey="error_rate"
                name="Error Rate (%)"
                stroke="#FF4D4D"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#errorGrad)"
              />
              <Area
                type="monotone"
                dataKey="gpu"
                name="GPU Util (%)"
                stroke="#FF6A2B"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#gpuGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
