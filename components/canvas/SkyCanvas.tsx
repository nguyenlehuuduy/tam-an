"use client";

import { ReactNode, useMemo } from "react";
import { motion, useTransform, useMotionValue } from "framer-motion";

interface SkyCanvasProps {
  children?: ReactNode;
  className?: string;
  mouseX?: any;
  mouseY?: any;
}

interface BgStar {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  colorClass: "gold" | "blue" | "white" | "purple";
  isBright: boolean;
}

// Màu sao đa dạng như dải ngân hà thật
const STAR_COLORS = {
  gold: "#F5D67D",
  blue: "#A8C8FF",
  white: "#FFFFFF",
  purple: "#D0AAFF",
};

function useBackgroundStars(count: number): BgStar[] {
  return useMemo(() => {
    const rand = (seed: number, max: number) => ((seed * 2654435761) >>> 0) % max;
    return Array.from({ length: count }, (_, i) => {
      const colorRoll = rand(i * 7 + 3, 10);
      const colorClass =
        colorRoll < 5 ? "white" : colorRoll < 7 ? "gold" : colorRoll < 9 ? "blue" : "purple";
      return {
        id: i,
        top: ((i * 1234567) % 10000) / 100,
        left: ((i * 7654321) % 10000) / 100,
        size: 1 + (((i * 9871) % 100) / 100) * 2.5,
        delay: ((i * 3141) % 100) / 20,
        duration: 2.5 + ((i * 5927) % 100) / 25,
        opacity: 0.25 + ((i * 2718) % 100) / 135,
        colorClass,
        isBright: rand(i * 11 + 1, 10) > 8, // ~20% sao sáng đặc biệt
      };
    });
  }, [count]);
}

interface ShootingStar {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  angle: number;
  length: number;
}

function useShootingStars(count: number): ShootingStar[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: 5 + ((i * 1777) % 50),
        left: 5 + ((i * 3333) % 70),
        delay: i * 4.5 + ((i * 999) % 30) / 10,
        duration: 5 + ((i * 2221) % 40) / 10,
        angle: -40 + ((i * 1111) % 30),
        length: 80 + ((i * 4567) % 120),
      })),
    [count]
  );
}

// Milky Way cluster stars — dense band
interface MilkyWayStar {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
}

function useMilkyWayStars(count: number): MilkyWayStar[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        // Phân bố trong dải chéo 125deg — tạo dải ngân hà
        top: 15 + ((i * 1117) % 60) + (Math.sin(i * 0.3) * 15),
        left: ((i * 9473) % 100),
        size: 0.8 + ((i * 4321) % 100) / 100,
        delay: ((i * 7171) % 100) / 20,
      })),
    [count]
  );
}

