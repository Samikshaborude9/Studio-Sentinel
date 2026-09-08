"use client";
import { useState, useRef, useEffect } from "react";
import { Shot } from "@/lib/api";

interface LiveShotMonitorProps {
  shots: Shot[];
  onInspectService?: (service: string) => void;
}

export default function LiveShotMonitor({ shots, onInspectService }: LiveShotMonitorProps) {
  const [filterService, setFilterService] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [activeScreeningShot, setActiveScreeningShot] = useState<Shot | null>(null);

  const filteredShots = shots.filter((shot) => {
    if (filterService !== "all" && shot.service !== filterService) return false;
    if (filterStatus === "active" && shot.status !== "IN_PROGRESS") return false;
    if (filterStatus === "completed" && shot.status !== "COMPLETED") return false;
    if (filterStatus === "failed" && shot.status !== "FAILED") return false;
    return true;
  });

  const activeCount = shots.filter((s) => s.status === "IN_PROGRESS").length;
  const completedCount = shots.filter((s) => s.status === "COMPLETED").length;
  const failedCount = shots.filter((s) => s.status === "FAILED").length;

  return (
    <section className="border border-panelLine bg-panel/70 rounded-xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-signal/5 via-transparent to-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-panelLine/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse shadow-[0_0_8px_#FF6A2B]" />
            <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-ink font-bold">
              PIPELINE LIVE STAGES &amp; DAILIES SCREENING
            </h2>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-signal/15 border border-signal/30 text-signal font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ping" />
              Real-Time Feed
            </span>
          </div>
          <p className="text-xs text-inkDim max-w-xl">
            Live digital cinema stages: Ingest, Transcoding, 8K VFX Render Farm, and Worldwide DCP Theatrical. Hover for instant video preview; click to screen full dailies with camera HUD and audio.
          </p>
        </div>

        {/* Live Stage Counters */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-board/80 border border-panelLine px-3 py-1.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
            <span className="font-mono text-xs text-ink font-semibold">{activeCount}</span>
            <span className="font-mono text-[10px] text-inkDim uppercase">Active</span>
          </div>

          <div className="flex items-center gap-2 bg-board/80 border border-panelLine px-3 py-1.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-ok" />
            <span className="font-mono text-xs text-ink font-semibold">{completedCount}</span>
            <span className="font-mono text-[10px] text-inkDim uppercase">Passed</span>
          </div>

          {failedCount > 0 ? (
            <div className="flex items-center gap-2 bg-crit/15 border border-crit/40 px-3 py-1.5 rounded-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-crit" />
              <span className="font-mono text-xs text-crit font-bold">{failedCount}</span>
              <span className="font-mono text-[10px] text-crit font-semibold uppercase">Anomaly</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-board/80 border border-panelLine px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-inkDim/40" />
              <span className="font-mono text-xs text-inkDim">0</span>
              <span className="font-mono text-[10px] text-inkDim uppercase">Anomaly</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-panelLine/60 text-xs">
        {/* Stage Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] text-inkDim mr-1 uppercase">Filter:</span>
          {[
            { id: "all", label: "All 4 Stages" },
            { id: "ingest", label: "RAW Ingest" },
            { id: "transcode", label: "ACES Transcode" },
            { id: "render", label: "VFX Render Farm" },
            { id: "distribution", label: "DCP Theatrical" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterService(tab.id)}
              className={`font-mono text-[11px] px-2.5 py-1 rounded transition-all ${
                filterService === tab.id
                  ? "bg-signal text-board font-bold shadow-md shadow-signal/20"
                  : "bg-board/60 text-inkDim hover:text-ink hover:bg-board border border-panelLine"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status & View Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-board/80 p-0.5 rounded border border-panelLine">
            {(["all", "active", "completed", "failed"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded transition-all ${
                  filterStatus === st
                    ? "bg-panel text-signal font-semibold border border-panelLine"
                    : "text-inkDim hover:text-ink"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-board/80 p-0.5 rounded border border-panelLine">
            <button
              onClick={() => setViewMode("cards")}
              className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded transition-all ${
                viewMode === "cards"
                  ? "bg-panel text-ink font-semibold"
                  : "text-inkDim hover:text-ink"
              }`}
              title="Card Grid View"
            >
              Stage Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded transition-all ${
                viewMode === "table"
                  ? "bg-panel text-ink font-semibold"
                  : "text-inkDim hover:text-ink"
              }`}
              title="Telemetry Table View"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredShots.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-mono text-sm text-inkDim">No stage shots match the current filter criteria.</p>
        </div>
      ) : viewMode === "cards" ? (
        /* Reduced 4-Stage Grid with Dedicated Videos & Hover Preview */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {filteredShots.map((shot) => (
            <StageShotCard
              key={shot.id}
              shot={shot}
              onSelect={() => setActiveScreeningShot(shot)}
            />
          ))}
        </div>
      ) : (
        /* Telemetry Table View */
        <div className="overflow-x-auto pt-4">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-panelLine text-[10px] uppercase text-inkDim tracking-wider">
                <th className="py-2.5 px-3">Visual</th>
                <th className="py-2.5 px-3">Shot ID</th>
                <th className="py-2.5 px-3">Project / Sequence</th>
                <th className="py-2.5 px-3">Pipeline Stage</th>
                <th className="py-2.5 px-3">Format / Res</th>
                <th className="py-2.5 px-3">Compute Node</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelLine/40 text-[11px]">
              {filteredShots.map((shot) => {
                const isFailed = shot.status === "FAILED";
                const isCompleted = shot.status === "COMPLETED";
                const isInProgress = shot.status === "IN_PROGRESS";

                return (
                  <tr
                    key={shot.id}
                    onClick={() => setActiveScreeningShot(shot)}
                    className={`hover:bg-panel/60 transition-colors cursor-pointer ${
                      isFailed ? "bg-crit/5" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="w-14 h-8 rounded overflow-hidden border border-panelLine bg-board relative group">
                        <img
                          src={shot.preview_url || "/shots/dune.jpg"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-signal/30 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">▶</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-ink">
                      {shot.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-signal font-semibold text-[10px]">{shot.project}</div>
                      <div className="text-ink truncate max-w-xs">{shot.sequence}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-board px-2 py-0.5 rounded border border-panelLine text-[10px] text-inkDim">
                        {shot.stage_label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-inkDim text-[10px]">
                      {shot.resolution}
                    </td>
                    <td className="py-2.5 px-3 text-inkDim text-[10px]">
                      {shot.compute_node}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-board rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isFailed ? "bg-crit" : isCompleted ? "bg-ok" : "bg-signal"
                            }`}
                            style={{ width: `${shot.progress_pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-inkDim">
                          {shot.completed_frames}/{shot.total_frames}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold border ${
                          isFailed
                            ? "bg-crit/20 text-crit border-crit/40 animate-pulse"
                            : isCompleted
                            ? "bg-ok/15 text-ok border-ok/30"
                            : isInProgress
                            ? "bg-signal/15 text-signal border-signal/40"
                            : "bg-board text-inkDim border-panelLine"
                        }`}
                      >
                        {shot.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Hollywood Dailies Screening Room Video Modal */}
      {activeScreeningShot && (
        <ScreeningRoomModal
          shot={activeScreeningShot}
          onClose={() => setActiveScreeningShot(null)}
          onInspectService={onInspectService}
        />
      )}
    </section>
  );
}

interface StageShotCardProps {
  shot: Shot;
  onSelect: () => void;
}

function StageShotCard({ shot, onSelect }: StageShotCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverVideoRef = useRef<HTMLVideoElement>(null);

  const isFailed = shot.status === "FAILED";
  const isCompleted = shot.status === "COMPLETED";
  const isInProgress = shot.status === "IN_PROGRESS";

  const borderClass = isFailed
    ? "border-crit/70 bg-crit/5 shadow-[0_0_20px_rgba(255,77,77,0.18)]"
    : isCompleted
    ? "border-ok/30 bg-board/50 hover:border-ok/60"
    : isInProgress
    ? "border-signal/40 bg-board/70 hover:border-signal shadow-[0_0_15px_rgba(255,106,43,0.12)]"
    : "border-panelLine bg-board/40";

  // Control video preview playback on card hover
  useEffect(() => {
    if (!hoverVideoRef.current) return;
    if (isHovered) {
      hoverVideoRef.current.currentTime = 0;
      hoverVideoRef.current.play().catch(() => {});
    } else {
      hoverVideoRef.current.pause();
    }
  }, [isHovered]);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`border rounded-lg overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:scale-[1.015] ${borderClass}`}
    >
      {/* Cinema Visual Video / Frame Preview */}
      <div className="relative aspect-video w-full bg-board overflow-hidden border-b border-panelLine">
        {/* Still image poster */}
        <img
          src={shot.preview_url || "/shots/dune.jpg"}
          alt={shot.sequence}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isHovered ? "opacity-0" : "opacity-100"
          } ${isFailed ? "filter contrast-125 saturate-50 hue-rotate-15" : ""}`}
        />

        {/* Live Hover Video Player with unique video for this stage */}
        {shot.video_url && (
          <video
            ref={hoverVideoRef}
            src={shot.video_url}
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            } ${isFailed ? "filter contrast-150 saturate-50 hue-rotate-15" : ""}`}
          />
        )}

        {/* Cinema 2.39:1 Letterbox Bar Accents */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-board/80 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-board/80 pointer-events-none" />

        {/* Top Overlay: Watermark & REC badge */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono pointer-events-none">
          <span className="bg-board/90 backdrop-blur-md px-2 py-0.5 rounded text-ink border border-panelLine font-bold flex items-center gap-1.5 text-[10px]">
            {isFailed ? (
              <span className="w-1.5 h-1.5 rounded-full bg-crit animate-ping" />
            ) : isInProgress ? (
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-ok" />
            )}
            {shot.id}
          </span>

          <span
            className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold border backdrop-blur-md ${
              isFailed
                ? "bg-crit/80 text-white border-crit animate-pulse"
                : isCompleted
                ? "bg-ok/80 text-board border-ok"
                : isInProgress
                ? "bg-signal/90 text-board border-signal"
                : "bg-board/80 text-inkDim border-panelLine"
            }`}
          >
            {shot.status}
          </span>
        </div>

        {/* Play Video / Screen Dailies Hover Action */}
        <div className="absolute inset-0 bg-board/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-signal text-board flex items-center justify-center shadow-lg shadow-signal/40 group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4 translate-x-0.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink font-bold bg-board/90 px-2 py-0.5 rounded border border-panelLine">
            Screen Reel
          </span>
        </div>

        {/* Failed Anomaly Scanline Overlay */}
        {isFailed && (
          <div className="absolute inset-0 pointer-events-none bg-crit/15 flex flex-col justify-end p-2">
            <div className="bg-board/95 border border-crit/60 p-1.5 rounded text-[9px] font-mono text-crit">
              <div className="font-bold flex items-center gap-1">
                <span>⚠ ANOMALY:</span>
                <span className="truncate">{shot.service.toUpperCase()} INCIDENT</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar on Image: Stage Badge & FPS */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono text-ink/90 bg-board/75 backdrop-blur-md px-2 py-0.5 rounded border border-panelLine/60 pointer-events-none">
          <span className="uppercase font-semibold text-signal">{shot.service}</span>
          <span>{shot.fps} FPS</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="mb-2">
            <span className="font-mono text-[10px] tracking-widest text-signal font-bold uppercase block">
              {shot.project}
            </span>
            <h3 className="font-mono text-xs font-bold text-ink tracking-tight truncate">
              {shot.sequence}
            </h3>
            <p className="text-[10px] text-inkDim font-mono mt-0.5 truncate">
              Dir. {shot.director} • {shot.aspect_ratio}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-inkDim font-mono mb-2.5">
            <span className="bg-panel px-2 py-0.5 rounded border border-panelLine text-ink truncate text-[10px]">
              {shot.stage_label}
            </span>
          </div>

          {/* Failure Detail */}
          {isFailed && (
            <div className="mb-2.5 p-2 rounded bg-crit/10 border border-crit/30 font-mono text-[10px] text-crit leading-snug">
              {shot.error_message}
            </div>
          )}
        </div>

        {/* Frame Progress Bar & Node */}
        <div className="pt-2 border-t border-panelLine/60 space-y-1.5">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-inkDim">
              {shot.completed_frames} / {shot.total_frames} frames
            </span>
            <span
              className={`font-bold ${
                isFailed ? "text-crit" : isCompleted ? "text-ok" : "text-signal"
              }`}
            >
              {shot.progress_pct}%
            </span>
          </div>

          <div className="w-full h-1.5 bg-board rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isFailed
                  ? "bg-crit"
                  : isCompleted
                  ? "bg-ok"
                  : "bg-signal shadow-[0_0_8px_#FF6A2B]"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, shot.progress_pct))}%` }}
            />
          </div>

          <div className="flex items-center justify-between font-mono text-[9px] text-inkDim pt-0.5">
            <span className="truncate">Node: {shot.compute_node}</span>
            <span>{shot.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScreeningModalProps {
  shot: Shot;
  onClose: () => void;
  onInspectService?: (service: string) => void;
}

function ScreeningRoomModal({ shot, onClose, onInspectService }: ScreeningModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(shot.completed_frames);
  const isFailed = shot.status === "FAILED";

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  function stepFrame(delta: number) {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + delta * (1 / (shot.fps || 24)));
    setCurrentFrame((prev) => Math.max(0, Math.min(shot.total_frames, prev + delta)));
  }

  return (
    <div className="fixed inset-0 z-50 bg-board/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="border border-panelLine bg-panel w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-panelLine flex items-center justify-between bg-board/80">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-signal shadow-[0_0_8px_#FF6A2B]" />
            <div>
              <span className="font-mono text-xs text-signal font-bold uppercase tracking-widest block">
                {shot.project} • DAILIES SCREENING ROOM
              </span>
              <h3 className="font-mono text-sm text-ink font-bold">
                {shot.id} — {shot.sequence}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-board border border-panelLine text-inkDim hover:text-ink hover:border-signal flex items-center justify-center font-mono text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Video Player Display Container */}
        <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden min-h-[340px] max-h-[500px]">
          {/* HTML5 Video Player */}
          <video
            ref={videoRef}
            src={shot.video_url || "/videos/vfx_render.mp4"}
            poster={shot.preview_url || "/shots/dune.jpg"}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full object-contain ${
              isFailed ? "filter contrast-150 saturate-50 hue-rotate-15" : ""
            }`}
          />

          {/* Anamorphic Scope Letterbox Masking */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-black pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-black pointer-events-none" />

          {/* Broadcast Camera Watermark Overlay */}
          <div className="absolute top-6 left-6 right-6 flex items-start justify-between text-xs font-mono pointer-events-none">
            <div className="space-y-0.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-crit animate-pulse" />
                <span className="text-white font-bold">● REC {shot.fps || 24}.000 FPS</span>
              </div>
              <div className="text-[10px] text-white/70">
                TC 01:24:18:{String(currentFrame % (shot.fps || 24)).padStart(2, "0")}
              </div>
            </div>

            <div className="text-right bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 text-[10px] text-white/80 space-y-0.5">
              <div>STAGE: {shot.service.toUpperCase()} • {shot.resolution}</div>
              <div className="text-signal font-semibold">ACES 1.3 cg • {shot.aspect_ratio}</div>
            </div>
          </div>

          {/* Anomaly Glitch Alert Overlay if FAILED */}
          {isFailed && (
            <div className="absolute inset-0 bg-crit/20 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-board/95 border-2 border-crit p-5 rounded-lg max-w-md shadow-2xl space-y-3">
                <div className="flex items-center justify-center gap-2 text-crit font-mono text-sm font-bold tracking-wider">
                  <span className="w-3 h-3 rounded-full bg-crit animate-ping" />
                  <span>PIPELINE ANOMALY CORRUPTION</span>
                </div>
                <p className="font-mono text-xs text-ink">{shot.error_message}</p>
                {onInspectService && (
                  <button
                    onClick={() => {
                      onClose();
                      onInspectService(shot.service);
                    }}
                    className="w-full font-mono text-xs uppercase tracking-wider py-2 px-4 rounded bg-crit text-board font-bold hover:bg-crit/80 transition-colors"
                  >
                    Escalate &amp; Investigate Incident →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Audio VU Meters Dynamic Animation */}
          <div className="absolute bottom-6 right-6 flex items-end gap-1 bg-black/60 backdrop-blur-md p-2 rounded border border-white/10 pointer-events-none">
            {[45, 65, 80, 50, 70, 90, 60, 40].map((h, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-sm ${h > 75 ? "bg-crit" : h > 60 ? "bg-warn" : "bg-ok"}`}
                style={{ height: `${h * 0.25}px` }}
              />
            ))}
            <span className="font-mono text-[9px] text-white/60 ml-1">L/R CH</span>
          </div>
        </div>

        {/* Player Transport Controls Bar */}
        <div className="p-4 bg-board border-t border-panelLine flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          {/* Play / Step Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-3.5 py-1.5 rounded bg-signal text-board font-bold hover:bg-signal/80 transition-colors flex items-center gap-1.5 text-xs"
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>

            <button
              onClick={() => stepFrame(-1)}
              className="px-2.5 py-1.5 rounded bg-panel border border-panelLine text-inkDim hover:text-ink hover:border-signal transition-colors text-[11px]"
              title="Step Back 1 Frame"
            >
              ◀ 1 Frame
            </button>
            <button
              onClick={() => stepFrame(1)}
              className="px-2.5 py-1.5 rounded bg-panel border border-panelLine text-inkDim hover:text-ink hover:border-signal transition-colors text-[11px]"
              title="Step Forward 1 Frame"
            >
              1 Frame ▶
            </button>
          </div>

          {/* Frame Progress Counter */}
          <div className="flex items-center gap-3 text-inkDim text-xs">
            <span>
              Frame: <strong className="text-ink">{shot.completed_frames}</strong> / {shot.total_frames}
            </span>
            <span className="text-panelLine">|</span>
            <span>
              Node: <strong className="text-ink">{shot.compute_node}</strong>
            </span>
            <span className="text-panelLine">|</span>
            <span className="text-signal uppercase">{shot.stage_label}</span>
          </div>

          {/* Direct Incident Link */}
          {onInspectService && (
            <button
              onClick={() => {
                onClose();
                onInspectService(shot.service);
              }}
              className="font-mono text-[11px] uppercase tracking-wider text-signal hover:underline"
            >
              Analyze {shot.service} Pipeline →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
