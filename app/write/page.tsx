"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Waves, ChevronLeft, Sparkles, Feather, Heart, Headphones, Settings, Lock } from "lucide-react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SupportButton } from "@/components/ui/SupportButton";
import clsx from "clsx";

const CHAR_LIMIT = 300;

// =====================================================
// Module 2.2 — Không còn ép viết trước khi đi tiếp.
// /write giờ có 2 pha: "intro" (hero cảm xúc + dual CTA)
// và "compose" (chỉ mở ra khi user chọn "Mình muốn chia sẻ").
// =====================================================
type Phase = "intro" | "compose";
type MoodTier = "heavy" | "neutral" | "light";

/** Nội dung hero — thay đổi theo mood vừa check-in, để lời mời luôn đúng nhịp cảm xúc */
const HERO_CONTENT: Record<MoodTier, { eyebrow: string; title: string; subtitle: string; accent: string; glow: string }> = {
  heavy: {
    eyebrow: "Mình nghe thấy bạn",
    title: "Hôm nay có vẻ không dễ dàng...",
    subtitle:
      "Bạn không cần phải ổn ngay bây giờ. Có thể đặt xuống một phần điều đang đè nặng ở đây — hoặc chỉ cần ở lại và lắng nghe người khác một lúc.",
    accent: "#A78BFA",
    glow: "rgba(167,139,250,0.18)",
  },
  neutral: {
    eyebrow: "Một khoảnh khắc cho riêng bạn",
    title: "Có điều gì đang ở trong lòng không?",
    subtitle:
      "Không cần phải là chuyện lớn. Một dòng thôi cũng đủ để nhẹ hơn — hoặc bạn có thể chỉ ghé qua lắng nghe hôm nay.",
    accent: "#7C9EFF",
    glow: "rgba(124,158,255,0.16)",
  },
  light: {
    eyebrow: "Cảm ơn vì đã ghé qua",
    title: "Hôm nay có gì tích cực muốn kể không?",
    subtitle:
      "Chia sẻ điều tốt đẹp cũng là một món quà cho ai đó đang cần nghe điều đó — hoặc bạn có thể lặng lẽ lắng nghe câu chuyện của người khác.",
    accent: "#F5D67D",
    glow: "rgba(245,214,125,0.16)",
  },
};

