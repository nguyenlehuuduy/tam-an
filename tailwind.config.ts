import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Sky theme (A4.1) ---
        sky: {
          navy: "#0B1026",
          indigo: "#1B2A4A",
          violet: "#3A2E5C",
          aurora: "#7C9EFF",
          gold: "#F5D67D",
          glow: "#FFF3D0",
        },
        // --- Ocean theme (A4.2) ---
        ocean: {
          deep: "#072034",
          teal: "#0E4D5C",
          aqua: "#4FD1C5",
          bubble: "#E8FBFF",
          foam: "#B8E9E0",
        },
        // --- User Persona Vibes ---
        vibe: {
          cozy: "#FFB4A2",    // Ấm áp hồng san hô
          dreamy: "#B388FF",  // Mộng mơ tím oải hương
          cyber: "#00E5FF",   // Hiện đại xanh neon
          lofi: "#FF8A80",    // Bình yên cam hoàng hôn
        },
        // --- Neutral / UI base (A4.3) ---
        base: {
          bg: "#060A13",
          surface: "#101626",
          "text-primary": "#F5F6FA",
          "text-secondary": "#A8B0C3",
          divider: "#1E2638",
        },
        // --- Semantic (A4.4) ---
        warm: "#FFB4A2",
        success: "#8FD8B8",
        caution: "#E8C468",
        critical: "#E76F6F",
        // --- Gen Z neon accents ---
        neon: {
          pink: "#FF6EFF",
          blue: "#4FC3F7",
          green: "#69FF97",
          purple: "#B388FF",
          gold: "#FFD700",
        },
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["'Nunito'", "ui-sans-serif", "system-ui", "sans-serif"],
        caption: ["'Nunito'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        sheet: "28px",
      },
      spacing: {
        "4.5": "18px",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.85)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(2deg)" },
        },
        "drift-x": {
          "0%": { transform: "translateX(-3%)" },
          "50%": { transform: "translateX(3%)" },
          "100%": { transform: "translateX(-3%)" },
        },
        "rise-fade": {
          "0%": { transform: "translateY(0) scale(0.9)", opacity: "0" },
          "12%": { opacity: "0.7" },
          "100%": { transform: "translateY(-160px) scale(1.1)", opacity: "0" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.5", transform: "scale(0.95)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        "shooting-star": {
          "0%": { transform: "translate(0,0)", opacity: "0" },
          "6%": { opacity: "1" },
          "24%": { transform: "translate(-280px, 180px)", opacity: "0" },
          "100%": { transform: "translate(-280px, 180px)", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(124, 158, 255, 0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(124, 158, 255, 0.45)" },
        },
        // --- New Gen Z animations ---
        "slide-up": {
          "0%": { transform: "translateY(32px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-up-sm": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in-blur": {
          "0%": { opacity: "0", filter: "blur(12px)" },
          "100%": { opacity: "1", filter: "blur(0px)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        "ripple": {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "star-burst": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "1" },
          "60%": { transform: "scale(1.4) rotate(180deg)", opacity: "0.8" },
          "100%": { transform: "scale(2) rotate(360deg)", opacity: "0" },
        },
        "nebula-drift": {
          "0%, 100%": { transform: "translate(-2%, -2%) scale(1)", opacity: "0.15" },
          "33%": { transform: "translate(2%, 1%) scale(1.05)", opacity: "0.22" },
          "66%": { transform: "translate(-1%, 2%) scale(0.97)", opacity: "0.18" },
        },
        "orb-float": {
          "0%, 100%": { transform: "translateY(0) scale(1)", boxShadow: "0 0 30px 8px rgba(245,214,125,0.4)" },
          "50%": { transform: "translateY(-10px) scale(1.04)", boxShadow: "0 0 50px 14px rgba(245,214,125,0.65)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "letter-pop": {
          "0%": { transform: "scale(0.5) translateY(12px)", opacity: "0" },
          "70%": { transform: "scale(1.1) translateY(-2px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
      },
      animation: {
        twinkle: "twinkle 4.5s ease-in-out infinite",
        float: "float 6.5s ease-in-out infinite",
        "drift-x": "drift-x 80s ease-in-out infinite",
        "rise-fade": "rise-fade 9s ease-in infinite",
        breathe: "breathe 2.4s ease-in-out infinite",
        "shooting-star": "shooting-star 7s ease-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        // New Gen Z
        "slide-up": "slide-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up-sm": "slide-up-sm 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in-blur": "fade-in-blur 0.8s ease-out both",
        "fade-in": "fade-in 0.5s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "scale-in": "scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "ripple": "ripple 0.7s ease-out forwards",
        "star-burst": "star-burst 0.6s ease-out forwards",
        "nebula-drift": "nebula-drift 20s ease-in-out infinite",
        "orb-float": "orb-float 4s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.2s ease-out infinite",
        "letter-pop": "letter-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      transitionTimingFunction: {
        "gentle-float": "cubic-bezier(0.22, 1, 0.36, 1)",
        sheet: "cubic-bezier(0.32, 0.72, 0, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};

export default config;
