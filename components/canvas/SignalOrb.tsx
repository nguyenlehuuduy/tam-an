"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Story } from "@/lib/mockSignals";

interface SignalOrbProps {
  signal: Story;
  onTap: (story: Story) => void;
  isEncouraged?: boolean; // Đã nhận lời động viên có kèm tin nhắn
}

// Kích thước cơ bản — lớn hơn nhiều để rõ ràng hơn
const BASE_SIZE: Record<Story["size"], number> = { sm: 32, md: 48, lg: 66 };

/** Jitter nhỏ cho nhịp "thở" của từng orb, suy ra từ chính id câu chuyện
 * (ổn định, không đổi giữa các lần render) — để các orb cùng tier không
 * thở đồng loạt y hệt nhau theo thời gian (cảm giác máy móc), mà lệch pha
 * tự nhiên như những sinh vật sống riêng biệt. */
function breathJitter(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return (h % 1000) / 1000; // 0..1
}

// Warmth multiplier cho kích thước
const WARMTH_SCALE: Record<Story["warmth"], number> = {
  few: 1,
  some: 1.2,
  many: 1.45,
};

// Màu sắc theo warmth tier
type OrbTier = "default" | "reacted" | "encouraged";

function getOrbVisuals(signal: Story, tier: OrbTier) {
  const isStar = signal.type === "star";

  if (isStar) {
    switch (tier) {
      case "encouraged":
        return {
          bg: "radial-gradient(circle at 35% 30%, #FFFBE0 0%, #F5D67D 35%, #E8B800 65%, #9B6700 100%)",
          glowColor: "rgba(245, 214, 125, 0.85)",
          glowSize: 60,
          rings: 3,
          ringColor: "rgba(245, 214, 125, 0.3)",
          outerRingColor: "rgba(179, 136, 255, 0.2)",
          animDuration: 2.5,
          hasCorona: true,
        };
      case "reacted":
        return {
          bg: "radial-gradient(circle at 35% 30%, #FFF3C0 0%, #F5D67D 45%, #C49500 100%)",
          glowColor: "rgba(245, 214, 125, 0.6)",
          glowSize: 40,
          rings: 2,
          ringColor: "rgba(245, 214, 125, 0.25)",
          outerRingColor: "transparent",
          animDuration: 3.5,
          hasCorona: false,
        };
      default:
        return {
          bg: "radial-gradient(circle at 35% 30%, #FFF9E0 0%, #F5D67D 60%, #9B6700 100%)",
          glowColor: "rgba(245, 214, 125, 0.4)",
          glowSize: 20,
          rings: 1,
          ringColor: "rgba(245, 214, 125, 0.15)",
          outerRingColor: "transparent",
          animDuration: 4.5,
          hasCorona: false,
        };
    }
  } else {
    // Bubble
    switch (tier) {
      case "encouraged":
        return {
          bg: "radial-gradient(circle at 35% 30%, #E8FBFF 0%, #7FE4DC 35%, #4FD1C5 60%, #0A3D4A 100%)",
          glowColor: "rgba(79, 209, 197, 0.8)",
          glowSize: 55,
          rings: 3,
          ringColor: "rgba(79, 209, 197, 0.28)",
          outerRingColor: "rgba(124, 158, 255, 0.2)",
          animDuration: 3,
          hasCorona: true,
        };
      case "reacted":
        return {
          bg: "radial-gradient(circle at 35% 30%, #C5F6F2 0%, #4FD1C5 50%, #0A3D4A 100%)",
          glowColor: "rgba(79, 209, 197, 0.55)",
          glowSize: 35,
          rings: 2,
          ringColor: "rgba(79, 209, 197, 0.22)",
          outerRingColor: "transparent",
          animDuration: 4,
          hasCorona: false,
        };
      default:
        return {
          bg: "radial-gradient(circle at 35% 30%, #B8F0EC 0%, #4FD1C5 55%, #072034 100%)",
          glowColor: "rgba(79, 209, 197, 0.35)",
          glowSize: 16,
          rings: 1,
          ringColor: "rgba(79, 209, 197, 0.12)",
          outerRingColor: "transparent",
          animDuration: 5.5,
          hasCorona: false,
        };
    }
  }
}

