import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Sentinel — Production Control Room",
  description: "Autonomous AI production control room for studio infrastructure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-display min-h-screen bg-board text-ink scanline">
        <header className="border-b border-panelLine">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-signal pulse-signal" />
              <span className="font-mono text-xs tracking-[0.25em] text-inkDim">
                STUDIO SENTINEL
              </span>
            </div>
            <span className="font-mono text-[11px] text-inkDim tracking-widest">
              PRODUCTION CONTROL ROOM
            </span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
