/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // brand trio, constant across modes (components consume the
        // semantic tokens below; never raw hex in components)
        field: "#042f2e",
        paper: "#fff3ce",
        signal: "#5ce7ff",
        // semantic tokens, resolved per mode in src/index.css
        ground: "var(--ground)",
        surface: "var(--surface)",
        ink: {
          DEFAULT: "var(--ink)",
          70: "var(--ink-70)",
          60: "var(--ink-60)",
          40: "var(--ink-40)",
          25: "var(--ink-25)",
          10: "var(--ink-10)",
        },
        "signal-ink": "var(--signal-ink)",
        error: "var(--error)",
        "on-accent": "#042f2e",
      },
      fontFamily: {
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SF Mono",
          "Cascadia Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        panel: "10px",
        control: "8px",
        chip: "6px",
      },
      boxShadow: {
        pop: "0 10px 30px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};
