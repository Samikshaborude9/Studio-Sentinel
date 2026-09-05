"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProductions,
  getShots,
  createIncident,
  injectScenario,
  ServiceStatus,
  Scenario,
  Shot,
} from "@/lib/api";
import PipelineTopology from "@/components/PipelineTopology";
import ScenarioPanel from "@/components/ScenarioPanel";
import TelemetryChart from "@/components/TelemetryChart";
import LiveShotMonitor from "@/components/LiveShotMonitor";

export default function Dashboard() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus> | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [selectedService, setSelectedService] = useState<string>("render");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const [data, shotList] = await Promise.all([
          getProductions().catch(() => null),
          getShots().catch(() => []),
        ]);
        if (alive) {
          if (data) setStatuses(data);
          if (shotList && shotList.length > 0) setShots(shotList);
        }
      } catch {
        // Backend connecting
      }
    }
    poll();
    const t = setInterval(poll, 2500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  async function handleTriggerScenario(scenario: Scenario) {
    setBusy(true);
    try {
      await injectScenario(scenario.id);
      // Wait a moment for generator to emit failing metrics
      await new Promise((r) => setTimeout(r, 600));
      const incident = await createIncident(scenario.service);
      router.push(`/incidents/${incident.id}`);
    } catch (err) {
      console.error("Scenario injection error:", err);
      setBusy(false);
    }
  }

  async function handleManualInspect(service: string) {
    setBusy(true);
    try {
      const incident = await createIncident(service);
      router.push(`/incidents/${incident.id}`);
    } catch (err) {
      console.error("Manual inspection error:", err);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-panelLine">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-signal/20 text-signal border border-signal/40 font-semibold tracking-widest uppercase">
              STUDIO SENTINEL v2.0
            </span>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-ok/15 text-ok border border-ok/30 font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
              GRAFANA CLOUD + GEMINI AGENTS ONLINE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">
            Autonomous Hollywood Production Control Room
          </h1>
          <p className="text-sm text-inkDim max-w-2xl mt-1 leading-relaxed">
            Multi-agent systems guarding high-stakes digital cinema workflows: Ingest, Transcoding,
            VFX Render Farm, and Worldwide DCP Distribution. Powered by Gemini Enterprise, Google ADK,
            and Grafana Cloud MCP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="font-mono text-xs tracking-widest border border-panelLine bg-panel text-ink hover:border-signal hover:text-signal px-4 py-2.5 rounded transition-colors"
          >
            VIEW INCIDENT LOG →
          </Link>
        </div>
      </div>

      {/* Pipeline Visualizer (Interactive 4-Stage Topology) */}
      <PipelineTopology
        statuses={statuses}
        onSelectService={(svc) => setSelectedService(svc)}
        activeService={selectedService}
      />

      {/* Live Cinema Shot Monitor & Feed (Generator Real-time Output) */}
      <LiveShotMonitor
        shots={shots}
        onInspectService={(svc) => handleManualInspect(svc)}
      />

      {/* Scenario Injection Controller (3 Hollywood Disaster Modes) */}
      <ScenarioPanel onTriggerScenario={handleTriggerScenario} busy={busy} />

      {/* Real-time Telemetry Graph */}
      <TelemetryChart statuses={statuses} selectedService={selectedService} />

      {/* Quick Stage Inspection Footer */}
      <div className="border border-panelLine bg-panel/40 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
            Manual Stage Anomaly Escalation
          </h3>
          <p className="text-xs text-inkDim mt-0.5">
            Trigger an ad-hoc deep inspection on any pipeline node without waiting for auto-thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["ingest", "transcode", "render", "distribution"].map((svc) => (
            <button
              key={svc}
              onClick={() => handleManualInspect(svc)}
              disabled={busy}
              className="font-mono text-[11px] uppercase tracking-wider border border-panelLine bg-board px-3 py-1.5 rounded hover:border-signal hover:text-signal transition-colors disabled:opacity-40"
            >
              Analyze {svc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
