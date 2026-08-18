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
    <div>
      <h1 className="font-mono text-sm tracking-[0.3em] text-inkDim mb-6">INCIDENT LOG</h1>
      <div className="space-y-2">
        {incidents.length === 0 && (
          <div className="font-mono text-xs text-inkDim">no incidents yet</div>
        )}
        {incidents.map((inc) => (
          <Link
            key={inc.id}
            href={`/incidents/${inc.id}`}
            className="flex items-center justify-between border border-panelLine bg-panel rounded-sm px-4 py-3 hover:border-signal/40 transition-colors"
          >
            <div className="font-mono text-xs">
              <span className="text-inkDim mr-3">{inc.id}</span>
              <span className="text-ink">{inc.service}</span>
            </div>
            <StateBadge state={inc.state} />
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <Link href="/" className="font-mono text-xs text-inkDim hover:text-signal tracking-widest">
          ← BACK TO CONTROL ROOM
        </Link>
      </div>
    </div>
  );
}
