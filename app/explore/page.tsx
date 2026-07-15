"use client";

import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  animate,
} from "framer-motion";
import {
  History,
  Plus,
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  Compass,
  Waves,
} from "lucide-react";
import clsx from "clsx";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { OceanCanvas } from "@/components/canvas/OceanCanvas";
import { SignalOrb } from "@/components/canvas/SignalOrb";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SignalCard } from "@/components/explore/SignalCard";
import { ExploreMiniMap } from "@/components/explore/ExploreMiniMap";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import { useAppState } from "@/context/AppStateContext";
import { Signal } from "@/lib/mockSignals";
import { playOpenSignal } from "@/lib/sound";

type Space = "sky" | "ocean";

// =====================================================
// WHISPER TEXTS
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

const STATS_DATA = {
  sky: { count: 1247, label: "câu chuyện đang bay trên trời" },
  ocean: { count: 893, label: "bí mật đang chìm dưới biển" },
};

// Size of the draggable virtual canvas (3x viewport)
const CANVAS_SCALE = 3;

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExplorePageContent />
    </Suspense>
  );
}

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const { signals, soundEnabled, toggleSound, encouragedSignalIds } = useAppState();

  // Detect incoming space from URL param (e.g. /explore?from=ocean)
  const fromParam = searchParams.get("from");
  const initialSpace: Space =
    fromParam === "ocean" ? "ocean" : "sky";

  const [space, setSpace] = useState<Space>(initialSpace);
  const [openSignal, setOpenSignal] = useState<Signal | null>(null);
  const [whisperIdx, setWhisperIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: 390, h: 844 });

  const isSky = space === "sky";
  const whispers = isSky ? SKY_WHISPERS : OCEAN_WHISPERS;
  const stats = STATS_DATA[space];

  // =====================================================
  // SMOOTH POINTER DRAG ENGINE
  // Uses raw pointer events for zero-lag panning.
  // No framer-motion drag — avoids re-render jank.
  // =====================================================
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const inertiaFrame = useRef<number | null>(null);

  // MotionValues hold the canvas offset
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  // Smooth spring layer for parallax backgrounds
  const springX = useSpring(rawX, { stiffness: 80, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 80, damping: 22 });

  // Canvas boundaries: canvas is CANVAS_SCALE times the viewport
  const getBounds = useCallback(() => {
    const { w, h } = windowSize;
    const maxX = 0;
    const minX = -(w * (CANVAS_SCALE - 1));
    const maxY = 0;
    const minY = -(h * (CANVAS_SCALE - 1));
    return { minX, maxX, minY, maxY };
  }, [windowSize]);

  function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }

  const applyInertia = useCallback(() => {
    velocity.current.x *= 0.93;
    velocity.current.y *= 0.93;
    const bounds = getBounds();
    rawX.set(clamp(rawX.get() + velocity.current.x, bounds.minX, bounds.maxX));
    rawY.set(clamp(rawY.get() + velocity.current.y, bounds.minY, bounds.maxY));
    if (Math.abs(velocity.current.x) > 0.3 || Math.abs(velocity.current.y) > 0.3) {
      inertiaFrame.current = requestAnimationFrame(applyInertia);
    }
  }, [getBounds, rawX, rawY]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore if clicking on a signal orb (pointer-events-auto children)
    if ((e.target as HTMLElement).closest("[data-signal-orb]")) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    if (inertiaFrame.current) cancelAnimationFrame(inertiaFrame.current);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [inertiaFrame]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: dx, y: dy };
    const bounds = getBounds();
    rawX.set(clamp(rawX.get() + dx, bounds.minX, bounds.maxX));
    rawY.set(clamp(rawY.get() + dy, bounds.minY, bounds.maxY));
  }, [getBounds, rawX, rawY]);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    inertiaFrame.current = requestAnimationFrame(applyInertia);
  }, [applyInertia]);

  // Teleport (from mini-map click)
  function handleTeleport(tx: number, ty: number) {
    const bounds = getBounds();
    const cx = clamp(tx, bounds.minX, bounds.maxX);
    const cy = clamp(ty, bounds.minY, bounds.maxY);
    animate(rawX, cx, { type: "spring", stiffness: 150, damping: 25 });
    animate(rawY, cy, { type: "spring", stiffness: 150, damping: 25 });
  }

  // Update window size on mount / resize
  useEffect(() => {
    function update() {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => setMounted(true), []);

  // Auto-cycle whispers
  useEffect(() => {
    const t = setInterval(() => {
      setWhisperIdx((p) => (p + 1) % whispers.length);
    }, 4000);
    return () => clearInterval(t);
  }, [whispers.length]);

  // Auto-dismiss intro after 3.5s
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(t);
  }, []);

  // Reset whisper on space change
  useEffect(() => {
    setWhisperIdx(0);
  }, [space]);

  const visible = useMemo(
    () => signals.filter((s) => (isSky ? s.type === "star" : s.type === "bubble")),
    [signals, isSky]
  );

  // Ambient decorative particles (stars / bubbles)
  const ambientElements = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const rand = (max: number) => Math.random() * max;
      const depth = rand(0.7) + 0.15;
      return {
        id: `ambient-${i}`,
        x: rand(90) + 5,
        y: rand(90) + 5,
        size: rand(5) + 1.5,
        depth,
        opacity: rand(0.4) + 0.12,
        twinkleSpeed: rand(3) + 2,
      };
    });
  }, []);

  function handleTap(signal: Signal) {
    setOpenSignal(signal);
    if (soundEnabled) playOpenSignal();
  }

  const Canvas = isSky ? SkyCanvas : OceanCanvas;

  // Canvas pixel dimensions
  const canvasW = windowSize.w * CANVAS_SCALE;
  const canvasH = windowSize.h * CANVAS_SCALE;

  return (
    <Canvas mouseX={springX} mouseY={springY}>
      <div className="relative flex h-dvh w-full flex-col overflow-hidden">

        {/* ======================================================
            INTRO OVERLAY
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
                background: isSky
                  ? "radial-gradient(ellipse at 50% 50%, rgba(6,10,19,0.97) 0%, rgba(6,10,19,0.99) 70%)"
                  : "radial-gradient(ellipse at 50% 60%, rgba(3,16,32,0.97) 0%, rgba(3,16,32,0.99) 70%)",
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  animate={{
                    boxShadow: isSky
                      ? [
                          "0 0 30px rgba(162,119,255,0.4)",
                          "0 0 70px rgba(162,119,255,0.6)",
                          "0 0 30px rgba(162,119,255,0.4)",
                        ]
                      : [
                          "0 0 30px rgba(79,209,197,0.4)",
                          "0 0 70px rgba(79,209,197,0.65)",
                          "0 0 30px rgba(79,209,197,0.4)",
                        ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: isSky
                      ? "radial-gradient(circle at 40% 40%, rgba(162,119,255,0.4), rgba(45,31,94,0.7))"
                      : "radial-gradient(circle at 40% 40%, rgba(79,209,197,0.35), rgba(5,35,55,0.75))",
                    border: isSky
                      ? "1px solid rgba(162,119,255,0.4)"
                      : "1px solid rgba(79,209,197,0.4)",
                  }}
                >
                  {isSky ? (
                    <Compass size={28} className="text-[#d8b4fe]" />
                  ) : (
                    <Waves size={28} className="text-[#4FD1C5]" />
                  )}
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-semibold uppercase tracking-[0.3em] mb-3"
                  style={{ color: isSky ? "rgba(162,119,255,0.6)" : "rgba(79,209,197,0.6)" }}
                >
                  Bạn đang bước vào
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="font-display text-2xl font-black text-base-text-primary mb-2"
                >
                  {isSky ? "Không gian Bầu Trời ✦" : "Đại Dương Bao La ◎"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs text-base-text-secondary mb-1"
                >
                  {mounted ? stats.count.toLocaleString() : "—"} {stats.label}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 }}
                  transition={{ delay: 0.85 }}
                  className="text-[10px] text-base-text-secondary"
                >
                  {isSky
                    ? "Kéo để khám phá dải ngân hà câu chuyện"
                    : "Kéo để lặn sâu vào lòng đại dương bí ẩn"}
                </motion.p>

                {/* Progress bar */}
                <motion.div className="mx-auto mt-6 h-0.5 w-32 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isSky
                        ? "rgba(162,119,255,0.7)"
                        : "rgba(79,209,197,0.7)",
                    }}
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
            HEADER
            ====================================================== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? -20 : 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
            <AnonymousIdentityBadge compact />

            {/* Space switcher */}
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
            WHISPER BAR
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
            DRAGGABLE SPACE CANVAS — pointer event driven
            ====================================================== */}
        <div
          ref={canvasRef}
          className="relative flex-1 w-full overflow-hidden z-10"
          style={{ cursor: "grab", userSelect: "none", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Virtual canvas — panned by rawX/rawY */}
          <motion.div
            className="absolute origin-top-left pointer-events-none"
            style={{
              width: canvasW,
              height: canvasH,
              x: rawX,
              y: rawY,
            }}
          >
            {/* Subtle nebula glow */}
            <div
              className="absolute inset-0 opacity-30 blur-[100px] pointer-events-none"
              style={{
                background: isSky
                  ? "radial-gradient(circle at 50% 50%, rgba(162,119,255,0.2) 0%, transparent 60%)"
                  : "radial-gradient(circle at 50% 50%, rgba(79,209,197,0.12) 0%, transparent 60%)",
              }}
            />

            {/* Ambient decorative particles */}
            {ambientElements.map((el, i) =>
              isSky ? (
                <span
                  key={el.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    top: `${el.y}%`,
                    left: `${el.x}%`,
                    width: el.size * 0.8,
                    height: el.size * 0.8,
                    opacity: el.opacity,
                    background:
                      i % 3 === 0 ? "#A8C8FF" : i % 5 === 0 ? "#F5D67D" : "#FFFFFF",
                    boxShadow: el.size > 4 ? "0 0 5px rgba(255,255,255,0.4)" : "none",
                    animation: `twinkle ${el.twinkleSpeed}s ease-in-out infinite`,
                  }}
                />
              ) : (
                <span
                  key={el.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    top: `${el.y}%`,
                    left: `${el.x}%`,
                    width: el.size * 1.2,
                    height: el.size * 1.2,
                    opacity: el.opacity,
                    background:
                      "radial-gradient(circle at 35% 30%, rgba(184,233,224,0.3) 0%, rgba(79,209,197,0.05) 70%)",
                    border: "0.8px solid rgba(184,233,224,0.18)",
                    animation: `twinkle ${el.twinkleSpeed}s ease-in-out infinite`,
                  }}
                />
              )
            )}

            {/* Signal Orbs — pointer-events-auto via data-signal-orb */}
            <AnimatePresence>
              {visible.map((s, i) => {
                // Convert signal's percentage position to pixel position in canvas
                const px = (s.x / 100) * canvasW;
                const py = (s.y / 100) * canvasH;
                return (
                  <motion.div
                    key={s.id}
                    data-signal-orb="true"
                    className="absolute pointer-events-auto"
                    style={{ left: px, top: py, transform: "translate(-50%, -50%)" }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      delay: showIntro ? 3.5 + i * 0.06 : i * 0.04,
                      type: "spring",
                      stiffness: 220,
                      damping: 18,
                    }}
                  >
                    <SignalOrb
                      signal={s}
                      onTap={handleTap}
                      isEncouraged={encouragedSignalIds.includes(s.id)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Edge gradient overlays */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-16 z-20"
            style={{
              background: isSky
                ? "linear-gradient(180deg, rgba(6,10,19,0.85) 0%, transparent 100%)"
                : "linear-gradient(180deg, rgba(3,16,32,0.85) 0%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-20"
            style={{
              background: isSky
                ? "linear-gradient(0deg, rgba(6,10,19,0.9) 0%, transparent 100%)"
                : "linear-gradient(0deg, rgba(3,16,32,0.9) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* ======================================================
            BOTTOM AREA — Stats + FAB + Mini-Map
            ====================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showIntro ? 0 : 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="absolute bottom-0 left-0 right-0 z-20 pb-6 px-4"
        >
          {/* Live stat counter */}
          <div className="text-center mb-4">
            <motion.p className="text-[10px] text-base-text-secondary/35 flex items-center justify-center gap-1.5">
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

          {/* FAB + Mini-Map row */}
          <div className="flex items-end justify-between gap-3">
            {/* Mini-Map — bottom left */}
            <ExploreMiniMap
              dragX={rawX}
              dragY={rawY}
              signals={visible}
              isSky={isSky}
              canvasW={canvasW}
              canvasH={canvasH}
              viewW={windowSize.w}
              viewH={windowSize.h}
              onTeleport={handleTeleport}
            />

            {/* Floating Action Button — bottom right area (centered) */}
            <div className="flex-1 flex justify-center pointer-events-none">
              <motion.div
                initial={{ y: 20, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 22 }}
                className="pointer-events-auto relative"
              >
                {/* Glow rings */}
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
                  className="relative flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95"
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

            {/* Spacer to balance the map */}
            <div style={{ width: 140 }} />
          </div>
        </motion.div>
      </div>

      {/* ======================================================
          BOTTOM SHEET — Signal detail
          ====================================================== */}
      <BottomSheet open={openSignal !== null} onClose={() => setOpenSignal(null)}>
        {openSignal && <SignalCard signal={openSignal} />}
      </BottomSheet>
    </Canvas>
  );
}
