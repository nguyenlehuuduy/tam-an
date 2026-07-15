"use client";

import { motion, useTransform } from "framer-motion";
import { useMemo } from "react";
import { Signal } from "@/lib/mockSignals";

interface ExploreMiniMapProps {
  dragX: any; // MotionValue<number>
  dragY: any; // MotionValue<number>
  signals: Signal[];
  isSky: boolean;
  /** Width of the full draggable canvas (px) */
  canvasW: number;
  /** Height of the full draggable canvas (px) */
  canvasH: number;
  /** Width of the viewport (px) */
  viewW: number;
  /** Height of the viewport (px) */
  viewH: number;
  onTeleport?: (x: number, y: number) => void;
}

const MAP_W = 140;
const MAP_H = 120;

export function ExploreMiniMap({
  dragX,
  dragY,
  signals,
  isSky,
  canvasW,
  canvasH,
  viewW,
  viewH,
  onTeleport,
}: ExploreMiniMapProps) {
  const accentColor = isSky ? "#7C9EFF" : "#4FD1C5";
  const accentGlow = isSky ? "rgba(124,158,255,0.5)" : "rgba(79,209,197,0.5)";
  const dotColor = isSky ? "#F5D67D" : "#4FD1C5";

  // Viewport indicator: width/height as fraction of canvas
  const vpW = (viewW / canvasW) * MAP_W;
  const vpH = (viewH / canvasH) * MAP_H;

  // Viewport position: dragX moves canvas left = viewport moves right
  const vpX = useTransform(dragX, (v: number) => {
    const frac = (-v) / canvasW;
    return Math.max(0, Math.min(MAP_W - vpW, frac * MAP_W));
  });
  const vpY = useTransform(dragY, (v: number) => {
    const frac = (-v) / canvasH;
    return Math.max(0, Math.min(MAP_H - vpH, frac * MAP_H));
  });

  // Deduplicate signals (same position might be ambiguous)
  const dots = useMemo(() => {
    return signals.map((s) => ({
      id: s.id,
      mx: (s.x / 100) * MAP_W,
      my: (s.y / 100) * MAP_H,
      warmth: s.warmth,
    }));
  }, [signals]);

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onTeleport) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left; // click position on map
    const cy = e.clientY - rect.top;
    // Convert to canvas coords: center viewport on click point
    const targetCanvasX = (cx / MAP_W) * canvasW;
    const targetCanvasY = (cy / MAP_H) * canvasH;
    // dragX = -(targetCanvasX - viewW/2), but centered
    const newDragX = -(targetCanvasX - viewW / 2);
    const newDragY = -(targetCanvasY - viewH / 2);
    onTeleport(newDragX, newDragY);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.8, type: "spring", stiffness: 280, damping: 25 }}
      className="relative overflow-hidden rounded-2xl select-none"
      style={{
        width: MAP_W,
        height: MAP_H,
        background: isSky
          ? "linear-gradient(135deg, rgba(6,10,19,0.92) 0%, rgba(20,25,55,0.88) 100%)"
          : "linear-gradient(135deg, rgba(3,16,32,0.92) 0%, rgba(5,30,50,0.88) 100%)",
        border: `1px solid ${accentColor}33`,
        boxShadow: `0 0 20px ${accentGlow.replace("0.5", "0.15")}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: "blur(12px)",
        cursor: "crosshair",
      }}
      onClick={handleMapClick}
    >
      {/* === RADAR GRID LINES === */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={MAP_W}
        height={MAP_H}
        style={{ opacity: 0.18 }}
      >
        {/* Horizontal grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={`h${f}`}
            x1={0}
            y1={f * MAP_H}
            x2={MAP_W}
            y2={f * MAP_H}
            stroke={accentColor}
            strokeWidth={0.5}
            strokeDasharray="2,3"
          />
        ))}
        {/* Vertical grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={`v${f}`}
            x1={f * MAP_W}
            y1={0}
            x2={f * MAP_W}
            y2={MAP_H}
            stroke={accentColor}
            strokeWidth={0.5}
            strokeDasharray="2,3"
          />
        ))}
        {/* Center cross */}
        <line x1={MAP_W / 2} y1={MAP_H / 2 - 5} x2={MAP_W / 2} y2={MAP_H / 2 + 5} stroke={accentColor} strokeWidth={0.7} opacity={0.5} />
        <line x1={MAP_W / 2 - 5} y1={MAP_H / 2} x2={MAP_W / 2 + 5} y2={MAP_H / 2} stroke={accentColor} strokeWidth={0.7} opacity={0.5} />
      </svg>

      {/* === RADAR SWEEP ANIMATION === */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
        style={{ opacity: 0.06 }}
      >
        <motion.div
          className="absolute top-0 left-1/2 origin-bottom"
          style={{
            width: "50%",
            height: "50%",
            bottom: "50%",
            transformOrigin: "50% 100%",
            background: `linear-gradient(135deg, transparent 30%, ${accentColor}99 100%)`,
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* === CORNER LABELS === */}
      <div
        className="absolute top-1 left-1.5 text-[7px] font-mono pointer-events-none"
        style={{ color: accentColor, opacity: 0.5 }}
      >
        {isSky ? "SKY" : "SEA"}
      </div>
      <div
        className="absolute top-1 right-1.5 text-[7px] font-mono pointer-events-none"
        style={{ color: accentColor, opacity: 0.5 }}
      >
        MAP
      </div>

      {/* === SIGNAL DOTS === */}
      {dots.map((dot) => {
        const glowSize = dot.warmth === "many" ? 4 : dot.warmth === "some" ? 2.5 : 1.5;
        const dotSize = dot.warmth === "many" ? 4 : dot.warmth === "some" ? 3 : 2;
        return (
          <div
            key={dot.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: dot.mx - dotSize / 2,
              top: dot.my - dotSize / 2,
              width: dotSize,
              height: dotSize,
              background: dotColor,
              boxShadow: `0 0 ${glowSize}px ${dotSize}px ${dotColor}88`,
            }}
          />
        );
      })}

      {/* === VIEWPORT INDICATOR (draggable rect) === */}
      <motion.div
        className="absolute pointer-events-none rounded-sm"
        style={{
          x: vpX,
          y: vpY,
          width: vpW,
          height: vpH,
          border: `1px solid ${accentColor}`,
          background: `${accentColor}10`,
          boxShadow: `0 0 6px ${accentGlow.replace("0.5", "0.3")}`,
        }}
      />

      {/* === BOTTOM LABEL === */}
      <div
        className="absolute bottom-1 left-0 right-0 text-center text-[7px] font-mono pointer-events-none"
        style={{ color: accentColor, opacity: 0.4 }}
      >
        {signals.length} {isSky ? "sao" : "bong"}
      </div>
    </motion.div>
  );
}
