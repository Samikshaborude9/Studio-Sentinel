"use client";
import { ServiceStatus } from "@/lib/api";

const SERVICE_LABEL: Record<string, string> = {
  ingest: "INGEST",
  transcode: "TRANSCODE",
  render: "RENDER / VFX",
  distribution: "DISTRIBUTION",
};

export default function ProductionTile({
  status,
  onWatch,
}: {
  status: ServiceStatus;
  onWatch: () => void;
}) {
  const critical = status.failing || status.error_rate_pct > 5;
  const dotColor = critical ? "bg-crit" : "bg-ok";

  return (
    <div
      className={`rounded-sm border bg-panel px-5 py-4 transition-colors ${
        critical ? "border-crit/50" : "border-panelLine"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs tracking-widest text-inkDim">
          {SERVICE_LABEL[status.service] || status.service.toUpperCase()}
        </span>
        <span className={`w-2 h-2 rounded-full ${dotColor} ${critical ? "pulse-signal" : ""}`} />
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-[13px] mb-4">
        <Metric label="ERR%" value={status.error_rate_pct.toFixed(1)} bad={status.error_rate_pct > 5} />
        <Metric label="P95 MS" value={Math.round(status.latency_p95_ms).toString()} bad={status.latency_p95_ms > 2000} />
        <Metric label="QUEUE" value={Math.round(status.queue_depth).toString()} bad={status.queue_depth > 20} />
      </div>

      {critical ? (
        <button
          onClick={onWatch}
          className="w-full text-xs font-mono tracking-widest bg-signal text-board py-2 rounded-sm hover:bg-signal/90 transition-colors"
        >
          INVESTIGATE →
        </button>
      ) : (
        <div className="text-[11px] font-mono text-inkDim">nominal</div>
      )}
    </div>
  );
}

function Metric({ label, value, bad }: { label: string; value: string; bad: boolean }) {
  return (
    <div>
      <div className={bad ? "text-crit" : "text-ink"}>{value}</div>
      <div className="text-[10px] text-inkDim tracking-wider">{label}</div>
    </div>
  );
}