/** Gợi ý viết — xoay theo mood để luôn chạm đúng cảm xúc hiện tại */
const PROMPT_SETS: Record<MoodTier, string[]> = {
  heavy: [
    "Điều đang đè nặng mình lúc này là...",
    "Nếu có thể nói ra, mình muốn nói rằng...",
    "Mình đang cố gắng vượt qua...",
    "Có một nỗi buồn mình chưa kể với ai...",
    "Lúc này, điều mình cần nhất là...",
  ],
  neutral: [
    "Hôm nay mình muốn kể rằng...",
    "Có một điều mình chưa nói với ai...",
    "Lúc này mình đang cảm thấy...",
    "Nếu được quay lại hôm qua, mình sẽ...",
    "Điều nhỏ nhưng ám ảnh mình gần đây là...",
    "Mình ước có ai đó hiểu rằng...",
  ],
  light: [
    "Điều khiến hôm nay dễ chịu hơn là...",
    "Mình biết ơn vì...",
    "Một điều nhỏ làm mình mỉm cười hôm nay...",
    "Mình muốn chia sẻ niềm vui này với ai đó...",
    "Gần đây có một điều tốt đẹp là...",
  ],
};

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
  const { draft, setDraftContent, setDraftType, mood, identity } = useAppState();
  const [phase, setPhase] = useState<Phase>("intro");
  const [promptIdx, setPromptIdx] = useState(0);
  const [showPromptHint, setShowPromptHint] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevHasContentRef = useRef(false);

  const moodTier: MoodTier = mood !== null && mood <= 3 ? "heavy" : mood !== null && mood >= 7 ? "light" : "neutral";
  const hero = HERO_CONTENT[moodTier];
  const prompts = PROMPT_SETS[moodTier];

  const remaining = CHAR_LIMIT - draft.content.length;
  const isStar = draft.type === "star";
  const isBubble = draft.type === "bubble";
  const hasContent = draft.content.trim().length > 0;
  const canSubmit = draft.type !== null && hasContent;
  const isComposing = phase === "compose";

  // Xoay gợi ý mỗi 4s (chỉ khi textarea trống)
  useEffect(() => {
    if (hasContent || !isComposing) return;
    const t = setInterval(() => {
      setPromptIdx((p) => (p + 1) % prompts.length);
    }, 4000);
    return () => clearInterval(t);
  }, [hasContent, isComposing, prompts.length]);

  // Reset gợi ý khi mood tier đổi (hiếm khi, nhưng an toàn)
  useEffect(() => {
    setPromptIdx(0);
  }, [moodTier]);

  // Tự focus textarea khi vừa mở compose
  useEffect(() => {
    if (!isComposing) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 500);
    return () => clearTimeout(t);
  }, [isComposing]);

  // Ẩn prompt hint khi bắt đầu gõ
  useEffect(() => {
    if (hasContent) setShowPromptHint(false);
    else setShowPromptHint(true);
  }, [hasContent]);

  // Micro-celebration — khoảnh khắc gõ chữ đầu tiên, khích lệ hành vi chia sẻ
  useEffect(() => {
    if (hasContent && !prevHasContentRef.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1100);
      prevHasContentRef.current = true;
      return () => clearTimeout(t);
    }
    prevHasContentRef.current = hasContent;
  }, [hasContent]);

  function handleBack() {
    if (isComposing) {
      setPhase("intro");
    } else {
      router.back();
    }
  }

  function handleListenOnly() {
    router.push("/explore?from=listen");
  }

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

      {/* Ambient glow per destination (chỉ khi đang compose) */}
      <AnimatePresence>
        {isComposing && isStar && (
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
        {isComposing && isBubble && (
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
        {!isComposing && (
          <motion.div
            key="hero-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-80 w-[90%] rounded-full blur-3xl"
            style={{ background: `radial-gradient(ellipse, ${hero.glow} 0%, transparent 70%)` }}
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
            onClick={handleBack}
            className="orb-btn flex items-center gap-1.5 text-sm text-base-text-secondary/70 hover:text-base-text-primary transition-colors py-1"
            style={{ minHeight: 0 }}
          >
            <ChevronLeft size={16} />
            <span className="text-xs">Quay lại</span>
          </button>
          <div className="flex items-center gap-1.5">
            <AnonymousIdentityBadge compact />
            <SupportButton />
            <NotificationBell />
            <Link
              href="/settings"
              aria-label="Cài đặt"
              className="orb-btn flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-base-text-secondary/60 hover:bg-white/10 hover:text-base-text-primary transition-colors"
              style={{ minHeight: 0 }}
            >
              <Settings size={14} />
            </Link>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {!isComposing ? (
            // ================================================
            // PHA 1 — HERO CẢM XÚC + DUAL CTA
            // ================================================
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="flex flex-1 flex-col"
            >
              <div className="flex flex-1 flex-col items-center justify-center text-center gap-6 py-6">
                {/* Illustration — orb thở nhẹ, màu theo mood */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
                  className="relative flex h-28 w-28 items-center justify-center rounded-full"
                  style={{
                    background: `radial-gradient(circle at 38% 35%, ${hero.accent}33, transparent 72%)`,
                    border: `1px solid ${hero.accent}33`,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{ boxShadow: [`0 0 24px ${hero.glow}`, `0 0 48px ${hero.glow}`, `0 0 24px ${hero.glow}`] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <Feather size={30} style={{ color: hero.accent }} className="opacity-80" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="flex flex-col gap-2.5"
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.25em]"
                    style={{ color: hero.accent }}
                  >
                    {hero.eyebrow}
                  </p>
                  <h1 className="font-display text-2xl font-black leading-snug text-base-text-primary px-2">
                    {hero.title}
                  </h1>
                  <p className="text-[13px] leading-relaxed text-base-text-secondary/60 px-3">
                    {hero.subtitle}
                  </p>
                </motion.div>
              </div>

              {/* Dual CTA */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col gap-3 pb-2"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPhase("compose")}
                  className="orb-btn relative w-full overflow-hidden rounded-full py-4 text-[15px] font-bold text-white"
                  style={{
                    minHeight: 0,
                    background: `linear-gradient(135deg, #2D1F5E 0%, ${hero.accent} 130%)`,
                    boxShadow: `0 0 28px ${hero.glow}, 0 6px 20px rgba(0,0,0,0.35)`,
                  }}
                >
                  <span className="absolute inset-0 shimmer-bg pointer-events-none" style={{ borderRadius: "inherit" }} />
                  <span className="relative flex items-center justify-center gap-2">
                    <Sparkles size={16} />
                    Mình muốn chia sẻ
                  </span>
                </motion.button>

                <button
                  onClick={handleListenOnly}
                  className="orb-btn flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13px] font-medium text-base-text-secondary/50 hover:text-base-text-secondary/80 transition-colors"
                  style={{ minHeight: 0 }}
                >
                  <Headphones size={14} />
                  Hôm nay mình chỉ muốn lắng nghe
                </button>

                {/* Báo trước NGAY TỪ ĐẦU (không phải chỉ ở cuối sau khi đã
                    viết xong) — để Guest quyết định sớm, tránh cảm giác đầu
                    tư công sức viết rồi mới gặp tường chắn đăng nhập. Viết
                    vẫn hoàn toàn tự do, không mất gì nếu chưa muốn đăng nhập. */}
                {identity.kind === "guest" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="flex items-center justify-center gap-1.5 text-center text-[10.5px] leading-relaxed text-base-text-secondary/45"
                  >
                    <Lock size={10} className="shrink-0" />
                    Viết thoải mái trước — bước thả cuối cùng sẽ cần đăng nhập để bạn nhận thông báo khi có người phản hồi
                  </motion.p>
                )}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 0.7 }}
                className="mt-4 text-center text-[10px] text-base-text-secondary"
              >
                🔒 Ẩn danh hoàn toàn · Không ai biết bạn là ai
              </motion.p>
            </motion.div>
          ) : (
            // ================================================
            // PHA 2 — VIẾT + CHỌN NƠI THẢ
            // ================================================
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              {/* Mood-based greeting nhỏ */}
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-5 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 w-fit"
              >
                <Heart size={12} className="shrink-0 text-pink-400/60" />
                <p className="text-[11px] text-base-text-secondary/60 italic">{hero.eyebrow}</p>
              </motion.div>

              {/* ── Headline ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mb-5"
              >
                <h1 className="font-display text-xl font-bold text-base-text-primary mb-1.5">
                  Viết ra điều đang ở trong lòng
                </h1>
                <p className="text-[13px] text-base-text-secondary/60 leading-relaxed">
                  Không cần phải hay — chỉ cần thật. Ở đây không ai phán xét đâu.
                </p>
              </motion.div>

              {/* ── Writing area ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
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
                      <p className="text-[15px] text-base-text-secondary/35 leading-relaxed italic">
                        {prompts[promptIdx]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Micro-celebration khi vừa bắt đầu gõ */}
                <AnimatePresence>
                  {celebrate && (
                    <motion.div
                      key="celebrate"
                      initial={{ opacity: 0, y: 4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="absolute -top-8 right-1 z-20 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: hero.accent,
                      }}
                    >
                      <Sparkles size={10} />
                      Cứ viết tiếp nhé
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.textarea
                  ref={textareaRef}
                  value={draft.content}
                  maxLength={CHAR_LIMIT}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Cứ viết những gì bạn đang nghĩ..."
                  rows={6}
                  animate={celebrate ? { scale: [1, 1.008, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
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

                {/* Character count — chỉ hiện khi gần hết, không áp lực bằng thanh progress to */}
                <AnimatePresence>
                  {remaining < 60 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-1.5 flex justify-end px-1"
                    >
                      <span
                        className={clsx(
                          "text-[10px] font-mono",
                          remaining < 20 ? "text-red-400/70 font-semibold" : "text-base-text-secondary/35"
                        )}
                      >
                        còn {remaining} ký tự
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ── Destination chooser ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
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
                transition={{ delay: 0.35, duration: 0.5 }}
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
                transition={{ delay: 0.6 }}
                className="mt-5 text-center text-[10px] text-base-text-secondary"
              >
                🔒 Ẩn danh hoàn toàn · Không ai biết bạn là ai
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
