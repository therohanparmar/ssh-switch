import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        slate: "#112033",
        mist: "#d7e6f5",
        ember: "#f97316",
        mint: "#49dcb1",
        gold: "#f6c453"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(6, 18, 32, 0.22)"
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"]
      },
      animation: {
        floatIn: "floatIn 500ms ease-out forwards",
        pulseGlow: "pulseGlow 2.6s ease-in-out infinite"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(73, 220, 177, 0)" },
          "50%": { boxShadow: "0 0 36px rgba(73, 220, 177, 0.18)" }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
