"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductions, injectFailure, createIncident, ServiceStatus } from "@/lib/api";
import ProductionTile from "@/components/ProductionTile";

export default function Dashboard() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus> | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const data = await getProductions();
        if (alive) setStatuses(data);
      } catch {
        // generator/backend not reachable yet — keep the board blank rather than crash
      }
    }
    poll();
    const t = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  async function handleInject() {
    setBusy(true);
    await injectFailure("render");
    setBusy(false);
  }

  async function handleWatch(service: string) {
    setBusy(true);
    const incident = await createIncident(service);
    router.push(`/incidents/${incident.id}`);
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-mono text-sm tracking-[0.3em] text-inkDim mb-1">
            THREE PRODUCTIONS ONLINE
          </h1>
          <p className="text-inkDim text-sm max-w-lg">
            Watching ingest, transcode, render, and distribution across the pipeline.
            Sentinel escalates anything that puts a delivery window at risk.
          </p>
        </div>
        <button
          onClick={handleInject}
          disabled={busy}
          className="font-mono text-xs tracking-widest border border-panelLine text-inkDim px-4 py-2 rounded-sm hover:border-signal hover:text-signal transition-colors disabled:opacity-40"
        >
          INJECT DEMO FAILURE
        </button>
      </div>

      {!statuses ? (
        <div className="font-mono text-xs text-inkDim">connecting to control room…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(statuses).map((s) => (
            <ProductionTile key={s.service} status={s} onWatch={() => handleWatch(s.service)} />
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-panelLine pt-4">
        <a href="/incidents" className="font-mono text-xs text-inkDim hover:text-signal tracking-widest">
          VIEW INCIDENT LOG →
        </a>
      </div>
    </div>
  );
}
