/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        board: "#0B0D10",       // control-room near-black
        panel: "#14171C",
        panelLine: "#23272E",
        signal: "#FF6A2B",      // tally-light amber-orange — the one accent
        signalDim: "#7A3A1A",
        ok: "#3DDC97",
        warn: "#F5C542",
        crit: "#FF4D4D",
        ink: "#E7E9EC",
        inkDim: "#8A909B",
      },
      fontFamily: {
        display: ["'IBM Plex Sans Condensed'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
