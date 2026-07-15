"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { MoodSlider } from "@/components/onboarding/MoodSlider";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import { useAppState } from "@/context/AppStateContext";
import { useT, useLanguage } from "@/context/LanguageContext";
import { LangSwitcher } from "@/components/ui/LangSwitcher";

const LIVE_COUNT_BASE = 247;
type Phase = "intro" | "mood";

export default function CheckinPage() {
  const router = useRouter();
  const { mood, setMood } = useAppState();
  const t = useT();
  const { lang } = useLanguage();

  const [liveCount, setLiveCount] = useState(LIVE_COUNT_BASE);
  const [phase, setPhase] = useState<Phase>("intro");
  const [mounted, setMounted] = useState(false);

  // STORY_GLIMPSES dynamically translated
  const storyGlimpses = useMemo(() => {
    return [
      { id: 0, text: t.checkin.storyGlimpses[0], x: "6%", y: "18%", rotate: -4, delay: 0.6 },
      { id: 1, text: t.checkin.storyGlimpses[1], x: "70%", y: "10%", rotate: 3, delay: 1.1 },
      { id: 2, text: t.checkin.storyGlimpses[2], x: "65%", y: "74%", rotate: -2, delay: 1.8 },
      { id: 3, text: t.checkin.storyGlimpses[3], x: "3%", y: "66%", rotate: 5, delay: 0.9 },
      { id: 4, text: t.checkin.storyGlimpses[4], x: "76%", y: "46%", rotate: -5, delay: 2.2 },
    ];
  }, [t]);

  // Mouse parallax cho hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-12, 12]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-8, 8]);

  useEffect(() => setMounted(true), []);

  // Live count fluctuation — chỉ client side
  useEffect(() => {
    const id = setInterval(() => {
      setLiveCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(238, Math.min(268, prev + delta));
      });
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // Parallax mouse tracking
  function handleMouseMove(e: React.MouseEvent) {
    const { clientX, clientY, currentTarget } = e;
    const { width, height } = (currentTarget as HTMLElement).getBoundingClientRect();
    mouseX.set(clientX / width - 0.5);
    mouseY.set(clientY / height - 0.5);
  }

  const canContinue = mood !== null;

  return (
    <SkyCanvas>
      <div
        className="relative flex min-h-dvh w-full flex-col overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Header Badges */}
        <div className="absolute right-4 top-4 z-30 md:right-6 md:top-5 flex items-center gap-2">
          <LangSwitcher />
          <AnonymousIdentityBadge compact />
        </div>

        <AnimatePresence mode="wait">
          {/* ============================================
              PHASE 1 — INTRO HERO
              "Không gian nơi bạn không cần phải ổn"
              ============================================ */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -32, filter: "blur(8px)" }}
              transition={{ exit: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
              className="flex min-h-dvh w-full flex-col items-center justify-center px-5"
            >
              {/* ── Floating Story Glimpses (desktop only) ── */}
              {mounted && storyGlimpses.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: s.delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute hidden lg:block max-w-[200px] select-none"
                  style={{ top: s.y, left: s.x, rotate: `${s.rotate}deg` }}
                  whileHover={{ scale: 1.04, transition: { duration: 0.25 } }}
                >
                  <div
                    className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-sm"
                    style={{ filter: "blur(2px)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.filter = "blur(0px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.filter = "blur(2px)";
                    }}
                  >
                    <p className="text-[11px] leading-relaxed text-white/45 font-medium italic">
                      "{s.text}"
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* ── Center Hero Content ── */}
              <motion.div
                className="relative z-10 flex max-w-[520px] flex-col items-center text-center"
                style={{ x: parallaxX, y: parallaxY }}
              >
                {/* Live counter */}
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.55, type: "spring" }}
                  className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-sky-aurora/20 bg-sky-aurora/8 px-4 py-2 backdrop-blur-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-aurora opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-aurora" />
                  </span>
                  <span className="text-xs text-sky-aurora/75">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={liveCount}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="font-bold text-sky-aurora"
                      >
                        {mounted ? liveCount : LIVE_COUNT_BASE}
                      </motion.span>
                    </AnimatePresence>
                    {" "}{t.checkin.linhHonCount}
                  </span>
                </motion.div>

                {/* ── HEADLINE ── 3 dòng stagger */}
                <div className="mb-7 overflow-visible">
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-base-text-secondary/60"
                  >
                    {t.checkin.introLine1}
                  </motion.p>

                  <motion.h1
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display font-black leading-[1.08] tracking-tight text-base-text-primary"
                    style={{ fontSize: "clamp(2.4rem, 6vw, 3.8rem)" }}
                  >
                    {t.checkin.introLine2}
                  </motion.h1>

                  <motion.h1
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.56, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display font-black leading-[1.08] tracking-tight shimmer-text"
                    style={{ fontSize: "clamp(2.4rem, 6vw, 3.8rem)" }}
                  >
                    {t.checkin.introLine3}
                  </motion.h1>

                  <motion.h1
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display font-black leading-[1.08] tracking-tight text-base-text-primary"
                    style={{ fontSize: "clamp(2.4rem, 6vw, 3.8rem)" }}
                  >
                    {t.checkin.introLine4}
                  </motion.h1>
                </div>

                {/* Subtext */}
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.88, duration: 0.6 }}
                  className="mb-10 max-w-[340px] text-[15px] leading-[1.75] text-base-text-secondary"
                >
                  {t.checkin.introSub}
                </motion.p>

                {/* ── CTA BUTTON ── */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 1.05, duration: 0.5, type: "spring", stiffness: 300, damping: 24 }}
                  className="relative"
                >
                  {/* Glow rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ background: "rgba(124,158,255,0.5)", transform: "scale(1.4)" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    style={{ background: "rgba(179,136,255,0.4)", transform: "scale(1.8)" }}
                  />

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPhase("mood")}
                    className="orb-btn relative flex items-center gap-3 rounded-full px-9 py-4 text-[15px] font-bold text-base-text-primary"
                    style={{
                      minHeight: 0,
                      background: "linear-gradient(135deg, #2D1F5E 0%, #7C9EFF 55%, #C084FC 100%)",
                      boxShadow: "0 0 40px rgba(124,158,255,0.5), 0 8px 32px rgba(0,0,0,0.55)",
                    }}
                  >
                    <span>{t.checkin.introCta}</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </motion.button>
                </motion.div>

                {/* Privacy footer */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.45 }}
                  transition={{ delay: 1.5 }}
                  className="mt-8 text-xs text-base-text-secondary"
                >
                  {t.common.anonymityFooter}
                </motion.p>
              </motion.div>
            </motion.div>
          )}

          {/* ============================================
              PHASE 2 — MOOD SELECTION
              "Hôm nay bạn đang cảm thấy thế nào?"
              ============================================ */}
          {phase === "mood" && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, y: 64, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-dvh w-full flex-col items-center justify-center px-5"
            >
              <div className="w-full max-w-sm">
                {/* Step indicator */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8 flex flex-col items-center gap-3 text-center"
                >
                  {/* Progress dots */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-8 rounded-full bg-sky-aurora" />
                    <div className="h-1.5 w-8 rounded-full bg-white/15" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-base-text-secondary/60">
                    {t.checkin.step1of2}
                  </p>
                  <h2 className="font-display text-2xl font-bold leading-tight text-base-text-primary">
                    {lang === "vi" ? (
                      <>
                        Hôm nay bạn đang{" "}
                        <span className="shimmer-text">cảm thấy</span>{" "}
                        thế nào?
                      </>
                    ) : (
                      <>
                        How are you{" "}
                        <span className="shimmer-text">feeling</span>{" "}
                        today?
                      </>
                    )}
                  </h2>
                  <p className="text-sm text-base-text-secondary/70">
                    {t.checkin.moodSub}
                  </p>
                </motion.div>

                {/* Mood Orb */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="glass-card rounded-sheet px-6 py-8"
                >
                  <MoodSlider value={mood} onChange={setMood} />
                </motion.div>

                {/* Continue button */}
                <AnimatePresence>
                  {canContinue && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      className="relative mt-6"
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                        animate={{ opacity: [0.3, 0.65, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ background: "rgba(124,158,255,0.45)", transform: "scale(1.3)" }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push("/write")}
                        className="orb-btn relative w-full overflow-hidden rounded-full py-4 text-[15px] font-bold text-base-text-primary"
                        style={{
                          minHeight: 0,
                          background: "linear-gradient(135deg, #2D1F5E 0%, #7C9EFF 55%, #C084FC 100%)",
                          boxShadow: "0 0 30px rgba(124,158,255,0.45), 0 6px 24px rgba(0,0,0,0.4)",
                        }}
                      >
                        {/* Shimmer */}
                        <span
                          className="absolute inset-0 shimmer-bg pointer-events-none"
                          style={{ borderRadius: "inherit" }}
                        />
                        <span className="relative flex items-center justify-center gap-2">
                          {t.checkin.moodBtn}
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Waiting state */}
                {!canContinue && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 rounded-full border border-dashed border-white/10 py-4 text-center text-sm text-base-text-secondary/40"
                  >
                    {t.checkin.moodPlaceholder}
                  </motion.div>
                )}

                {/* Back button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setPhase("intro")}
                  className="orb-btn mt-5 w-full text-center text-xs text-base-text-secondary/50 hover:text-base-text-secondary transition-colors py-2"
                  style={{ minHeight: 0 }}
                >
                  ← {t.common.back}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SkyCanvas>
  );
}
