"use client";
import React, { useState } from "react";
import { Scenario } from "@/lib/api";

const PRESET_SCENARIOS: Scenario[] = [
  {
    id: "render_oom",
    service: "render",
    title: "VFX Render Farm CUDA OOM",
    narrative: "Bad shader build v4.2 causes 98% GPU VRAM exhaustion on 8K composite frames, halting the visual effects pipeline.",
  },
  {
    id: "ingest_corrupt",
    service: "ingest",
    title: "Dailies RAW Ingest Checksum Failure",
    narrative: "Camera memory card corruption triggers MD5 mismatch on ARRI RAW reels, threatening morning director review.",
  },
  {
    id: "dist_timeout",
    service: "distribution",
    title: "Master DCP Distribution CDN Timeout",
    narrative: "Global premiere encrypted DCP delivery stream stalls from edge 504 timeouts, endangering simultaneous theatrical debut.",
  },
];

interface ScenarioPanelProps {
  onTriggerScenario: (scenario: Scenario) => Promise<void>;
  busy: boolean;
}

export default function ScenarioPanel({ onTriggerScenario, busy }: ScenarioPanelProps) {
  const [selected, setSelected] = useState<string>("render_oom");

  const currentScenario = PRESET_SCENARIOS.find((s) => s.id === selected) || PRESET_SCENARIOS[0];

  return (
    <div className="border border-panelLine bg-panel rounded-lg p-5 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🎬</span>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-semibold">
              Hollywood Studio Incident Simulator
            </h2>
          </div>
          <p className="text-xs text-inkDim mt-1">
            Simulate realistic production-stopping anomalies to test the autonomous multi-agent response loop.
          </p>
        </div>

        <button
          onClick={() => onTriggerScenario(currentScenario)}
          disabled={busy}
          className="font-mono text-xs font-semibold tracking-wider bg-signal text-board hover:bg-signal/90 px-4 py-2.5 rounded shadow-lg shadow-signal/20 transition-all disabled:opacity-40 flex items-center gap-2"
        >
          {busy ? (
            <>
              <span className="w-3 h-3 border-2 border-board border-t-transparent rounded-full animate-spin" />
              ORCHESTRATING INCIDENT…
            </>
          ) : (
            <>
              <span>⚡</span> INJECT SCENARIO & WATCH AGENTS
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESET_SCENARIOS.map((scenario) => {
          const isSelected = selected === scenario.id;
          return (
            <div
              key={scenario.id}
              onClick={() => setSelected(scenario.id)}
              className={`cursor-pointer rounded border p-3.5 transition-all text-left ${
                isSelected
                  ? "border-signal bg-signal/5 shadow-sm"
                  : "border-panelLine bg-board/40 hover:border-panelLine/80 hover:bg-board/60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                  {scenario.service.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-inkDim uppercase">
                  {isSelected ? "● SELECTED" : "SELECT"}
                </span>
              </div>
              <h3 className="text-sm font-medium text-ink mb-1.5">{scenario.title}</h3>
              <p className="text-[12px] text-inkDim leading-relaxed">{scenario.narrative}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
