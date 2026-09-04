import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Sentinel — Autonomous AI Hollywood Production Control Room",
  description:
    "Autonomous multi-agent system powered by Gemini & Grafana Cloud guarding media pipelines across Ingest, Transcoding, VFX Rendering, and Worldwide Distribution.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-display min-h-screen bg-board text-ink scanline antialiased selection:bg-signal selection:text-board">
        <header className="border-b border-panelLine/80 bg-board/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="w-2.5 h-2.5 rounded-full bg-signal pulse-signal shadow-[0_0_10px_#FF6A2B]" />
              <div className="flex flex-col">
                <span className="font-mono text-sm tracking-[0.25em] text-ink font-bold group-hover:text-signal transition-colors">
                  STUDIO SENTINEL
                </span>
                <span className="font-mono text-[10px] text-inkDim tracking-widest uppercase">
                  Hollywood Production Control Room
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-inkDim bg-panel px-3 py-1.5 rounded border border-panelLine">
                <span className="text-signal">★</span>
                <span>Google Cloud Agentic Cinema • Grafana Track</span>
              </div>

              <a
                href="https://jumborafter1646.grafana.net/"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] border border-panelLine bg-panel/80 hover:border-signal/50 text-inkDim hover:text-signal px-3 py-1.5 rounded transition-colors"
              >
                Grafana Cloud ↗
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>

        <footer className="border-t border-panelLine/60 bg-board/60 mt-16 py-6 text-center">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-inkDim">
            <div>
              STUDIO SENTINEL — Autonomous Multi-Agent Media Pipeline Control Room
            </div>
            <div>
              Powered by <span className="text-ink">Google Gemini Enterprise</span>,{" "}
              <span className="text-ink">Google ADK</span> &{" "}
              <span className="text-ink">Grafana Cloud MCP</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
