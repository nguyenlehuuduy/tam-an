"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  History,
  Plus,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  Compass,
  Eye,
} from "lucide-react";
import clsx from "clsx";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { OceanCanvas } from "@/components/canvas/OceanCanvas";
import { SignalOrb } from "@/components/canvas/SignalOrb";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SignalCard } from "@/components/explore/SignalCard";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import { useAppState } from "@/context/AppStateContext";
import { Signal } from "@/lib/mockSignals";
import { playOpenSignal } from "@/lib/sound";

type Space = "sky" | "ocean";

// =====================================================
// IMMERSIVE WHISPERS — xoay vòng tự động mỗi 4s
// =====================================================
const SKY_WHISPERS = [
  "Mỗi ngôi sao là một câu chuyện ai đó đang giữ...",
  "Chạm vào ánh sáng — để nghe điều chưa kể",
  "Có ai đó ngoài kia cũng đang nhìn lên bầu trời này",
  "Đêm nay vũ trụ có thêm một câu chuyện mới",
  "Kéo để khám phá — bạn không cô đơn đâu",
];

const OCEAN_WHISPERS = [
  "Những bong bóng đang trôi nhẹ dưới lòng biển...",
  "Chạm vào một bong bóng — nghe lời thì thầm",
  "Ai đó vừa thả điều họ giữ rất lâu xuống đây",
  "Đại dương giữ mọi bí mật, không phán xét",
  "Lắng nghe... biển đang kể chuyện",
];

// Stats shown to create social presence
const STATS_DATA = {
  sky: { count: 1247, label: "câu chuyện đang bay trên trời" },
  ocean: { count: 893, label: "bí mật đang chìm dưới biển" },
};