export function SkyCanvas({ children, className, mouseX, mouseY }: SkyCanvasProps) {
  const stars = useBackgroundStars(120);
  const shootingStars = useShootingStars(6);
  const milkyWayStars = useMilkyWayStars(80);

  const fallbackValue = useMotionValue(0);
  const mX = mouseX || fallbackValue;
  const mY = mouseY || fallbackValue;

  // Parallax offsets: layers further back move slower
  const nebulaX = useTransform(mX, (v: number) => v * 0.05);
  const nebulaY = useTransform(mY, (v: number) => v * 0.05);

  const milkyWayX = useTransform(mX, (v: number) => v * 0.12);
  const milkyWayY = useTransform(mY, (v: number) => v * 0.12);

  const starFieldX = useTransform(mX, (v: number) => v * 0.22);
  const starFieldY = useTransform(mY, (v: number) => v * 0.22);

  const shootingStarX = useTransform(mX, (v: number) => v * 0.18);
  const shootingStarY = useTransform(mY, (v: number) => v * 0.18);

  return (
    <div className={`relative min-h-dvh w-full overflow-hidden bg-sky-gradient ${className ?? ""}`}>

      {/* ===== MILKY WAY BAND ===== */}
      <motion.div style={{ x: milkyWayX, y: milkyWayY }} className="absolute inset-0 pointer-events-none">
        {/* Lớp sương mờ dải ngân hà */}
        <div
          className="pointer-events-none absolute inset-0 milky-way-band"
          style={{ opacity: 0.8 }}
        />
        {/* Dải ngân hà đậm ở trung tâm */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: "10%",
            left: "-10%",
            width: "120%",
            height: "55%",
            background:
              "linear-gradient(125deg, transparent 0%, rgba(180,190,255,0.03) 15%, rgba(210,200,255,0.055) 30%, rgba(255,240,200,0.04) 45%, rgba(200,215,255,0.06) 60%, rgba(180,190,255,0.03) 75%, transparent 100%)",
            filter: "blur(4px)",
            transform: "rotate(-5deg)",
          }}
        />
        {/* Sao nhỏ dày đặc trong dải ngân hà */}
        {milkyWayStars.map((s) => (
          <span
            key={`mw-${s.id}`}
            className="pointer-events-none absolute rounded-full"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              opacity: 0.4 + ((s.id * 317) % 50) / 100,
              background: ((s.id % 3) === 0) ? "#b8c9ff" : ((s.id % 5) === 0) ? "#fcd34d" : "#d8e0ff",
              animationName: "twinkle",
              animationDuration: `${3 + s.delay}s`,
              animationDelay: `${s.delay}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
            }}
          />
        ))}
      </motion.div>

      {/* ===== NEBULA LAYERS ===== */}
      <motion.div style={{ x: nebulaX, y: nebulaY }} className="absolute inset-0 pointer-events-none">
        {/* Nebula 1 — Top center (Deep Purple & Blue, dense) */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[600px] w-[150%] rounded-full blur-[100px] animate-nebula-drift"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(138,43,226,0.15) 0%, rgba(75,0,130,0.2) 35%, rgba(11,16,38,0.1) 65%, transparent 80%)",
          }}
        />
        {/* Nebula 2 — Bottom right (Mysterious Magenta/Pink) */}
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full blur-[90px]"
          style={{
            background:
              "radial-gradient(circle at 60% 60%, rgba(255,0,255,0.08) 0%, rgba(75,0,130,0.12) 45%, transparent 70%)",
            animation: "nebula-drift 30s ease-in-out infinite reverse",
            animationDelay: "-8s",
          }}
        />
        {/* Nebula 3 — Top left (Gold/Cyan tint for contrast) */}
        <div
          className="pointer-events-none absolute -top-16 -left-20 h-96 w-96 rounded-full blur-[80px]"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, rgba(0,255,255,0.06) 0%, rgba(245,214,125,0.05) 40%, transparent 70%)",
            animation: "nebula-drift 40s ease-in-out infinite",
            animationDelay: "-14s",
          }}
        />
        {/* Nebula 4 — Mid-screen (Deep cosmic blue) */}
        <div
          className="pointer-events-none absolute top-1/3 left-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(0,100,255,0.07) 0%, rgba(50,0,150,0.05) 40%, transparent 75%)",
            animation: "nebula-drift 25s ease-in-out infinite",
            animationDelay: "-5s",
          }}
        />
      </motion.div>

      {/* ===== AURORA BANDS ===== */}
      <div
        className="pointer-events-none absolute -left-1/4 top-1/4 h-64 w-[150%] animate-drift-x rounded-full opacity-30 blur-[90px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(124,158,255,0.4) 25%, rgba(138,43,226,0.3) 55%, rgba(58,46,92,0.4) 75%, transparent)",
          transform: "rotate(-15deg)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-1/4 bottom-1/4 h-80 w-[160%] opacity-25 blur-[100px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,0,255,0.2) 35%, rgba(75,0,130,0.3) 60%, rgba(30,19,51,0.5) 80%, transparent)",
          animation: "drift-x 150s ease-in-out infinite reverse",
          transform: "rotate(10deg)",
        }}
      />

      {/* ===== MAIN STAR FIELD (multi-color) ===== */}
      <motion.div style={{ x: starFieldX, y: starFieldY }} className="absolute inset-0 pointer-events-none">
        {stars.map((s) => (
          <span
            key={s.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.isBright ? s.size * 1.8 : s.size,
              height: s.isBright ? s.size * 1.8 : s.size,
              opacity: s.opacity,
              background: STAR_COLORS[s.colorClass],
              animationName: "twinkle",
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              boxShadow: s.isBright
                ? `0 0 ${s.size * 5}px ${s.size * 1.5}px ${STAR_COLORS[s.colorClass]}55`
                : "none",
            }}
          />
        ))}
      </motion.div>

      {/* ===== SHOOTING STARS ===== */}
      <motion.div style={{ x: shootingStarX, y: shootingStarY }} className="absolute inset-0 pointer-events-none">
        {shootingStars.map((ss) => (
          <span
            key={ss.id}
            className="pointer-events-none absolute"
            style={{
              top: `${ss.top}%`,
              left: `${ss.left}%`,
              width: ss.length,
              height: 1.5,
              transform: `rotate(${ss.angle}deg)`,
              background: "linear-gradient(to left, #FFF9D0, #F5D67D88, transparent)",
              animationName: "shooting-star",
              animationDuration: `${ss.duration}s`,
              animationDelay: `${ss.delay}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
              opacity: 0,
              borderRadius: 2,
            }}
          />
        ))}
      </motion.div>

      {/* ===== VIBE ATMOSPHERE TINT =====
          Changes color per Vibe via CSS variable --vibe-sky-tint
          Set by VibeSync on <html data-vibe="...">
      */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-[1200ms] ease-in-out"
        style={{ background: "radial-gradient(ellipse at 50% 40%, var(--vibe-sky-tint) 0%, transparent 70%)" }}
      />
      {/* Second tint layer — bottom glow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 transition-all duration-[1200ms] ease-in-out"
        style={{ background: "linear-gradient(0deg, var(--vibe-sky-tint) 0%, transparent 100%)" }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
