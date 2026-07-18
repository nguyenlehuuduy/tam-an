"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Story, warmthLabel } from "@/lib/mockSignals";
import { ReactionKind } from "@/context/AppStateContext";
import { VIBE_ACCENT_COLORS } from "@/lib/identity";
import { IdentityIconGlyph } from "@/components/onboarding/AnonymousIdentityBadge";
import { ReactionPicker } from "./ReactionPicker";
import { useAppState } from "@/context/AppStateContext";
import { useLanguage } from "@/context/LanguageContext";
import { moderateContent } from "@/lib/moderation";
import { HotlineBanner } from "@/components/ui/HotlineBanner";
import { playSendReaction } from "@/lib/sound";
import {
  Sparkles,
  Star,
  Waves,
  Send,
  Smile,
  HeartHandshake,
  Gift,
  MessageCircle,
  Sticker,
} from "lucide-react";

interface SignalCardProps {
  signal: Story;
}

const MAX_MSG = 300;

const SKY_SUGGESTIONS = [
  "Tớ luôn ở đây lắng nghe cậu. ✨",
  "Cậu đã làm rất tốt rồi, đừng quá gồng mình nhé. 🫂",
  "Mọi giông bão rồi sẽ qua, ngày mai tớ vẫn ở đây. 🌙",
  "Cảm ơn cậu đã dũng cảm chia sẻ điều này. ✦",
  "Chậm lại một chút cũng không sao đâu cậu. ☕",
  "Cầu mong tối nay cậu sẽ có một giấc ngủ bình yên. 💤",
  "Bạn xứng đáng được trân trọng và lắng nghe. ❤️",
  "Những mệt mỏi này rồi sẽ hóa thành sức mạnh thôi. ⭐",
];

const OCEAN_SUGGESTIONS = [
  "Hãy cứ để mọi muộn phiền trôi đi theo dòng nước. 🌊",
  "Hôm nay vất vả rồi, nghỉ tay uống một cốc nước ấm nhé. 🍵",
  "Biển cả giữ bí mật cho cậu, cậu không cô đơn đâu. 🫂",
  "Mọi chuyện rồi sẽ nhẹ nhõm hơn vào ngày mai thôi. 🫧",
  "Hãy dịu dàng với chính mình hơn một chút cậu nhé. 💙",
  "Tớ tin cậu sẽ vượt qua được bến bờ này. ⛵",
  "Không sao đâu, khóc một chút rồi mai ta lại mỉm cười. 🐬",
  "Lời tâm sự của cậu đã được đại dương ôm trọn rồi. 🐚",
];

// =====================================================
// MODULE 3.2 — Phản hồi đa dạng, không chỉ preset text.
// 5 hình thức: Cảm xúc nhanh / Sticker / Ôm / Món quà / Lời nhắn.
// Nguyên tắc an toàn: 4 hình thức đầu KHÔNG có ô nhập text tự do (giảm
// nguy cơ bully) — chỉ "Lời nhắn" mới có, và text đó vẫn qua moderation.
// =====================================================
type ReactionCategory = "emotion" | "sticker" | "hug" | "gift" | "message";

const CATEGORY_META: { key: ReactionCategory; i18nKey: string; icon: typeof Smile }[] = [
  { key: "emotion", i18nKey: "reactions.categories.emotion", icon: Smile },
  { key: "sticker", i18nKey: "reactions.categories.sticker", icon: Sticker },
  { key: "hug", i18nKey: "reactions.categories.hug", icon: HeartHandshake },
  { key: "gift", i18nKey: "reactions.categories.gift", icon: Gift },
  { key: "message", i18nKey: "reactions.categories.message", icon: MessageCircle },
];

const QUICK_EMOTIONS = [
  { key: "warm", emoji: "💙", i18nKey: "reactions.quickEmotions.warm" },
  { key: "grow", emoji: "🌱", i18nKey: "reactions.quickEmotions.grow" },
  { key: "shine", emoji: "✨", i18nKey: "reactions.quickEmotions.shine" },
  { key: "hope", emoji: "🌈", i18nKey: "reactions.quickEmotions.hope" },
];

