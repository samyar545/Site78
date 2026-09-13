import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-light": "var(--color-primary-light)",
        "primary-dark": "var(--color-primary-dark)",
        secondary: "var(--color-secondary)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
};

export default config;