export default function ExplorePage() {
  const { signals, soundEnabled, toggleSound, encouragedSignalIds } = useAppState();
  const [space, setSpace] = useState<Space>("sky");
  const [openSignal, setOpenSignal] = useState<Signal | null>(null);
  const [whisperIdx, setWhisperIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 3D Parallax camera tracking
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const springX = useSpring(dragX, { stiffness: 100, damping: 30 });
  const springY = useSpring(dragY, { stiffness: 100, damping: 30 });
  const parallaxLayer1X = useTransform(springX, [-1000, 1000], [-30, 30]);
  const parallaxLayer1Y = useTransform(springY, [-1000, 1000], [-30, 30]);

  const isSky = space === "sky";
  const whispers = isSky ? SKY_WHISPERS : OCEAN_WHISPERS;
  const stats = STATS_DATA[space];

  useEffect(() => setMounted(true), []);

  // Auto-cycle whispers
  useEffect(() => {
    const t = setInterval(() => {
      setWhisperIdx((p) => (p + 1) % whispers.length);
    }, 4000);
    return () => clearInterval(t);
  }, [whispers.length]);

  // Auto-dismiss intro after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(t);
  }, []);

  // Reset whisper index on space change
  useEffect(() => {
    setWhisperIdx(0);
  }, [space]);

  const visible = useMemo(
    () => signals.filter((s) => (isSky ? s.type === "star" : s.type === "bubble")),
    [signals, isSky]
  );

  // Sinh các hạt nền (sao/bong bóng trang trí) lơ lửng ngẫu nhiên trong không gian ảo
  const ambientElements = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const rand = (max: number) => Math.random() * max;
      const depth = rand(0.7) + 0.15; // 0.15 -> 0.85
      return {
        id: `ambient-${i}`,
        x: rand(90) + 5,
        y: rand(90) + 5,
        size: rand(6) + 2, // Kích thước ngẫu nhiên
        depth,
        opacity: rand(0.4) + 0.15,
        twinkleSpeed: rand(3.5) + 2, // Tốc độ lấp lánh/nhấp nháy
      };
    });
  }, []);

  function handleTap(signal: Signal) {
    setOpenSignal(signal);
    if (soundEnabled) playOpenSignal();
  }

  function handleMouseMove(e: React.MouseEvent) {
    // Optionally keep mouse parallax for background layers if needed,
    // but the main effect is now drag-based 3D parallax.
  }

  // Wrapper cho từng tín hiệu để tạo hiệu ứng 3D Parallax
  const ParallaxSignal = ({ signal, idx, isEncouraged }: { signal: Signal; idx: number; isEncouraged: boolean }) => {
    // Tính toán độ sâu (depth) ảo dựa trên ID để tạo layer 3D
    const depth = useMemo(() => {
      let hash = 0;
      for (let i = 0; i < signal.id.length; i++) hash = signal.id.charCodeAt(i) + ((hash << 5) - hash);
      return (Math.abs(hash) % 100) / 100; // Giá trị 0 -> 1
    }, [signal.id]);

    // Các object ở xa (depth thấp) sẽ di chuyển ngược lại nhẹ để giảm tốc độ drag
    // Các object ở gần (depth cao) sẽ di chuyển nhanh hơn
    // springX, springY chính là vị trí drag hiện tại
    const offsetX = useTransform(springX, v => v * (depth - 0.5) * 1.5);
    const offsetY = useTransform(springY, v => v * (depth - 0.5) * 1.5);
    
    // Scale object dựa theo độ sâu để tạo cảm giác gần/xa
    const scale = 0.7 + depth * 0.6;

    return (
      <motion.div
        key={signal.id}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: scale }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{
          delay: showIntro ? 3.5 + idx * 0.06 : idx * 0.04,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
        style={{ x: offsetX, y: offsetY, zIndex: Math.floor(depth * 100) + 20 }}
        className="absolute inset-0 pointer-events-none" // Wrapper full màn hình nhưng KHÔNG chặn sự kiện vì pointer-events-none
      >
        <SignalOrb
          signal={signal}
          onTap={handleTap}
          isEncouraged={isEncouraged}
        />
      </motion.div>
    );
  };

  const Canvas = isSky ? SkyCanvas : OceanCanvas;

  return (
    <Canvas mouseX={springX} mouseY={springY}>
      <div
        className="relative flex h-dvh w-full flex-col overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* ======================================================
            INTRO OVERLAY — Dramatic entrance (auto-dismiss 3.5s)
            ====================================================== */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center"
              style={{
                background: "radial-gradient(ellipse at 50% 50%, rgba(6,10,19,0.95) 0%, rgba(6,10,19,0.99) 70%)",
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  animate={{ boxShadow: [
                    "0 0 30px rgba(162,119,255,0.4)",
                    "0 0 70px rgba(162,119,255,0.6)",
                    "0 0 30px rgba(162,119,255,0.4)",
                  ]}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: "radial-gradient(circle at 40% 40%, rgba(162,119,255,0.4), rgba(45,31,94,0.7))",
                    border: "1px solid rgba(162,119,255,0.4)",
                  }}
                >
                  <Compass size={28} className="text-[#d8b4fe]" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-aurora/60 mb-3"
                >
                  Bạn đang bước vào
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="font-display text-2xl font-black text-base-text-primary mb-2"
                >
                  Không gian {isSky ? "bầu trời" : "đại dương"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.75 }}
                  className="text-xs text-base-text-secondary"
                >
                  {mounted ? stats.count.toLocaleString() : "—"} {stats.label}
                </motion.p>

                {/* Loading progress bar */}
                <motion.div className="mx-auto mt-6 h-0.5 w-32 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-sky-aurora/60"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.2, ease: "linear" }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================
            HEADER — Compact, floating glass
            ====================================================== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? -20 : 0 }}
          transition={{ duration: 0.5, delay: showIntro ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="z-20 w-full px-4 pt-4 md:px-6 md:pt-5"
        >
          <div
            className="mx-auto flex max-w-3xl items-center justify-between rounded-2xl px-4 py-2.5 md:px-5"
            style={{
              background: "rgba(12,16,28,0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Left — Identity */}
            <AnonymousIdentityBadge compact />

            {/* Center — Space switcher */}
            <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/6">
              <button
                onClick={() => setSpace("sky")}
                className={clsx(
                  "rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all duration-300",
                  isSky
                    ? "bg-sky-violet/80 text-white shadow-md"
                    : "text-base-text-secondary/60 hover:text-base-text-secondary"
                )}
                style={isSky ? { boxShadow: "0 0 14px rgba(124,158,255,0.4)" } : {}}
              >
                ✦ Bầu trời
              </button>
              <button
                onClick={() => setSpace("ocean")}
                className={clsx(
                  "rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all duration-300",
                  !isSky
                    ? "bg-ocean-teal/80 text-white shadow-md"
                    : "text-base-text-secondary/60 hover:text-base-text-secondary"
                )}
                style={!isSky ? { boxShadow: "0 0 14px rgba(79,209,197,0.4)" } : {}}
              >
                ◎ Đại dương
              </button>
            </div>

            {/* Right — Sound + History */}
            <div className="flex items-center gap-1.5">
              <button
                aria-label={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                onClick={toggleSound}
                className="orb-btn rounded-lg bg-white/[0.04] p-2 text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
                style={{ minHeight: 0 }}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <Link
                href="/history"
                aria-label="Lịch sử"
                className="rounded-lg bg-white/[0.04] p-2 text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
              >
                <History size={14} />
              </Link>
            </div>
          </div>
        </motion.header>

        {/* ======================================================
            WHISPER BAR — auto-rotating immersive hints
            ====================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showIntro ? 0 : 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="z-10 mt-3 text-center px-4"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/6 bg-black/25 px-4 py-2 backdrop-blur-sm">
            <Eye size={11} className="shrink-0 text-base-text-secondary/40" />
            <AnimatePresence mode="wait">
              <motion.p
                key={`${space}-${whisperIdx}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 0.6, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] text-base-text-secondary"
              >
                {whispers[whisperIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ======================================================
            DRAGGABLE SPACE CANVAS — signals floating
            ====================================================== */}
        <div
          ref={containerRef}
          className="relative flex-1 w-full overflow-hidden z-10"
        >
          <motion.div
            drag
            dragConstraints={{ left: -1800, right: 1800, top: -1800, bottom: 1800 }}
            dragElastic={0.25}
            initial={{ x: -600, y: -600 }}
            className="absolute w-[300%] h-[300%] cursor-grab active:cursor-grabbing origin-center"
            style={{
              touchAction: "none",
              x: dragX,
              y: dragY,
            }}
          >
            {/* Thêm một lớp tinh vân nền trôi nhẹ khi drag */}
            <motion.div 
              className="absolute inset-0 pointer-events-none opacity-40 blur-[80px]"
              style={{
                background: isSky 
                  ? "radial-gradient(circle at 50% 50%, rgba(162,119,255,0.15) 0%, transparent 60%)" 
                  : "radial-gradient(circle at 50% 50%, rgba(79,209,197,0.1) 0%, transparent 60%)"
              }}
            />

            {/* Ambient decorative elements inside the draggable galaxy/ocean */}
            {ambientElements.map((el, i) => {
              const offsetX = useTransform(springX, (v) => v * (el.depth - 0.5) * 1.3);
              const offsetY = useTransform(springY, (v) => v * (el.depth - 0.5) * 1.3);
              
              if (isSky) {
                return (
                  <motion.span
                    key={el.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      top: `${el.y}%`,
                      left: `${el.x}%`,
                      width: el.size * 0.8,
                      height: el.size * 0.8,
                      x: offsetX,
                      y: offsetY,
                      opacity: el.opacity,
                      background: i % 3 === 0 ? "#A8C8FF" : i % 5 === 0 ? "#F5D67D" : "#FFFFFF",
                      boxShadow: el.size > 5 ? "0 0 6px rgba(255,255,255,0.4)" : "none",
                      animation: `twinkle ${el.twinkleSpeed}s ease-in-out infinite`,
                    }}
                  />
                );
              } else {
                return (
                  <motion.span
                    key={el.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      top: `${el.y}%`,
                      left: `${el.x}%`,
                      width: el.size * 1.2,
                      height: el.size * 1.2,
                      x: offsetX,
                      y: offsetY,
                      opacity: el.opacity,
                      background: "radial-gradient(circle at 35% 30%, rgba(184,233,224,0.3) 0%, rgba(79,209,197,0.05) 70%)",
                      border: "0.8px solid rgba(184,233,224,0.18)",
                      boxShadow: "inset 0 0 3px rgba(255,255,255,0.1)",
                      animation: `twinkle ${el.twinkleSpeed}s ease-in-out infinite`,
                    }}
                  />
                );
              }
            })}

            <AnimatePresence>
              {visible.map((s, i) => (
                <ParallaxSignal
                  key={s.id}
                  signal={s}
                  idx={i}
                  isEncouraged={encouragedSignalIds.includes(s.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Depth hint — subtle edge gradients */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-16 z-20"
            style={{
              background: isSky
                ? "linear-gradient(180deg, rgba(6,10,19,0.85) 0%, rgba(6,10,19,0.3) 50%, transparent 100%)"
                : "linear-gradient(180deg, rgba(3,16,32,0.85) 0%, rgba(3,16,32,0.3) 50%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-20"
            style={{
              background: isSky
                ? "linear-gradient(0deg, rgba(6,10,19,0.9) 0%, rgba(6,10,19,0.4) 60%, transparent 100%)"
                : "linear-gradient(0deg, rgba(3,16,32,0.9) 0%, rgba(3,16,32,0.4) 60%, transparent 100%)",
            }}
          />
        </div>

        {/* ======================================================
            BOTTOM AREA — Stats + FAB
            ====================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showIntro ? 0 : 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="absolute bottom-0 left-0 right-0 z-20 pb-6 px-4"
        >
          {/* Live stat counter */}
          <div className="text-center mb-4">
            <motion.p
              className="text-[10px] text-base-text-secondary/35 flex items-center justify-center gap-1.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                  style={{ background: isSky ? "#7C9EFF" : "#4FD1C5" }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: isSky ? "#7C9EFF" : "#4FD1C5" }}
                />
              </span>
              {mounted ? stats.count.toLocaleString() : "—"} {stats.label}
            </motion.p>
          </div>

          {/* Floating Action Button */}
          <div className="flex justify-center pointer-events-none">
            <motion.div
              initial={{ y: 20, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 22 }}
              className="pointer-events-auto relative"
            >
              {/* Glow pulses */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  background: isSky
                    ? "rgba(124,158,255,0.3)"
                    : "rgba(79,209,197,0.3)",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                style={{
                  background: isSky
                    ? "rgba(192,132,252,0.2)"
                    : "rgba(79,209,197,0.15)",
                }}
              />

              <Link
                href="/checkin"
                className={clsx(
                  "relative flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95"
                )}
                style={{
                  background: isSky
                    ? "linear-gradient(135deg, #2D1F5E 0%, #7C9EFF 50%, #C084FC 100%)"
                    : "linear-gradient(135deg, #072034 0%, #0E4D5C 50%, #4FD1C5 100%)",
                  boxShadow: isSky
                    ? "0 0 36px rgba(124,158,255,0.5), 0 6px 24px rgba(0,0,0,0.45)"
                    : "0 0 36px rgba(79,209,197,0.45), 0 6px 24px rgba(0,0,0,0.45)",
                }}
              >
                <Plus size={16} />
                Chia sẻ tâm sự
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ======================================================
          BOTTOM SHEET — Signal detail card
          ====================================================== */}
      <BottomSheet open={openSignal !== null} onClose={() => setOpenSignal(null)}>
        {openSignal && <SignalCard signal={openSignal} />}
      </BottomSheet>
    </Canvas>
  );
}
