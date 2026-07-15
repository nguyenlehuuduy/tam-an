"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Signal, warmthLabel } from "@/lib/mockSignals";
import { ReactionPicker } from "./ReactionPicker";
import { useAppState } from "@/context/AppStateContext";
import { playSendReaction } from "@/lib/sound";
import { Sparkles, Star, Waves, Send } from "lucide-react";

interface SignalCardProps {
  signal: Signal;
}

const MAX_MSG = 120;

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

export function SignalCard({ signal }: SignalCardProps) {
  const { reactedSignalIds, sendReaction, soundEnabled } = useAppState();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<"pick" | "write" | "done">("pick");
  const alreadyReacted = reactedSignalIds.includes(signal.id);
  const isStar = signal.type === "star";

  const accentColor = isStar ? "#F5D67D" : "#4FD1C5";
  const accentGlow = isStar ? "rgba(245, 214, 125, 0.25)" : "rgba(79, 209, 197, 0.25)";

  function handlePickReaction(key: string) {
    if (alreadyReacted) return;
    setSelectedKey(key);
    // Sau khi chọn preset → chuyển sang bước viết lời động viên
    setPhase("write");
  }

  function handleSend() {
    if (!selectedKey) return;
    const hasMsg = message.trim().length > 0;
    sendReaction(signal.id, hasMsg);
    if (soundEnabled) playSendReaction();
    setPhase("done");
  }

  function handleSkipMessage() {
    if (!selectedKey) return;
    sendReaction(signal.id, false);
    if (soundEnabled) playSendReaction();
    setPhase("done");
  }

  // Placeholder cho textarea theo loại signal
  const msgPlaceholder = isStar
    ? "Ví dụ: \"Mình cũng từng thế này. Bạn không một mình đâu...\""
    : "Ví dụ: \"Hãy cứ để nó trôi đi — ngày mai sẽ nhẹ hơn hôm nay\"";

  return (
    <div className="signal-envelope-open">
      {/* === HEADER === */}
      <div className="mb-5 flex items-center gap-3">
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

          {/* Phase: done */}
          {(phase === "done" || alreadyReacted) ? (
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
                <p className="text-sm font-bold text-base-text-primary">
                  {message.trim() ? "Lời động viên của bạn đã bay đi ✨" : "Tia sáng của bạn đã chạm tới họ ✨"}
                </p>
                <p className="mt-1 text-xs text-base-text-secondary leading-relaxed">
                  {message.trim()
                    ? `Năng lượng ấm áp của bạn đã truyền đến họ. ${isStar ? "Ngôi sao này" : "Bong bóng này"} giờ đây đã sáng rực rỡ và to lớn hơn rất nhiều!`
                    : `Dù không nói thành lời, sự quan tâm của bạn đã làm ${isStar ? "ngôi sao này" : "bong bóng này"} bừng sáng lấp lánh hơn hẳn!`}
                </p>
              </div>
            </motion.div>

          ) : phase === "pick" ? (
            /* Phase: chọn preset */
            <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-base-text-secondary">
                Gửi một tia sáng ấm áp:
              </p>
              <ReactionPicker selectedKey={selectedKey} onSelect={handlePickReaction} />
            </motion.div>

          ) : (
            /* Phase: viết lời động viên */
            <motion.div
              key="write"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-4.5"
            >
              {/* Chosen reaction indicator */}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Sparkles size={13} className="text-warm shrink-0" />
                <span className="text-base-text-secondary text-[11px]">
                  Đã nhận diện cảm xúc — đính kèm thêm lời nhắn gửi để làm họ vui lên nhé?
                </span>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
                  placeholder={msgPlaceholder}
                  rows={3}
                  className="w-full resize-none rounded-2xl border bg-base-surface/60 px-4 py-3 text-sm leading-relaxed text-base-text-primary placeholder:text-base-text-secondary/40 focus:outline-none transition-all duration-300"
                  style={{
                    borderColor: message.trim()
                      ? `${accentColor}aa`
                      : "rgba(255,255,255,0.1)",
                    boxShadow: message.trim()
                      ? `0 0 16px 3px ${accentGlow}`
                      : "none",
                  }}
                  autoFocus
                />
                <div
                  className={`absolute bottom-2.5 right-3 text-[10px] font-mono ${
                    MAX_MSG - message.length < 20
                      ? "text-critical font-bold"
                      : "text-base-text-secondary/40"
                  }`}
                >
                  {MAX_MSG - message.length}
                </div>
              </div>

              {/* Suggestions Container */}
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
                      style={{
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        minHeight: 0,
                      }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
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
                  className="orb-btn flex flex-[2] items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-base-text-primary transition-all"
                  style={{
                    minHeight: 0,
                    background: message.trim()
                      ? `linear-gradient(135deg, ${isStar ? "#3A2E5C, #F5D67D" : "#072034, #4FD1C5"})`
                      : "rgba(255,255,255,0.08)",
                    boxShadow: message.trim() ? `0 0 20px 4px ${accentGlow}` : "none",
                  }}
                >
                  <Send size={14} />
                  {message.trim() ? "Gửi lời động viên ✦" : "Gửi tia sáng"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