const STICKERS = [
  { key: "hug-sticker", emoji: "🫂", i18nKey: "reactions.stickers.hugSticker" },
  { key: "moon", emoji: "🌙", i18nKey: "reactions.stickers.moon" },
  { key: "wave", emoji: "🌊", i18nKey: "reactions.stickers.wave" },
  { key: "candle", emoji: "🕯️", i18nKey: "reactions.stickers.candle" },
  { key: "star-sticker", emoji: "⭐", i18nKey: "reactions.stickers.starSticker" },
  { key: "letter", emoji: "💌", i18nKey: "reactions.stickers.letter" },
  { key: "gift-sticker", emoji: "🎁", i18nKey: "reactions.stickers.giftSticker" },
];

const GIFTS = [
  { key: "star-mini", emoji: "✦", labelKey: "reactions.gifts.starMiniLabel", descKey: "reactions.gifts.starMiniDesc" },
  { key: "light-bubble", emoji: "◎", labelKey: "reactions.gifts.lightBubbleLabel", descKey: "reactions.gifts.lightBubbleDesc" },
  { key: "petal", emoji: "🌸", labelKey: "reactions.gifts.petalLabel", descKey: "reactions.gifts.petalDesc" },
];

function doneCopy(kind: ReactionKind | null, usedMessage: boolean, isStar: boolean, t: (path: string) => string) {
  switch (kind) {
    case "emotion":
      return { title: t("reactions.done.emotionTitle"), subtitle: t("reactions.done.emotionSubtitle") };
    case "sticker":
      return { title: t("reactions.done.stickerTitle"), subtitle: t("reactions.done.stickerSubtitle") };
    case "hug":
      return { title: t("reactions.done.hugTitle"), subtitle: t("reactions.done.hugSubtitle") };
    case "gift":
      return {
        title: t("reactions.done.giftTitle"),
        subtitle: `${isStar ? "Ngôi sao này" : "Bong bóng này"} vừa được thắp sáng thêm một chút.`,
      };
    case "message":
      return usedMessage
        ? {
            title: "Lời động viên của bạn đã bay đi ✨",
            subtitle: `Năng lượng ấm áp của bạn đã truyền đến họ. ${isStar ? "Ngôi sao này" : "Bong bóng này"} giờ đây đã sáng rực rỡ hơn rất nhiều!`,
          }
        : {
            title: "Tia sáng của bạn đã chạm tới họ ✨",
            subtitle: `Dù không nói thành lời, sự quan tâm của bạn đã làm ${isStar ? "ngôi sao này" : "bong bóng này"} bừng sáng lấp lánh hơn hẳn!`,
          };
    default:
      return {
        title: "Tia sáng của bạn đã chạm tới họ ✨",
        subtitle: "Sự quan tâm của bạn đã được gửi đến rồi.",
      };
  }
}

