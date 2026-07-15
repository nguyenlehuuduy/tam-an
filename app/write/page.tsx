"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Waves, ChevronLeft, Sparkles, Feather, Heart } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import clsx from "clsx";

const CHAR_LIMIT = 300;

// =====================================================
// GỢI Ý NHẸ NHÀNG — xoay vòng, chạm vào cảm xúc
// Thay vì "Điều gì đang khiến lòng bạn nặng trĩu..."
// =====================================================
const PROMPTS = [
  "Hôm nay mình muốn kể rằng...",
  "Có một điều mình chưa nói với ai...",
  "Lúc này mình đang cảm thấy...",
  "Nếu được quay lại hôm qua, mình sẽ...",
  "Điều nhỏ nhưng ám ảnh mình gần đây là...",
  "Mình ước có ai đó hiểu rằng...",
];

/** Gợi ý thả — nhẹ nhàng, không áp lực */
const DESTINATION_HINTS = {
  star: {
    title: "Thả lên bầu trời",
    subtitle: "Để ai đó ngước lên và thấy câu chuyện của bạn",
    emoji: "✦",
    color: "#F5D67D",
    glowColor: "rgba(245,214,125,0.25)",
    bgGrad: "linear-gradient(135deg, rgba(58,46,92,0.4), rgba(124,158,255,0.15))",
  },
  bubble: {
    title: "Thả xuống đại dương",
    subtitle: "Để nó trôi đi nhẹ nhàng, như một lời thì thầm",
    emoji: "◎",
    color: "#4FD1C5",
    glowColor: "rgba(79,209,197,0.25)",
    bgGrad: "linear-gradient(135deg, rgba(7,32,52,0.5), rgba(79,209,197,0.12))",
  },
};

