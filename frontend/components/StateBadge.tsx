const STYLES: Record<string, string> = {
  DETECTED: "text-inkDim border-panelLine",
  INVESTIGATING: "text-warn border-warn/40",
  AWAITING_APPROVAL: "text-signal border-signal/40",
  REMEDIATING: "text-warn border-warn/40",
  RESOLVED: "text-ok border-ok/40",
  REJECTED: "text-inkDim border-panelLine",
};

export default function StateBadge({ state }: { state: string }) {
  return (
    <span
      className={`font-mono text-[11px] tracking-widest border px-2 py-1 rounded-sm ${
        STYLES[state] || "text-inkDim border-panelLine"
      }`}
    >
      {state.replace("_", " ")}
    </span>
  );
}
