"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Hand, Ear, Wind as Nose, Cookie, RotateCcw, Anchor } from "lucide-react";

// =====================================================
// Kỹ thuật tiếp đất 5-4-3-2-1 — công cụ CBT/grounding phổ biến, giúp ngắt
// dòng suy nghĩ lo âu bằng cách đưa sự chú ý về hiện tại qua 5 giác quan.
// Góc nhìn chuyên gia tâm lý: đây là một kỹ thuật có cơ sở, không phải chỉ
// trang trí — nên giữ đúng thứ tự 5-4-3-2-1 và không rút gọn sai lệch.
// =====================================================

interface Step {
  count: number;
  sense: string;
  prompt: string;
  icon: typeof Eye;
}

const STEPS: Step[] = [
  { count: 5, sense: "Nhìn thấy", prompt: "Gọi tên 5 điều bạn có thể NHÌN thấy quanh mình ngay lúc này", icon: Eye },
  { count: 4, sense: "Chạm vào", prompt: "Gọi tên 4 điều bạn có thể CHẠM vào (bàn, quần áo, tóc mình...)", icon: Hand },
  { count: 3, sense: "Nghe thấy", prompt: "Lắng nghe 3 âm thanh đang có xung quanh bạn", icon: Ear },
  { count: 2, sense: "Ngửi thấy", prompt: "Nhận biết 2 mùi hương bạn có thể ngửi thấy", icon: Nose },
  { count: 1, sense: "Nếm/cảm nhận", prompt: "Chú ý 1 vị hoặc cảm giác trong cơ thể bạn lúc này", icon: Cookie },
];

export function GroundingExercise() {
  const [started, setStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  const step = STEPS[stepIdx];

  function handleNext() {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      setDone(true);
    }
  }

  function handleReset() {
    setStarted(false);
    setStepIdx(0);
    setDone(false);
  }

  return (
    <div className="rounded-card border border-base-divider bg-base-surface/40 p-4 backdrop-blur flex flex-col items-center text-center gap-3">
      <Anchor size={18} className="text-purple-300" />
      <div>
        <p className="text-xs font-bold text-base-text-primary">Kỹ thuật tiếp đất 5-4-3-2-1</p>
        <p className="mt-1 text-[11px] text-base-text-secondary/60 leading-relaxed">
          Khi lo âu cuốn bạn đi quá xa, 5 giác quan có thể kéo bạn về hiện tại.
        </p>
      </div>

      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="orb-btn rounded-full bg-purple-400/15 px-4 py-1.5 text-[11px] font-bold text-purple-300 hover:bg-purple-400/25 transition-colors"
          style={{ minHeight: 0 }}
        >
          Bắt đầu
        </button>
      ) : done ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-[12px] font-semibold text-purple-300">
            ✦ Xong rồi — bạn vừa đưa sự chú ý về đây, ngay lúc này
          </p>
          <button
            onClick={handleReset}
            className="orb-btn flex items-center gap-1.5 text-[10px] text-base-text-secondary/50 hover:text-base-text-secondary underline underline-offset-2"
            style={{ minHeight: 0 }}
          >
            <RotateCcw size={10} /> Làm lại
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-purple-400/20 bg-purple-400/8 px-4 py-3 w-full"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-400/20 text-sm font-black text-purple-300"
                >
                  {step.count}
                </span>
                <step.icon size={14} className="text-purple-300/80" />
                <span className="text-[11px] font-bold text-purple-300">{step.sense}</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-base-text-secondary/75">{step.prompt}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s.count}
                className="h-1 w-5 rounded-full transition-colors"
                style={{ background: i <= stepIdx ? "rgba(192,132,252,0.7)" : "rgba(255,255,255,0.1)" }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="orb-btn rounded-full bg-purple-400/15 px-4 py-1.5 text-[11px] font-bold text-purple-300 hover:bg-purple-400/25 transition-colors"
            style={{ minHeight: 0 }}
          >
            {stepIdx < STEPS.length - 1 ? "Xong, tiếp theo →" : "Hoàn thành"}
          </button>
        </div>
      )}
    </div>
  );
}
