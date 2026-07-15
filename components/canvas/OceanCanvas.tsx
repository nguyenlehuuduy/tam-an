"use client";

import { ReactNode, useMemo } from "react";
import { motion, useTransform, useMotionValue } from "framer-motion";

interface OceanCanvasProps {
  children?: ReactNode;
  className?: string;
  mouseX?: any;
  mouseY?: any;
}

interface DecoBubble {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface Plankton {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  hue: number; // màu xanh biến đổi (150–195 hsl)
}

interface DeepGlow {
  id: number;
  top: number;
  left: number;
  size: number;
  color: string;
  delay: number;
}

function useDecoBubbles(count: number): DecoBubble[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: ((i * 7919) % 10000) / 100,
        size: 3 + ((i * 3571) % 100) / 12,
        delay: ((i * 2311) % 100) / 17,
        duration: 8 + ((i * 1777) % 100) / 17,
        opacity: 0.3 + ((i * 4127) % 100) / 200,
      })),
    [count]
  );
}

function usePlankton(count: number): Plankton[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: ((i * 1234567) % 10000) / 100,
        left: ((i * 7654321) % 10000) / 100,
        size: 1.5 + ((i * 9871) % 100) / 55,
        delay: ((i * 3141) % 100) / 25,
        duration: 3.5 + ((i * 5927) % 100) / 27,
        hue: 160 + ((i * 2718) % 35), // 160–195: từ teal sang xanh cyan
      })),
    [count]
  );
}

function useDeepGlows(count: number): DeepGlow[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const colors = [
          "rgba(79,209,197,0.08)",
          "rgba(100,180,255,0.06)",
          "rgba(0,229,255,0.05)",
          "rgba(63,163,185,0.07)",
        ];
        return {
          id: i,
          top: 20 + ((i * 3717) % 65),
          left: ((i * 8191) % 85),
          size: 150 + ((i * 2333) % 250),
          color: colors[i % colors.length],
          delay: ((i * 4441) % 100) / 10,
        };
      }),
    [count]
  );
}

