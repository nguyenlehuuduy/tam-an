"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MoodSliderProps {
  value: number | null;
  onChange: (value: number) => void;
}

const MOODS = [
  {
    value: 2,
    emoji: "😮‍💨",
    label: "Rất nặng",
    sublabel: "Đè nặng lắm...",
    orbClass: "mood-orb-1",
    textColor: "text-purple-300",
    bgAccent: "rgba(107, 63, 160, 0.2)",
    borderAccent: "rgba(107, 63, 160, 0.5)",
  },
  {
    value: 4,
    emoji: "😔",
    label: "Trĩu nặng",
    sublabel: "Không hẳn là ổn",
    orbClass: "mood-orb-2",
    textColor: "text-blue-300",
    bgAccent: "rgba(74, 94, 138, 0.2)",
    borderAccent: "rgba(74, 94, 138, 0.5)",
  },
  {
    value: 6,
    emoji: "😐",
    label: "Bình bình",
    sublabel: "Không nặng, không nhẹ",
    orbClass: "mood-orb-3",
    textColor: "text-sky-aurora",
    bgAccent: "rgba(124, 158, 255, 0.2)",
    borderAccent: "rgba(124, 158, 255, 0.5)",
  },
  {
    value: 8,
    emoji: "🙂",
    label: "Khá ổn",
    sublabel: "Nhẹ hơn một chút",
    orbClass: "mood-orb-4",
    textColor: "text-teal-300",
    bgAccent: "rgba(79, 209, 197, 0.2)",
    borderAccent: "rgba(79, 209, 197, 0.5)",
  },
  {
    value: 10,
    emoji: "✨",
    label: "Nhẹ bổng",
    sublabel: "Bay lên được rồi!",
    orbClass: "mood-orb-5",
    textColor: "text-sky-gold",
    bgAccent: "rgba(245, 214, 125, 0.2)",
    borderAccent: "rgba(245, 214, 125, 0.5)",
  },
];

export function MoodSlider({ value, onChange }: MoodSliderProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const selectedMood = value !== null ? MOODS.find((m) => m.value === value) : null;

  return (
    <div className="w-full select-none">
      {/* Mood Orb Display */}
      <div className="mb-8 flex justify-center">
        <AnimatePresence mode="wait">
          {selectedMood ? (
            <motion.div
              key={selectedMood.value}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative flex flex-col items-center gap-3"
            >
              {/* The orb */}
              <div className={`relative h-20 w-20 rounded-full ${selectedMood.orbClass} animate-orb-float`}>
                {/* Pulse ring */}
                <div
                  className="absolute inset-0 rounded-full animate-pulse-ring"
                  style={{ background: selectedMood.bgAccent }}
                />
                <div
                  className="absolute inset-0 rounded-full animate-pulse-ring"
                  style={{ background: selectedMood.bgAccent, animationDelay: "0.4s" }}
                />
                {/* Emoji */}
                <span className="absolute inset-0 flex items-center justify-center text-3xl">
                  {selectedMood.emoji}
                </span>
              </div>

              {/* Label */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <p className={`text-base font-bold ${selectedMood.textColor}`}>
                  {selectedMood.label}
                </p>
                <p className="text-xs text-base-text-secondary mt-0.5">
                  {selectedMood.sublabel}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="h-20 w-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center animate-breathe">
                <span className="text-3xl opacity-40">?</span>
              </div>
              <p className="text-xs text-base-text-secondary">Chạm để chọn cảm xúc</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mood Selector Buttons */}
      <div className="flex items-end justify-between gap-2">
        {MOODS.map((mood, idx) => {
          const isSelected = value === mood.value;
          const isHovered = hoveredIdx === idx;

          return (
            <motion.button
              key={mood.value}
              whileTap={{ scale: 0.88 }}
              onClick={() => onChange(mood.value)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              aria-label={`Mức cảm xúc: ${mood.label}`}
              className="relative flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 px-1 transition-all duration-300 border"
              style={{
                background: isSelected
                  ? mood.bgAccent
                  : isHovered
                  ? `rgba(255,255,255,0.04)`
                  : "transparent",
                borderColor: isSelected
                  ? mood.borderAccent
                  : "rgba(255,255,255,0.08)",
                boxShadow: isSelected ? `0 0 16px 2px ${mood.bgAccent}` : "none",
              }}
            >
              {/* Emoji */}
              <motion.span
                animate={{
                  scale: isSelected ? 1.25 : isHovered ? 1.1 : 1,
                  rotate: isSelected ? [0, -10, 10, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
                className="text-2xl leading-none"
              >
                {mood.emoji}
              </motion.span>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold leading-tight text-center transition-colors duration-200 ${
                  isSelected ? mood.textColor : "text-base-text-secondary"
                }`}
              >
                {mood.label}
              </span>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="mood-indicator"
                  className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full"
                  style={{ background: mood.borderAccent }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
