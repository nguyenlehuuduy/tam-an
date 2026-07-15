"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { History, Plus, Volume2, VolumeX, Sparkles } from "lucide-react";
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

const HINT_MESSAGES = [
  "✦ Kéo để khám phá vũ trụ cảm xúc — bạn không cô đơn đâu",
  "🌙 Mỗi điểm sáng là một câu chuyện thật đang trôi nổi",
  "💫 Chạm vào một ngôi sao để nghe điều ai đó đang giữ trong lòng",
];

export default function ExplorePage() {
  const { signals, soundEnabled, toggleSound, encouragedSignalIds } = useAppState();
  const [space, setSpace] = useState<Space>("sky");
  const [openSignal, setOpenSignal] = useState<Signal | null>(null);
  const [hintIdx, setHintIdx] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const visible = useMemo(
    () => signals.filter((s) => (space === "sky" ? s.type === "star" : s.type === "bubble")),
    [signals, space]
  );

  function handleTap(signal: Signal) {
    setOpenSignal(signal);
    if (soundEnabled) playOpenSignal();
  }

  // Cycle hint messages
  function cycleHint() {
    setHintIdx((prev) => (prev + 1) % HINT_MESSAGES.length);
  }

  const Canvas = space === "sky" ? SkyCanvas : OceanCanvas;
  const isSky = space === "sky";

  return (
    <Canvas>
      <div className="relative flex h-dvh w-full flex-col overflow-hidden">

        {/* === HEADER === */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="z-20 w-full px-4 pt-4 md:px-8 md:pt-6"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full glass-panel-heavy p-2 px-4 shadow-lg md:p-3 md:px-6"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-3">
              <AnonymousIdentityBadge compact />
              <span className="hidden text-xs text-base-text-secondary md:inline-block">
                Bạn đang ẩn danh an toàn
              </span>
            </div>

            {/* Space Tabs */}
            <div className="flex bg-white/5 rounded-full p-1 border border-white/8">
              <button
                onClick={() => setSpace("sky")}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300",
                  isSky
                    ? "bg-sky-violet text-base-text-primary shadow-md"
                    : "text-base-text-secondary hover:text-base-text-primary"
                )}
                style={isSky ? { boxShadow: "0 0 12px rgba(124,158,255,0.4)" } : {}}
              >
                ✦ Bầu trời
              </button>
              <button
                onClick={() => setSpace("ocean")}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300",
                  !isSky
                    ? "bg-ocean-teal text-base-text-primary shadow-md"
                    : "text-base-text-secondary hover:text-base-text-primary"
                )}
                style={!isSky ? { boxShadow: "0 0 12px rgba(79,209,197,0.4)" } : {}}
              >
                ◎ Đại dương
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                onClick={toggleSound}
                className="rounded-full bg-white/5 p-2 text-base-text-secondary hover:bg-white/10 hover:text-base-text-primary transition-colors"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <Link
                href="/history"
                aria-label="Lịch sử cá nhân"
                className="rounded-full bg-white/5 p-2 text-base-text-secondary hover:bg-white/10 hover:text-base-text-primary transition-colors"
              >
                <History size={16} />
              </Link>
            </div>
          </div>
        </motion.header>

        {/* === ANIMATED HINT PILL === */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="z-10 mt-3 text-center px-4"
        >
          <button
            onClick={cycleHint}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 backdrop-blur-sm hover:bg-white/5 transition-colors"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={hintIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-base-text-secondary"
              >
                {HINT_MESSAGES[hintIdx]}
              </motion.span>
            </AnimatePresence>
            <Sparkles size={11} className="text-sky-aurora/60 shrink-0" />
          </button>
        </motion.div>

        {/* === DRAGGABLE SPACE CANVAS === */}
        <div
          ref={containerRef}
          className="relative flex-1 w-full overflow-hidden z-10"
        >
          <motion.div
            drag
            dragConstraints={containerRef}
            dragElastic={0.15}
            initial={{ x: -180, y: -180 }}
            className="absolute w-[180%] h-[180%] cursor-grab active:cursor-grabbing origin-center"
            style={{ touchAction: "none" }}
          >
            {visible.map((s) => (
              <SignalOrb
                key={s.id}
                signal={s}
                onTap={handleTap}
                isEncouraged={encouragedSignalIds.includes(s.id)}
              />
            ))}
          </motion.div>
        </div>

        {/* === FAB — Bottom Floating Action Button === */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto relative"
          >
            {/* Pulsing glow ring */}
            <div
              className="absolute inset-0 rounded-full animate-pulse-ring pointer-events-none"
              style={{
                background: isSky
                  ? "rgba(124, 158, 255, 0.35)"
                  : "rgba(79, 209, 197, 0.35)",
              }}
            />
            <div
              className="absolute inset-0 rounded-full animate-pulse-ring pointer-events-none"
              style={{
                background: isSky
                  ? "rgba(124, 158, 255, 0.2)"
                  : "rgba(79, 209, 197, 0.2)",
                animationDelay: "0.5s",
              }}
            />

            <Link
              href="/write"
              aria-label="Viết tâm sự mới"
              className={clsx(
                "relative flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95",
                isSky
                  ? "bg-sky-violet text-base-text-primary"
                  : "bg-ocean-teal text-base-text-primary"
              )}
              style={{
                boxShadow: isSky
                  ? "0 0 30px rgba(124,158,255,0.5), 0 4px 20px rgba(0,0,0,0.5)"
                  : "0 0 30px rgba(79,209,197,0.5), 0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <Plus size={18} />
              Chia sẻ tâm sự
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom Sheet — Signal Card */}
      <BottomSheet open={openSignal !== null} onClose={() => setOpenSignal(null)}>
        {openSignal && <SignalCard signal={openSignal} />}
      </BottomSheet>
    </Canvas>
  );
}