export function OceanCanvas({ children, className, mouseX, mouseY }: OceanCanvasProps) {
  const bubbles = useDecoBubbles(28);
  const plankton = usePlankton(40);
  const deepGlows = useDeepGlows(5);

  const fallbackValue = useMotionValue(0);
  const mX = mouseX || fallbackValue;
  const mY = mouseY || fallbackValue;

  // Parallax offsets: layers further back move slower
  const glowsX = useTransform(mX, (v: number) => v * 0.04);
  const glowsY = useTransform(mY, (v: number) => v * 0.04);

  const lightX = useTransform(mX, (v: number) => v * 0.08);
  const lightY = useTransform(mY, (v: number) => v * 0.08);

  const planktonX = useTransform(mX, (v: number) => v * 0.16);
  const planktonY = useTransform(mY, (v: number) => v * 0.16);

  const bubblesX = useTransform(mX, (v: number) => v * 0.26);
  const bubblesY = useTransform(mY, (v: number) => v * 0.26);

  return (
    <div
      className={`relative min-h-dvh w-full overflow-hidden ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(180deg, #031020 0%, #041828 25%, #051F35 50%, #03121E 80%, #020A12 100%)",
      }}
    >
      {/* ===== DEEP OCEAN BIOLUMINESCENCE GLOWS ===== */}
      <motion.div style={{ x: glowsX, y: glowsY }} className="absolute inset-0 pointer-events-none">
        {deepGlows.map((g) => (
          <div
            key={g.id}
            className="pointer-events-none absolute rounded-full blur-3xl"
            style={{
              top: `${g.top}%`,
              left: `${g.left}%`,
              width: g.size,
              height: g.size,
              background: `radial-gradient(circle, ${g.color} 0%, transparent 70%)`,
              animation: `nebula-drift ${18 + g.delay * 2}s ease-in-out infinite`,
              animationDelay: `${-g.delay}s`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </motion.div>

      {/* ===== CAUSTIC LIGHT PATTERNS (underwater sun rays) & WAVES ===== */}
      <motion.div style={{ x: lightX, y: lightY }} className="absolute inset-0 pointer-events-none">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                108deg,
                transparent 0px,
                transparent 60px,
                rgba(79, 209, 197, 0.015) 60px,
                rgba(79, 209, 197, 0.015) 62px
              )
            `,
            animation: "drift-x 40s ease-in-out infinite",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                95deg,
                transparent 0px,
                transparent 80px,
                rgba(100, 180, 255, 0.012) 80px,
                rgba(100, 180, 255, 0.012) 82px
              )
            `,
            animation: "drift-x 55s ease-in-out infinite reverse",
          }}
        />

        {/* ===== SURFACE SHIMMER (top glow) ===== */}
        <div
          className="pointer-events-none absolute top-0 inset-x-0 h-40 blur-2xl opacity-20"
          style={{
            background:
              "linear-gradient(180deg, rgba(79,209,197,0.3) 0%, rgba(14,77,92,0.15) 60%, transparent 100%)",
          }}
        />

        {/* ===== WAVE LAYERS ===== */}
        <svg
          className="pointer-events-none absolute inset-x-0 top-0 h-36 w-full opacity-20 animate-drift-x"
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
        >
          <path d="M0,35 C110,75 290,5 400,35 L400,0 L0,0 Z" fill="#4FD1C5" />
        </svg>
        <svg
          className="pointer-events-none absolute inset-x-0 top-8 h-36 w-full opacity-10"
          style={{ animation: "drift-x 90s ease-in-out infinite reverse" }}
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
        >
          <path d="M0,45 C130,5 270,75 400,45 L400,0 L0,0 Z" fill="#B8E9E0" />
        </svg>
      </motion.div>

      {/* ===== DEPTH FOG LAYERS ===== */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 blur-2xl opacity-30"
        style={{
          background:
            "linear-gradient(0deg, rgba(2,8,16,0.9) 0%, rgba(3,18,30,0.5) 60%, transparent 100%)",
        }}
      />

      {/* ===== DECORATIVE BUBBLES ===== */}
      <motion.div style={{ x: bubblesX, y: bubblesY }} className="absolute inset-0 pointer-events-none">
        {bubbles.map((b) => (
          <span
            key={b.id}
            className="pointer-events-none absolute bottom-0 animate-rise-fade rounded-full"
            style={{
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              opacity: b.opacity,
              background: "radial-gradient(circle at 35% 30%, rgba(184,233,224,0.6) 0%, rgba(79,209,197,0.1) 60%, transparent 100%)",
              border: "1px solid rgba(184,233,224,0.35)",
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
              // Inner highlight
              boxShadow: "inset 0 0 4px rgba(255,255,255,0.3), 0 0 8px rgba(79,209,197,0.2)",
            }}
          />
        ))}
      </motion.div>

      {/* ===== BIOLUMINESCENT PLANKTON (multi-hue) ===== */}
      <motion.div style={{ x: planktonX, y: planktonY }} className="absolute inset-0 pointer-events-none">
        {plankton.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: `hsl(${p.hue}, 70%, 65%)`,
              animationName: "twinkle",
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              boxShadow: `0 0 ${p.size * 4}px ${p.size}px hsla(${p.hue}, 70%, 65%, 0.4)`,
            }}
          />
        ))}
      </motion.div>

      {/* ===== MYSTERIOUS DEEP SILHOUETTES ===== */}
      {/* Subtle dark shapes suggesting deep-sea life */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 w-32 h-40 opacity-8 blur-sm"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(2,10,20,0.6) 0%, transparent 70%)",
          transform: "scaleX(0.5)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/3 w-24 h-32 opacity-8 blur-sm"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(2,10,20,0.5) 0%, transparent 70%)",
          transform: "scaleX(0.4)",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
