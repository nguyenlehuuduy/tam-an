"use client";

import { ReactNode, useMemo } from "react";

interface SkyCanvasProps {
  children?: ReactNode;
  className?: string;
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

export function SkyCanvas({ children, className }: SkyCanvasProps) {
  const stars = useBackgroundStars(120);
  const shootingStars = useShootingStars(6);
  const milkyWayStars = useMilkyWayStars(80);

  return (
    <div className={`relative min-h-dvh w-full overflow-hidden bg-sky-gradient ${className ?? ""}`}>

      {/* ===== MILKY WAY BAND ===== */}
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
            opacity: 0.3 + ((s.id * 317) % 40) / 100,
            background: "#d8e0ff",
            animationName: "twinkle",
            animationDuration: `${3 + s.delay}s`,
            animationDelay: `${s.delay}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        />
      ))}

      {/* ===== NEBULA LAYERS ===== */}
      {/* Nebula 1 — Top center (Blue-Violet, dense) */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[500px] w-[140%] rounded-full blur-3xl animate-nebula-drift"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(124,158,255,0.12) 0%, rgba(58,46,92,0.18) 35%, rgba(11,16,38,0.08) 65%, transparent 80%)",
        }}
      />
      {/* Nebula 2 — Bottom right (Deep purple) */}
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 60% 60%, rgba(179,136,255,0.14) 0%, rgba(58,46,92,0.1) 45%, transparent 70%)",
          animation: "nebula-drift 28s ease-in-out infinite reverse",
          animationDelay: "-8s",
        }}
      />
      {/* Nebula 3 — Top left (Gold tint) */}
      <div
        className="pointer-events-none absolute -top-16 -left-20 h-80 w-80 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(245,214,125,0.09) 0%, transparent 65%)",
          animation: "nebula-drift 35s ease-in-out infinite",
          animationDelay: "-14s",
        }}
      />
      {/* Nebula 4 — Mid-screen (teal-violet deep) */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(100,80,200,0.06) 0%, transparent 70%)",
          animation: "nebula-drift 22s ease-in-out infinite",
          animationDelay: "-5s",
        }}
      />

      {/* ===== AURORA BANDS ===== */}
      <div
        className="pointer-events-none absolute -left-1/4 top-8 h-40 w-[150%] animate-drift-x rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "linear-gradient(90deg, transparent, #7C9EFF 25%, #5A3A8A 55%, #3A2E5C 75%, transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-1/4 -bottom-16 h-52 w-[160%] opacity-15 blur-3xl"
        style={{
          background:
            "linear-gradient(90deg, transparent, #B388FF 35%, #3A2E5C 60%, #1e1333 80%, transparent)",
          animation: "drift-x 120s ease-in-out infinite reverse",
        }}
      />

      {/* ===== MAIN STAR FIELD (multi-color) ===== */}
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

      {/* ===== SHOOTING STARS ===== */}
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

      <div className="relative z-10">{children}</div>
    </div>
  );
}
