"use client";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface ReactionPreset {
  key: string;
  emoji: string;
  i18nKey: string;
  glowClass: string;
  glowColor: string;
}

// Module 8.1 — nhãn hiển thị giờ lấy từ lib/i18n.ts (reactions.presets.*)
// thay vì hardcode tiếng Việt, để đổi được sang tiếng Anh khi user chọn.
const REACTION_PRESETS: ReactionPreset[] = [
  { key: "not-alone", emoji: "🫂", i18nKey: "reactions.presets.notAlone", glowClass: "reaction-heart", glowColor: "rgba(255, 180, 162, 0.4)" },
  { key: "i-hear-you", emoji: "🌙", i18nKey: "reactions.presets.iHearYou", glowClass: "reaction-moon", glowColor: "rgba(179, 136, 255, 0.4)" },
  { key: "let-it-drift", emoji: "🌊", i18nKey: "reactions.presets.letItDrift", glowClass: "reaction-star", glowColor: "rgba(79, 209, 197, 0.4)" },
  { key: "warm-hug", emoji: "🕯️", i18nKey: "reactions.presets.warmHug", glowClass: "reaction-candle", glowColor: "rgba(255, 214, 0, 0.4)" },
  { key: "lighter-tomorrow", emoji: "🌅", i18nKey: "reactions.presets.lighterTomorrow", glowClass: "reaction-heart", glowColor: "rgba(255, 138, 80, 0.4)" },
  { key: "brave", emoji: "⭐", i18nKey: "reactions.presets.brave", glowClass: "reaction-star", glowColor: "rgba(124, 158, 255, 0.4)" },
  { key: "im-here", emoji: "💙", i18nKey: "reactions.presets.imHere", glowClass: "reaction-heart", glowColor: "rgba(100, 160, 255, 0.4)" },
  { key: "shining-star", emoji: "✨", i18nKey: "reactions.presets.shiningStar", glowClass: "reaction-candle", glowColor: "rgba(245, 214, 125, 0.45)" },
];

interface ReactionPickerProps {
  selectedKey: string | null;
  onSelect: (key: string) => void;
  disabled?: boolean;
}

export function ReactionPicker({ selectedKey, onSelect, disabled }: ReactionPickerProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-2">
      {REACTION_PRESETS.map((preset, idx) => {
        const active = selectedKey === preset.key;
        const hovered = hoveredKey === preset.key;

        return (
          <motion.button
            key={preset.key}
            disabled={disabled}
            onClick={() => onSelect(preset.key)}
            onMouseEnter={() => setHoveredKey(preset.key)}
            onMouseLeave={() => setHoveredKey(null)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.3 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className={clsx(
              "relative flex items-center gap-2.5 overflow-hidden rounded-2xl border px-3.5 py-3 text-left text-[13px] font-medium transition-all duration-200",
              active
                ? "border-warm/40 bg-warm/12 text-base-text-primary"
                : "border-base-divider text-base-text-secondary hover:border-white/20 hover:text-base-text-primary",
              disabled && !active && "opacity-40 cursor-not-allowed"
            )}
            style={
              active || hovered
                ? {
                    background: active
                      ? preset.glowColor
                      : "rgba(255,255,255,0.04)",
                    borderColor: active
                      ? preset.glowColor.replace("0.3", "0.6")
                      : "rgba(255,255,255,0.15)",
                    boxShadow: active
                      ? `0 0 16px 2px ${preset.glowColor}`
                      : `0 0 8px 1px ${preset.glowColor}`,
                  }
                : undefined
            }
          >
            {/* Shimmer on hover/active */}
            <AnimatePresence>
              {(active || hovered) && (
                <motion.div
                  initial={{ opacity: 0, x: "-100%" }}
                  animate={{ opacity: 1, x: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Emoji */}
            <motion.span
              animate={active ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="text-xl leading-none shrink-0"
            >
              {preset.emoji}
            </motion.span>

            {/* Label */}
            <span className="leading-snug">{t(preset.i18nKey)}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