export function SignalOrb({ signal, onTap, isEncouraged = false }: SignalOrbProps) {
  const [tapped, setTapped] = useState(false);
  const isStar = signal.type === "star";

  // Tính tier dựa trên warmth + encouraged
  const tier: OrbTier = isEncouraged
    ? "encouraged"
    : signal.warmth === "many" || signal.warmth === "some"
    ? "reacted"
    : "default";

  // Kích thước cuối cùng
  const basePx = BASE_SIZE[signal.size];
  const warmthScale = WARMTH_SCALE[signal.warmth];
  const encouragedBonus = isEncouraged ? 1.25 : 1;
  const px = Math.round(basePx * warmthScale * encouragedBonus);

  const vis = getOrbVisuals(signal, tier);

  // Container size rộng hơn để chứa rings
  const containerSize = px + 80;

  const handleTap = useCallback(() => {
    if (tapped) return;
    setTapped(true);
    setTimeout(() => {
      setTapped(false);
      onTap(signal);
    }, 280);
  }, [tapped, onTap, signal]);

  // Animation variant tuỳ tier
  const orbAnimation = isStar
    ? {
        opacity: [0.6 + (tier === "default" ? 0 : 0.2), 1, 0.6 + (tier === "default" ? 0 : 0.2)],
        scale: [0.92, 1.06, 0.92],
      }
    : {
        y: [0, -(8 + (tier === "encouraged" ? 6 : 0)), 0],
        scale: [1, 1.04, 1],
      };

  // Lệch nhẹ chu kỳ thở theo từng câu chuyện (±0.9s) để cả không gian
  // không thở "đồng bộ máy móc" — mỗi orb như một sinh mệnh riêng.
  const animDuration = vis.animDuration + (breathJitter(signal.id) - 0.5) * 1.8;

  return (
    <div
      className="absolute select-none pointer-events-auto"
      style={{
        top: `${signal.y}%`,
        left: `${signal.x}%`,
        width: containerSize,
        height: containerSize,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* === CORONA RINGS cho encouraged signals === */}
      {vis.hasCorona && (
        <>
          {/* Outer aurora ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: px + 48,
              height: px + 48,
              background: `radial-gradient(circle, ${vis.outerRingColor} 0%, transparent 70%)`,
              border: `1px solid ${vis.outerRingColor}`,
            }}
          />
          {/* Middle glow ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            style={{
              width: px + 28,
              height: px + 28,
              border: `1.5px solid ${vis.ringColor.replace("0.3", "0.5")}`,
            }}
          />
        </>
      )}

      {/* === AMBIENT PULSE RINGS === */}
      {Array.from({ length: vis.rings }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{
            duration: animDuration * 0.8,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * (animDuration * 0.28),
          }}
          style={{
            width: px + 12 + i * 10,
            height: px + 12 + i * 10,
            background: vis.ringColor,
          }}
        />
      ))}

      {/* === TAP RIPPLE === */}
      <AnimatePresence>
        {tapped && (
          <motion.div
            key="tap-ripple"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              width: px,
              height: px,
              background: vis.glowColor,
            }}
          />
        )}
      </AnimatePresence>

      {/* === MAIN ORB === */}
      <motion.div
        role="button"
        aria-label={isStar ? `Chạm để đọc ngôi sao${isEncouraged ? " (đã được khích lệ)" : ""}` : `Chạm để đọc bong bóng${isEncouraged ? " (đã được khích lệ)" : ""}`}
        onTap={() => handleTap()}
        className="orb-btn absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer pointer-events-auto"
        animate={orbAnimation}
        transition={{ duration: animDuration, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.2, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.85, transition: { duration: 0.15 } }}
        style={{
          width: px,
          height: px,
          minHeight: 0,    // CRITICAL: override global min-height
          minWidth: 0,
          background: vis.bg,
          boxShadow: `0 0 ${vis.glowSize}px ${Math.round(vis.glowSize / 3)}px ${vis.glowColor}`,
          border: isStar ? "none" : `1.5px solid rgba(184, 233, 224, 0.6)`,
        }}
      >
        {/* Inner highlight (shimmer dot) */}
        <div
          className="absolute rounded-full bg-white/50 pointer-events-none"
          style={{
            width: px * 0.25,
            height: px * 0.25,
            top: "18%",
            left: "22%",
          }}
        />

        {/* Star sparkle indicator for encouraged */}
        {isEncouraged && isStar && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/70"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ fontSize: px * 0.45 }}
          >
            ✦
          </motion.div>
        )}

        {/* Bubble shimmer for encouraged ocean */}
        {isEncouraged && !isStar && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)",
            }}
          />
        )}
      </motion.div>

      {/* === AMBIENT PARTICLES (glow effect when reacted/encouraged) === */}
      {(tier === "encouraged" || signal.warmth === "many" || signal.warmth === "some") && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 360) / 6;
            const delay = i * 0.4;
            return (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                animate={{
                  x: [0, Math.cos((angle * Math.PI) / 180) * (px * 0.65), Math.cos((angle * Math.PI) / 180) * (px * 0.9)],
                  y: [0, Math.sin((angle * Math.PI) / 180) * (px * 0.65) - 8, Math.sin((angle * Math.PI) / 180) * (px * 0.9) - 20],
                  scale: [0, 1.2, 0],
                  opacity: [0, 0.9, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: delay,
                  ease: "easeOut",
                }}
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: isStar
                    ? "radial-gradient(circle, #FFFBE0 0%, #F5D67D 100%)"
                    : "radial-gradient(circle, #E8FBFF 0%, #4FD1C5 100%)",
                  boxShadow: isStar
                    ? "0 0 6px #F5D67D"
                    : "0 0 6px #4FD1C5",
                }}
              />
            );
          })}
        </div>
      )}

      {/* === WARMTH COUNT BADGE (for many warmth) === */}
      {signal.warmth === "many" && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="absolute rounded-full border text-[9px] font-bold flex items-center justify-center pointer-events-none"
          style={{
            width: 18,
            height: 18,
            top: "18%",
            right: "18%",
            background: isStar ? "#F5D67D" : "#4FD1C5",
            borderColor: isStar ? "#B3890A" : "#0E4D5C",
            color: isStar ? "#5A3A00" : "#002830",
          }}
        >
          ✦
        </motion.div>
      )}
    </div>
  );
}
