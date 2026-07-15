"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Signal } from "@/lib/mockSignals";
import { ReactionPicker } from "./ReactionPicker";
import { useAppState } from "@/context/AppStateContext";
import { useT } from "@/context/LanguageContext";
import { playSendReaction } from "@/lib/sound";
import { Sparkles, Star, Waves, Send } from "lucide-react";

interface SignalCardProps {
  signal: Signal;
}

const MAX_MSG = 120;

export function SignalCard({ signal }: SignalCardProps) {
  const { reactedSignalIds, sendReaction, soundEnabled } = useAppState();
  const t = useT();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<"pick" | "write" | "done">("pick");
  
  const alreadyReacted = reactedSignalIds.includes(signal.id);
  const isStar = signal.type === "star";

  const accentColor = isStar ? "#F5D67D" : "#4FD1C5";
  const accentGlow = isStar ? "rgba(245, 214, 125, 0.25)" : "rgba(79, 209, 197, 0.25)";

  const suggestions = isStar ? t.signalCard.supportSuggestionsSky : t.signalCard.supportSuggestionsOcean;
  const msgPlaceholder = isStar ? t.signalCard.starPlaceholder : t.signalCard.bubblePlaceholder;

  const warmthText = useMemo(() => {
    switch (signal.warmth) {
      case "many":
        return t.signalCard.warmthMany;
      case "some":
        return t.signalCard.warmthSome;
      default:
        return t.signalCard.warmthFew;
    }
  }, [signal.warmth, t]);

  function handlePickReaction(key: string) {
    if (alreadyReacted) return;
    setSelectedKey(key);
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
            {isStar ? t.signalCard.pickedFromSky : t.signalCard.pickedFromOcean}
          </p>
          <p className="text-[11px] text-base-text-secondary mt-0.5" suppressHydrationWarning>
            {signal.createdAgo} · {warmthText}
          </p>
        </motion.div>
      </div>

      {/* Divider */}
      <div
        className="mb-5 h-px w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}55, transparent)` }}
      />

      {/* === CONTENT === */}
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
          {phase === "done" || alreadyReacted ? (
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
                  {message.trim() ? t.signalCard.encouragementSent : t.signalCard.sparkSent}
                </p>
                <p className="mt-1 text-xs text-base-text-secondary leading-relaxed">
                  {message.trim()
                    ? isStar
                      ? t.signalCard.encouragementSentSub
                      : t.signalCard.encouragementSentSubOcean
                    : isStar
                    ? t.signalCard.sparkSentSub
                    : t.signalCard.sparkSentSubOcean}
                </p>
              </div>
            </motion.div>
          ) : phase === "pick" ? (
            <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-base-text-secondary">
                {t.signalCard.sendWarmSpark}
              </p>
              <ReactionPicker selectedKey={selectedKey} onSelect={handlePickReaction} />
            </motion.div>
          ) : (
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
                  {t.signalCard.moodDetected}
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
                  <span>{t.signalCard.supportSuggestionsTitle}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                  {suggestions.map((s, idx) => (
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
                  {t.signalCard.skipBtn}
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
                  {message.trim() ? t.signalCard.sendEncouragement : t.signalCard.sendSparkOnly}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