export function SignalCard({ signal }: SignalCardProps) {
  const { sendReaction, soundEnabled } = useAppState();
  const { t } = useLanguage();
  const isStar = signal.type === "star";

  const isLowMood = signal.moodAtRelease !== null && signal.moodAtRelease <= 3;
  const [category, setCategory] = useState<ReactionCategory>("message");
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messagePhase, setMessagePhase] = useState<"pick" | "write">("pick");

  const [sentInfo, setSentInfo] = useState<{ kind: ReactionKind; usedMessage: boolean } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [poppedKey, setPoppedKey] = useState<string | null>(null);
  const [hugPulse, setHugPulse] = useState(0);

  const accentColor = isStar ? "#F5D67D" : "#4FD1C5";
  const accentGlow = isStar ? "rgba(245, 214, 125, 0.25)" : "rgba(79, 209, 197, 0.25)";

  const trimmedMsg = message.trim();
  const messageModeration = useMemo(
    () => (trimmedMsg.length > 0 ? moderateContent(trimmedMsg) : null),
    [trimmedMsg]
  );
  const isMessageFlagged = messageModeration?.highRisk ?? false;

  // Màn "đã gửi" chỉ là một xác nhận TẠM THỜI ngay sau khi gửi — không
  // khoá vĩnh viễn câu chuyện này nữa. Người dùng có thể gửi tiếp nhiều
  // tia sáng/lời nhắn khác nhau tới cùng một ngôi sao/bong bóng (xem nút
  // "Gửi thêm" bên dưới màn done).
  const showDone = sentInfo !== null;

  function resetForAnotherSend() {
    setSentInfo(null);
    setSelectedKey(null);
    setMessage("");
    setMessagePhase("pick");
  }

  function fireQuick(kind: ReactionKind, key: string) {
    if (showDone) return;
    if (kind === "sticker") {
      setPoppedKey(key);
      setTimeout(() => setPoppedKey(null), 700);
    }
    if (kind === "hug") {
      setHugPulse((p) => p + 1);
    }
    const ok = sendReaction(signal.id, kind, false);
    if (!ok) {
      setBlocked(true);
      return;
    }
    if (soundEnabled) playSendReaction();
    // Cho hiệu ứng nhỏ kịp chạy trước khi chuyển sang màn "đã gửi"
    setTimeout(() => setSentInfo({ kind, usedMessage: false }), kind === "hug" ? 550 : 300);
  }

  function handlePickMessagePreset(key: string) {
    if (showDone) return;
    setSelectedKey(key);
    setMessagePhase("write");
  }

  function handleSend() {
    if (!selectedKey || isMessageFlagged) return;
    const hasMsg = trimmedMsg.length > 0;
    const ok = sendReaction(signal.id, "message", hasMsg);
    if (!ok) {
      setBlocked(true);
      return;
    }
    if (soundEnabled) playSendReaction();
    setSentInfo({ kind: "message", usedMessage: hasMsg });
  }

  function handleSkipMessage() {
    if (!selectedKey) return;
    const ok = sendReaction(signal.id, "message", false);
    if (!ok) {
      setBlocked(true);
      return;
    }
    if (soundEnabled) playSendReaction();
    setSentInfo({ kind: "message", usedMessage: false });
  }

  const msgPlaceholder = isStar
    ? "Ví dụ: \"Mình cũng từng thế này. Bạn không một mình đâu...\""
    : "Ví dụ: \"Hãy cứ để nó trôi đi — ngày mai sẽ nhẹ hơn hôm nay\"";

  const done = doneCopy(sentInfo?.kind ?? null, sentInfo?.usedMessage ?? false, isStar, t);

  // Author badge — snapshot ẩn danh tại thời điểm thả (spec 2.1). Guest có
  // icon preset, Registered chỉ có vibe (không lộ avatar AI thật của họ ở
  // đây để tránh việc người khác lần theo avatar nhận diện tác giả xuyên
  // suốt nhiều câu chuyện — chỉ 1 chấm màu theo vibe).
  const authorAccent = VIBE_ACCENT_COLORS[signal.author.vibe] || accentColor;

  return (
    <div className="signal-envelope-open">
      {/* === HEADER === */}
      <div className="mb-4 flex items-center gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{
            background: isStar
              ? "radial-gradient(circle at 35% 35%, #F5D67D, #8B6200)"
              : "radial-gradient(circle at 35% 35%, #4FD1C5, #072034)",
            boxShadow: `0 0 20px 5px ${accentGlow}`,
          }}
        >
          {isStar ? (
            <Star size={20} fill="#FFF3D0" className="text-sky-glow" />
          ) : (
            <Waves size={20} className="text-ocean-foam" />
          )}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ background: accentGlow }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            {isStar ? "✦ Nhặt được từ bầu trời" : "◎ Nổi lên từ đại dương"}
          </p>
          <p className="text-[11px] text-base-text-secondary mt-0.5">
            {signal.createdAgo} · {warmthLabel(signal.warmth)}
          </p>
        </motion.div>
      </div>

      {/* === AUTHOR IDENTITY BADGE (ẩn danh) === */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
        style={{
          borderColor: `${authorAccent}33`,
          background: `${authorAccent}0f`,
        }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: `${authorAccent}22`, color: authorAccent }}
        >
          {signal.author.icon ? (
            <IdentityIconGlyph icon={signal.author.icon} size={11} />
          ) : (
            <span className="block h-2 w-2 rounded-full" style={{ background: authorAccent }} />
          )}
        </span>
        <span className="text-[11px] font-semibold text-base-text-secondary/80">
          {signal.author.name}
        </span>
      </motion.div>

      {/* Divider */}
      <div
        className="mb-5 h-px w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}55, transparent)` }}
      />

      {/* === CONTENT — POEM LIKE === */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 relative pl-3"
      >
        <span
          className="absolute -top-3 -left-1 text-5xl leading-none opacity-15 font-serif select-none"
          style={{ color: accentColor }}
        >
          "
        </span>
        <p className="text-[16px] leading-8 text-base-text-primary font-medium">
          {signal.content}
        </p>
        <span
          className="absolute -bottom-4 right-0 text-5xl leading-none opacity-15 font-serif select-none"
          style={{ color: accentColor }}
        >
          "
        </span>
      </motion.div>

      {/* === REACTION SECTION === */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-8"
      >
        <AnimatePresence mode="wait">
          {showDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="flex flex-col items-center gap-3 rounded-2xl py-5 px-4 text-center"
              style={{
                background: "rgba(255,180,162,0.08)",
                border: "1px solid rgba(255,180,162,0.2)",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.4, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "rgba(255,180,162,0.15)" }}
              >
                <Sparkles size={24} className="text-warm" />
              </motion.div>
              <div>
                <p className="text-sm font-bold text-base-text-primary">{done.title}</p>
                <p className="mt-1 text-xs text-base-text-secondary leading-relaxed">{done.subtitle}</p>
              </div>

              {/* Cho phép gửi thêm — một người có thể gửi nhiều tia sáng/lời
                  nhắn tới cùng một câu chuyện, không chỉ một lần duy nhất */}
              <button
                onClick={resetForAnotherSend}
                className="orb-btn mt-1 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
                style={{
                  minHeight: 0,
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                  background: `${accentColor}12`,
                }}
              >
                ✦ Gửi thêm một tia sáng nữa
              </button>
            </motion.div>
          ) : blocked ? (
            <motion.div
              key="blocked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] py-5 px-4 text-center"
            >
              <p className="text-sm font-bold text-base-text-primary">
                Bạn đã gửi khá nhiều tia sáng hôm nay rồi 🌙
              </p>
              <p className="mt-1 text-xs text-base-text-secondary leading-relaxed">
                Để giữ không gian này lành mạnh cho tất cả mọi người, mỗi ngày chỉ gửi được một số
                lượng nhất định. Quay lại vào ngày mai nhé.
              </p>
            </motion.div>
          ) : (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Gợi ý theo mood — Module 4.3: đọc story mood thấp thì gợi ý
                  phản hồi phù hợp thay vì lời khuyên */}
              <AnimatePresence>
                {isLowMood && !suggestionDismissed && category !== "hug" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                  >
                    <span className="text-sm shrink-0">🫂</span>
                    <p className="flex-1 text-[11px] leading-snug text-base-text-secondary/70">
                      Câu chuyện này có vẻ nặng lòng — một cái ôm có thể ấm hơn một lời khuyên.
                    </p>
                    <button
                      onClick={() => setCategory("hug")}
                      className="orb-btn shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold text-base-text-primary hover:bg-white/15 transition-colors"
                      style={{ minHeight: 0 }}
                    >
                      Chọn Ôm
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Category tabs */}
              <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
                {CATEGORY_META.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className="orb-btn flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all"
                      style={{
                        minHeight: 0,
                        borderColor: active ? `${accentColor}55` : "rgba(255,255,255,0.08)",
                        background: active ? `${accentColor}18` : "rgba(255,255,255,0.02)",
                        color: active ? accentColor : "rgba(255,255,255,0.5)",
                      }}
                    >
                      <Icon size={12} />
                      {t(c.i18nKey)}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {/* ---- Cảm xúc nhanh — quick tap, không cần bước xác nhận ---- */}
                {category === "emotion" && (
                  <motion.div
                    key="emotion"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-4 gap-2"
                  >
                    {QUICK_EMOTIONS.map((e) => (
                      <motion.button
                        key={e.key}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fireQuick("emotion", e.key)}
                        className="orb-btn flex flex-col items-center gap-1 rounded-2xl border border-white/8 bg-white/[0.02] py-3 hover:bg-white/[0.06] hover:border-white/15 transition-all"
                        style={{ minHeight: 0 }}
                      >
                        <span className="text-2xl leading-none">{e.emoji}</span>
                        <span className="text-[9px] leading-tight text-base-text-secondary/60 text-center">
                          {t(e.i18nKey)}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* ---- Sticker — animation bay lên khi gửi ---- */}
                {category === "sticker" && (
                  <motion.div
                    key="sticker"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-4 gap-2"
                  >
                    {STICKERS.map((s) => (
                      <motion.button
                        key={s.key}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fireQuick("sticker", s.key)}
                        className="orb-btn relative flex flex-col items-center gap-1 rounded-2xl border border-white/8 bg-white/[0.02] py-3 hover:bg-white/[0.06] hover:border-white/15 transition-all overflow-visible"
                        style={{ minHeight: 0 }}
                      >
                        <AnimatePresence>
                          {poppedKey === s.key && (
                            <motion.span
                              key="pop"
                              initial={{ opacity: 1, y: 0, scale: 1 }}
                              animate={{ opacity: 0, y: -46, scale: 1.7 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                              className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-2xl z-10"
                            >
                              {s.emoji}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <span className="text-2xl leading-none">{s.emoji}</span>
                        <span className="text-[9px] leading-tight text-base-text-secondary/60 text-center">
                          {t(s.i18nKey)}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* ---- Virtual hug — 1 hành động, không cần text ---- */}
                {category === "hug" && (
                  <motion.div
                    key="hug"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-2"
                  >
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => fireQuick("hug", "tight-hug")}
                      className="orb-btn relative flex h-24 w-24 items-center justify-center rounded-full text-4xl"
                      style={{
                        minHeight: 0,
                        background: "radial-gradient(circle at 35% 35%, rgba(255,180,162,0.35), rgba(255,180,162,0.08))",
                        border: "1px solid rgba(255,180,162,0.35)",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={`${hugPulse}-${i}`}
                          className="absolute inset-0 rounded-full pointer-events-none"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 1.9 + i * 0.3, opacity: 0 }}
                          transition={{ duration: 1.1, delay: i * 0.15, ease: "easeOut" }}
                          style={{ border: "1.5px solid rgba(255,180,162,0.5)" }}
                        />
                      ))}
                      🫂
                    </motion.button>
                    <p className="text-[11px] text-base-text-secondary/60 text-center max-w-[220px]">
                      {t("reactions.hug.caption")}
                    </p>
                  </motion.div>
                )}

                {/* ---- Món quà ẩn dụ — tăng warmth của story ---- */}
                {category === "gift" && (
                  <motion.div
                    key="gift"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-2"
                  >
                    {GIFTS.map((g) => (
                      <motion.button
                        key={g.key}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => fireQuick("gift", g.key)}
                        className="orb-btn flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-3.5 py-2.5 text-left hover:bg-white/[0.06] hover:border-white/15 transition-all"
                        style={{ minHeight: 0 }}
                      >
                        <span className="text-xl leading-none shrink-0">{g.emoji}</span>
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-semibold text-base-text-primary">
                            {t(g.labelKey)}
                          </span>
                          <span className="block text-[10.5px] text-base-text-secondary/55 leading-snug">
                            {t(g.descKey)}
                          </span>
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* ---- Lời nhắn — preset + tuỳ chọn viết ngắn, có moderation ---- */}
                {category === "message" && messagePhase === "pick" && (
                  <motion.div key="message-pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-base-text-secondary">
                      Gửi một tia sáng ấm áp:
                    </p>
                    <ReactionPicker selectedKey={selectedKey} onSelect={handlePickMessagePreset} />
                  </motion.div>
                )}

                {category === "message" && messagePhase === "write" && (
                  <motion.div
                    key="message-write"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col gap-4"
                  >
                    <div
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <Sparkles size={13} className="text-warm shrink-0" />
                      <span className="text-base-text-secondary text-[11px]">
                        Đã nhận diện cảm xúc — đính kèm thêm lời nhắn gửi để làm họ vui lên nhé?
                      </span>
                    </div>

                    <div className="relative">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
                        placeholder={msgPlaceholder}
                        rows={3}
                        className="w-full resize-none rounded-2xl border bg-base-surface/60 px-4 py-3 text-sm leading-relaxed text-base-text-primary placeholder:text-base-text-secondary/40 focus:outline-none transition-all duration-300"
                        style={{
                          borderColor: isMessageFlagged
                            ? "rgba(239,68,68,0.5)"
                            : trimmedMsg
                            ? `${accentColor}aa`
                            : "rgba(255,255,255,0.1)",
                          boxShadow: trimmedMsg && !isMessageFlagged ? `0 0 16px 3px ${accentGlow}` : "none",
                        }}
                        autoFocus
                      />
                      <div
                        className={`absolute bottom-2.5 right-3 text-[10px] font-mono ${
                          MAX_MSG - message.length < 20 ? "text-critical font-bold" : "text-base-text-secondary/40"
                        }`}
                      >
                        {MAX_MSG - message.length}
                      </div>
                    </div>

                    {/* Moderation — text tuỳ chọn vẫn được kiểm duyệt (nguyên tắc an toàn 3.2) */}
                    {isMessageFlagged && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] text-caution leading-relaxed">
                          Lời nhắn này có vài từ khiến mình hơi lo cho bạn. Bạn có thể chỉnh sửa lại,
                          hoặc chỉ cần gửi tia sáng mà không kèm lời nhắn cũng được.
                        </p>
                        <HotlineBanner />
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-base-text-secondary/55 flex items-center gap-1.5 select-none">
                        <span>✨ Lời vỗ về tâm hồn gợi ý:</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                        {(isStar ? SKY_SUGGESTIONS : OCEAN_SUGGESTIONS).map((s, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setMessage(s)}
                            className="text-left text-[11px] px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-base-text-secondary hover:text-base-text-primary hover:bg-white/[0.06] hover:border-white/10 transition-all select-none"
                            style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.1)", minHeight: 0 }}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2.5 mt-1">
                      <button
                        onClick={handleSkipMessage}
                        className="orb-btn flex-1 rounded-full border border-base-divider py-2.5 text-xs text-base-text-secondary hover:bg-white/5 hover:text-base-text-primary transition-colors"
                        style={{ minHeight: 0 }}
                      >
                        Bỏ qua
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                        disabled={isMessageFlagged}
                        className="orb-btn flex flex-[2] items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-base-text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          minHeight: 0,
                          background:
                            trimmedMsg && !isMessageFlagged
                              ? `linear-gradient(135deg, ${isStar ? "#3A2E5C, #F5D67D" : "#072034, #4FD1C5"})`
                              : "rgba(255,255,255,0.08)",
                          boxShadow: trimmedMsg && !isMessageFlagged ? `0 0 20px 4px ${accentGlow}` : "none",
                        }}
                      >
                        <Send size={14} />
                        {trimmedMsg ? "Gửi lời động viên ✦" : "Gửi tia sáng"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
