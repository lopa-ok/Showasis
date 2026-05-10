import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        departure: ["var(--font-departure)", "ui-monospace", "SFMono-Regular", "SF Mono Regular", "SF Mono", "Menlo", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
      colors: {
        surface: "var(--surface)",
        surfaceStrong: "var(--surface-strong)",
        panel: "var(--panel)",
        panelStrong: "var(--panel-strong)",
        border: "var(--border)",
        textPrimary: "var(--text-primary)",
        textMuted: "var(--text-muted)",
        accent: "var(--accent)",
        accentStrong: "var(--accent-strong)",
        warning: "var(--warning)",
        glow: "var(--glow)",
        buffer: "var(--buffer)",
      },
      boxShadow: {
        "panel-soft": "var(--shadow-soft)",
        "panel-strong": "var(--shadow-strong)",
        glow: "var(--shadow-glow)",
      },
      backgroundImage: {
        "ambient-radial": "radial-gradient(circle at top, rgba(252, 138, 88, 0.18), transparent 55%), radial-gradient(circle at 30% 30%, rgba(252, 171, 85, 0.12), transparent 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
