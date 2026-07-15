"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { MoodSlider } from "@/components/onboarding/MoodSlider";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import { useAppState } from "@/context/AppStateContext";

// Số người "ảo" đang online trong vũ trụ
const LIVE_COUNT_BASE = 247;

export default function CheckinPage() {
  const router = useRouter();
  const { mood, setMood } = useAppState();
  const [showContent, setShowContent] = useState(false);
  const [liveCount, setLiveCount] = useState(LIVE_COUNT_BASE);
  const [showHint, setShowHint] = useState(false);

  // Entrance animation trigger
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Hint animation
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Fluctuating live count for social proof
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(230, Math.min(280, prev + delta));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const canContinue = mood !== null;

  return (
    <SkyCanvas>
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-8 pt-4 md:px-8 md:pb-12 md:pt-6">

        {/* Header */}
        <header className="flex justify-end z-10">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <AnonymousIdentityBadge />
          </motion.div>
        </header>

        {/* Main content */}
        <main className="flex flex-1 items-center justify-center my-6 z-10">
          <div className="w-full max-w-md">

            {/* === PHẦN MỞ ĐẦU — ẨN DỤ === */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-8 text-center"
                >
                  {/* Live indicator */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-aurora opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-aurora" />
                    </span>
                    <span className="text-xs text-base-text-secondary">
                      <motion.span
                        key={liveCount}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-bold text-sky-aurora"
                      >
                        {liveCount}
                      </motion.span>{" "}
                      người đang ở đây cùng bạn lúc này
                    </span>
                  </motion.div>

                  {/* Main headline — staggered letters feel */}
                  <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-base-text-primary"
                  >
                    Mỗi ngôi sao trên{" "}
                    <span className="neon-text-sky">bầu trời này</span>
                    <br />
                    đều là{" "}
                    <span className="neon-text-gold">một câu chuyện thật</span>
                  </motion.h1>

                  {/* Subtitle ẩn dụ */}
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.6 }}
                    className="mt-4 text-sm leading-relaxed text-base-text-secondary"
                  >
                    Không ai biết bạn là ai ở đây.{" "}
                    <span className="text-base-text-primary">
                      Chỉ cần thật lòng
                    </span>{" "}
                    — vũ trụ sẽ đón nhận nỗi lòng của bạn.
                  </motion.p>

                  {/* Floating hint */}
                  <AnimatePresence>
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mt-3 flex items-center justify-center gap-1.5"
                      >
                        <span className="text-xl animate-bounce-soft">👇</span>
                        <span className="text-xs text-base-text-secondary/70 italic">
                          Chọn trạng thái cảm xúc của bạn hôm nay
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* === MOOD ORB WIDGET === */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 32 }}
              transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card rounded-sheet px-6 py-8"
            >
              <MoodSlider value={mood} onChange={setMood} />

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ delay: 0.9 }}
                className="mt-8"
              >
                <AnimatePresence mode="wait">
                  {canContinue ? (
                    <motion.button
                      key="ready"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.push("/write")}
                      className="w-full rounded-full py-4 text-base font-bold text-base-text-primary transition-all duration-300 relative overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg, #3A2E5C 0%, #7C9EFF 50%, #B388FF 100%)",
                        boxShadow:
                          "0 0 30px rgba(124, 158, 255, 0.4), 0 4px 20px rgba(0,0,0,0.4)",
                      }}
                    >
                      {/* Shimmer overlay */}
                      <span
                        className="absolute inset-0 shimmer-bg pointer-events-none"
                        style={{ borderRadius: "inherit" }}
                      />
                      <span className="relative flex items-center justify-center gap-2">
                        <span>✨</span>
                        Bước vào không gian
                        <span>→</span>
                      </span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full rounded-full py-4 text-center text-sm text-base-text-secondary/50 border border-dashed border-white/10"
                    >
                      Chọn cảm xúc để tiếp tục...
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Footer teaser */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ delay: 1.2 }}
              className="mt-6 text-center text-xs text-base-text-secondary/40"
            >
              🔒 Hoàn toàn ẩn danh · Không tài khoản · Không lưu vết
            </motion.p>
          </div>
        </main>
      </div>
    </SkyCanvas>
  );
}