export default function WritePage() {
  const router = useRouter();
  const { draft, setDraftContent, setDraftType, mood } = useAppState();
  const [promptIdx, setPromptIdx] = useState(0);
  const [showPromptHint, setShowPromptHint] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = CHAR_LIMIT - draft.content.length;
  const isStar = draft.type === "star";
  const isBubble = draft.type === "bubble";
  const hasContent = draft.content.trim().length > 0;
  const canSubmit = draft.type !== null && hasContent;

  // Xoay gợi ý mỗi 4s (chỉ khi textarea trống)
  useEffect(() => {
    if (hasContent) return;
    const t = setInterval(() => {
      setPromptIdx((p) => (p + 1) % PROMPTS.length);
    }, 4000);
    return () => clearInterval(t);
  }, [hasContent]);

  // Tự focus textarea sau animation
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 600);
    return () => clearTimeout(t);
  }, []);

  // Ẩn prompt hint khi bắt đầu gõ
  useEffect(() => {
    if (hasContent) setShowPromptHint(false);
    else setShowPromptHint(true);
  }, [hasContent]);

  // Mood label nhẹ nhàng
  const moodHint = mood !== null && mood <= 3
    ? "Mình hiểu hôm nay không dễ dàng lắm..."
    : mood !== null && mood >= 7
    ? "Hôm nay có vẻ tích cực nhỉ ✨"
    : null;

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {/* ── Ambient backgrounds ── */}
      <motion.div
        className="absolute inset-0 bg-sky-gradient"
        animate={{ opacity: isBubble ? 0 : 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: isBubble ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(180deg, #031020 0%, #041828 40%, #051F35 70%, #03121E 100%)",
        }}
      />
      {draft.type === null && <div className="absolute inset-0 bg-base-gradient" />}

      {/* Ambient glow per destination */}
      <AnimatePresence>
        {isStar && (
          <motion.div
            key="sky-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-72 w-[90%] rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(245,214,125,0.1) 0%, rgba(124,158,255,0.08) 40%, transparent 70%)" }}
          />
        )}
        {isBubble && (
          <motion.div
            key="ocean-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-[90%] rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(79,209,197,0.1) 0%, transparent 70%)" }}
          />
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-8 pt-4 md:px-6">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => router.back()}
            className="orb-btn flex items-center gap-1.5 text-sm text-base-text-secondary/70 hover:text-base-text-primary transition-colors py-1"
            style={{ minHeight: 0 }}
          >
            <ChevronLeft size={16} />
            <span className="text-xs">Quay lại</span>
          </button>
          <AnonymousIdentityBadge compact />
        </motion.header>

        {/* ── Content area ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col"
        >
          {/* ── Step indicator + mood hint ── */}
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-sky-aurora/50" />
              <div className="h-1.5 w-8 rounded-full bg-sky-aurora" />
              <p className="ml-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-base-text-secondary/50">
                Bước 2 / 2
              </p>
            </div>

            {/* Mood-based greeting */}
            {moodHint && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
              >
                <Heart size={12} className="shrink-0 text-pink-400/60" />
                <p className="text-[11px] text-base-text-secondary/60 italic">{moodHint}</p>
              </motion.div>
            )}
          </div>

          {/* ── Headline ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-5"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <Feather size={18} className="text-purple-300/70" />
              <h1 className="font-display text-xl font-bold text-base-text-primary">
                Viết ra điều đang ở trong lòng
              </h1>
            </div>
            <p className="text-[13px] text-base-text-secondary/60 leading-relaxed pl-[30px]">
              Không cần phải hay — chỉ cần thật. Ở đây không ai phán xét đâu.
            </p>
          </motion.div>

          {/* ── Writing area ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative mb-6"
          >
            {/* Rotating prompt hint — visible only when empty */}
            <AnimatePresence mode="wait">
              {showPromptHint && !hasContent && (
                <motion.div
                  key={promptIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-4 left-4 right-12 pointer-events-none z-0"
                >
                  <p className="text-[15px] text-base-text-secondary/30 leading-relaxed italic">
                    {PROMPTS[promptIdx]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              ref={textareaRef}
              value={draft.content}
              maxLength={CHAR_LIMIT}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder=""
              rows={6}
              className="w-full resize-none rounded-2xl border bg-white/[0.03] px-4 py-4 text-[15px] leading-[1.8] text-base-text-primary placeholder:text-transparent focus:outline-none transition-all duration-400"
              style={{
                borderColor: hasContent
                  ? (isStar ? "rgba(245,214,125,0.25)" : isBubble ? "rgba(79,209,197,0.25)" : "rgba(192,132,252,0.2)")
                  : "rgba(255,255,255,0.08)",
                boxShadow: hasContent
                  ? `0 0 24px ${isStar ? "rgba(245,214,125,0.08)" : isBubble ? "rgba(79,209,197,0.08)" : "rgba(192,132,252,0.06)"}`
                  : "none",
              }}
            />

            {/* Character count + progress */}
            <div className="mt-2 flex items-center justify-between px-1">
              <div className="flex-1 h-1 rounded-full bg-white/8 mr-3 overflow-hidden">
                {hasContent && (
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(draft.content.length / CHAR_LIMIT) * 100}%` }}
                    style={{
                      background: remaining < 30
                        ? "rgba(239,68,68,0.6)"
                        : isStar
                        ? "rgba(245,214,125,0.5)"
                        : isBubble
                        ? "rgba(79,209,197,0.5)"
                        : "rgba(192,132,252,0.4)",
                    }}
                  />
                )}
              </div>
              <span
                className={clsx(
                  "text-[11px] font-mono shrink-0 transition-colors",
                  remaining < 20
                    ? "text-red-400/80 font-semibold"
                    : remaining < 50
                    ? "text-amber-400/60"
                    : "text-base-text-secondary/30"
                )}
              >
                {remaining}
              </span>
            </div>
          </motion.div>

          {/* ── Destination chooser ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-6"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-base-text-secondary/50 flex items-center gap-1.5">
              <Sparkles size={11} className="text-purple-300/50" />
              Bạn muốn thả nó về đâu?
            </p>

            <div className="grid grid-cols-2 gap-3">
              {(["star", "bubble"] as const).map((type) => {
                const hint = DESTINATION_HINTS[type];
                const isSelected = draft.type === type;
                const Icon = type === "star" ? Star : Waves;

                return (
                  <motion.button
                    key={type}
                    onClick={() => setDraftType(type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="orb-btn relative overflow-hidden rounded-2xl border text-left transition-all duration-400"
                    style={{
                      minHeight: 0,
                      background: isSelected ? hint.bgGrad : "rgba(255,255,255,0.025)",
                      borderColor: isSelected ? `${hint.color}44` : "rgba(255,255,255,0.08)",
                      boxShadow: isSelected ? `0 0 20px ${hint.glowColor}` : "none",
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 shimmer-bg pointer-events-none"
                      />
                    )}
                    <div className="relative px-4 py-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm font-bold"
                          style={{ color: isSelected ? hint.color : "rgba(255,255,255,0.7)" }}
                        >
                          {hint.emoji} {hint.title}
                        </span>
                        <motion.div
                          animate={isSelected
                            ? type === "star"
                              ? { rotate: [0, 15, -10, 0], scale: [1, 1.2, 1] }
                              : { y: [0, -3, 0], scale: [1, 1.15, 1] }
                            : {}
                          }
                          transition={{
                            duration: type === "star" ? 0.5 : 0.6,
                            ...(type === "bubble" ? { repeat: Infinity, repeatDelay: 1.5 } : {}),
                          }}
                        >
                          <Icon
                            size={18}
                            style={{ color: isSelected ? hint.color : "rgba(255,255,255,0.3)" }}
                            fill={isSelected && type === "star" ? hint.color : "none"}
                          />
                        </motion.div>
                      </div>
                      <p className="text-[11px] leading-snug text-base-text-secondary/50">
                        {hint.subtitle}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* ── Spacer push CTA to bottom ── */}
          <div className="flex-1 min-h-4" />

          {/* ── CTA Button ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              {canSubmit ? (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  {/* Glow behind */}
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      background: isStar
                        ? "rgba(245,214,125,0.3)"
                        : "rgba(79,209,197,0.3)",
                      transform: "scale(1.2)",
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push("/ritual")}
                    className="orb-btn relative w-full overflow-hidden rounded-full py-4 text-[15px] font-bold text-white"
                    style={{
                      minHeight: 0,
                      background: isStar
                        ? "linear-gradient(135deg, #3A2E5C 0%, #C9A84C 50%, #F5D67D 100%)"
                        : "linear-gradient(135deg, #072034 0%, #0E4D5C 50%, #4FD1C5 100%)",
                      boxShadow: isStar
                        ? "0 0 28px rgba(245,214,125,0.35), 0 6px 20px rgba(0,0,0,0.35)"
                        : "0 0 28px rgba(79,209,197,0.3), 0 6px 20px rgba(0,0,0,0.35)",
                    }}
                  >
                    <span className="absolute inset-0 shimmer-bg pointer-events-none" style={{ borderRadius: "inherit" }} />
                    <span className="relative flex items-center justify-center gap-2">
                      {isStar ? "✦ Thả ngôi sao của bạn lên trời" : "◎ Thả bong bóng xuống biển"}
                      <motion.span
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-full border border-dashed border-white/10 py-4 text-center text-sm text-base-text-secondary/35"
                >
                  {!hasContent && !draft.type
                    ? "Viết gì đó rồi chọn nơi thả nhé..."
                    : !hasContent
                    ? "Hãy viết ra điều bạn đang nghĩ..."
                    : "Chọn bầu trời hoặc đại dương để tiếp tục"}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Privacy footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.7 }}
            className="mt-5 text-center text-[10px] text-base-text-secondary"
          >
            🔒 Ẩn danh hoàn toàn · Không ai biết bạn là ai
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
