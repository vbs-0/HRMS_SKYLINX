import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // backward-compatible aliases (existing consoles use these) — remapped to v2 tokens
        ink: "var(--text-primary)",
        muted: "var(--text-muted)",
        brand: "var(--color-brand-600)",
        accent: "var(--viz-3)",
        // v2 scales
        "brand-50": "var(--color-brand-50)",
        "brand-100": "var(--color-brand-100)",
        "brand-300": "var(--color-brand-300)",
        "brand-500": "var(--color-brand-500)",
        "brand-600": "var(--color-brand-600)",
        "brand-700": "var(--color-brand-700)",
        "brand-900": "var(--color-brand-900)",
        canvas: "var(--surface-canvas)",
        raised: "var(--surface-raised)",
        sunken: "var(--surface-sunken)",
        "surface-hover": "var(--surface-hover)",
        selected: "var(--surface-selected)",
        line: "var(--border-default)",
        "line-subtle": "var(--border-subtle)",
        "line-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "success-fg": "var(--success-fg)", "success-bg": "var(--success-bg)", "success-border": "var(--success-border)",
        "warning-fg": "var(--warning-fg)", "warning-bg": "var(--warning-bg)", "warning-border": "var(--warning-border)",
        "danger-fg": "var(--danger-fg)", "danger-bg": "var(--danger-bg)", "danger-border": "var(--danger-border)",
        "info-fg": "var(--info-fg)", "info-bg": "var(--info-bg)", "info-border": "var(--info-border)",
      },
      borderRadius: {
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        overlay: "var(--radius-overlay)",
        pill: "9999px",
      },
      boxShadow: {
        e1: "var(--elev-1)",
        e2: "var(--elev-2)",
        e3: "var(--elev-3)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: { ease2: "var(--ease)" },
    },
  },
  plugins: [],
};

export default config;
