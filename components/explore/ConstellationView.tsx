"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { X } from "lucide-react";
import { Story } from "@/lib/mockSignals";

// =====================================================
// "CHẾ ĐỘ CHIÊM NGƯỠNG" — mở ra khi giữ chạm đủ lâu trên bản đồ thu nhỏ
// (components/explore/SpaceMap.tsx). Khác với bản đồ nhỏ (dùng để ĐIỀU
// HƯỚNG nhanh), lớp này để DỪNG LẠI NGẮM cả không gian: phóng to toàn bộ
// câu chuyện hiện có, và gọi tên (bằng lời) cụm câu chuyện đang ấm nhất —
// biến việc mở bản đồ từ một thao tác kỹ thuật thành một khoảnh khắc
// chiêm nghiệm nhỏ.
// =====================================================

interface ConstellationViewProps {
  stories: Story[];
  isSky: boolean;
  onClose: () => void;
  onSelectStory: (story: Story) => void;
}

const CLUSTER_LABELS = [
  "Vùng đang được ôm ấp nhiều nhất lúc này",
  "Nơi có nhiều ánh sáng ấm nhất đêm nay",
  "Cụm sao đang toả ấm nhất",
];

const CLUSTER_LABELS_OCEAN = [
  "Vùng đang được ôm ấp nhiều nhất lúc này",
  "Nơi có nhiều bong bóng ấm nhất đêm nay",
  "Cụm bong bóng đang toả sáng nhất",
];

function dotSize(warmth: Story["warmth"]): { size: number; glow: number } {
  switch (warmth) {
    case "many":
      return { size: 13, glow: 14 };
    case "some":
      return { size: 8, glow: 6 };
    default:
      return { size: 4.5, glow: 0 };
  }
}

const WARMTH_SCORE: Record<Story["warmth"], number> = { few: 0, some: 1, many: 3 };
const GRID = 4; // chia không gian thành lưới 4x4 để tìm cụm ấm nhất

interface Cluster {
  x: number;
  y: number;
  score: number;
  label: string;
}

function findWarmClusters(stories: Story[], labels: string[]): Cluster[] {
  const cells = new Map<string, { sumX: number; sumY: number; count: number; score: number }>();
  stories.forEach((s) => {
    const cx = Math.min(GRID - 1, Math.floor((s.x / 100) * GRID));
    const cy = Math.min(GRID - 1, Math.floor((s.y / 100) * GRID));
    const key = `${cx}-${cy}`;
    const cur = cells.get(key) || { sumX: 0, sumY: 0, count: 0, score: 0 };
    cur.sumX += s.x;
    cur.sumY += s.y;
    cur.count += 1;
    cur.score += WARMTH_SCORE[s.warmth];
    cells.set(key, cur);
  });

  const ranked = Array.from(cells.values())
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return ranked.map((c, idx) => ({
    x: c.sumX / c.count,
    y: c.sumY / c.count,
    score: c.score,
    label: labels[idx % labels.length],
  }));
}

export function ConstellationView({ stories, isSky, onClose, onSelectStory }: ConstellationViewProps) {
  const clusters = useMemo(
    () => findWarmClusters(stories, isSky ? CLUSTER_LABELS : CLUSTER_LABELS_OCEAN),
    [stories, isSky]
  );

  const accent = isSky ? "#7C9EFF" : "#4FD1C5";
  const dotColor = isSky ? "#F5D67D" : "#B8E9E0";
  const dotColorBright = isSky ? "#FFE9A8" : "#E4FFFA";

  return (
    <AnimatePresence>
      <motion.div
        key="constellation-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
        className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isSky ? "bg-sky-gradient" : "bg-ocean-gradient"}`}
      >
        {/* Nền tối phủ thêm để chữ/chấm luôn đọc rõ bất kể vibe nền */}
        <div className="absolute inset-0" style={{ background: "rgba(4,6,14,0.55)" }} />

        <motion.div
          key="constellation-panel"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative aspect-square w-full max-w-md rounded-[32px] overflow-hidden"
          style={{
            border: `1px solid ${accent}40`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 40px ${accent}18`,
            background: isSky
              ? "radial-gradient(circle at 50% 40%, rgba(30,36,70,0.55) 0%, rgba(6,10,19,0.92) 70%)"
              : "radial-gradient(circle at 50% 40%, rgba(8,50,60,0.5) 0%, rgba(3,16,32,0.92) 70%)",
          }}
        >
          {/* Nút đóng */}
          <button
            onClick={onClose}
            aria-label="Đóng chế độ chiêm ngưỡng"
            className="orb-btn absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            style={{ minHeight: 0 }}
          >
            <X size={15} />
          </button>

          {/* Tiêu đề nhẹ phía trên */}
          <p className="pointer-events-none absolute left-0 right-0 top-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: `${accent}bb` }}>
            {isSky ? "Toàn cảnh bầu trời đêm nay" : "Toàn cảnh đại dương đêm nay"}
          </p>

          {/* Các chấm câu chuyện, phóng to toàn cảnh */}
          {stories.map((s) => {
            const v = dotSize(s.warmth);
            return (
              <button
                key={s.id}
                onClick={() => onSelectStory(s)}
                aria-label="Mở câu chuyện này"
                className="group absolute flex items-center justify-center"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: 22,
                  height: 22,
                  minHeight: 0,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span
                  className="rounded-full transition-transform group-hover:scale-150 group-active:scale-110"
                  style={{
                    width: v.size,
                    height: v.size,
                    background: v.glow ? dotColorBright : dotColor,
                    boxShadow: v.glow ? `0 0 ${v.glow}px ${dotColorBright}` : `0 0 3px ${dotColor}`,
                  }}
                />
              </button>
            );
          })}

          {/* Nhãn cụm ấm nhất — gọi tên bằng lời thay vì chỉ là số liệu */}
          {clusters.map((c, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.15, duration: 0.5 }}
              className="pointer-events-none absolute max-w-[46%] -translate-x-1/2 rounded-xl px-2.5 py-1.5 text-center"
              style={{
                left: `${clamp(c.x, 14, 86)}%`,
                top: `${clamp(c.y, 10, 90)}%`,
                transform: "translate(-50%, -140%)",
                background: "rgba(6,10,19,0.7)",
                border: `1px solid ${dotColorBright}45`,
                backdropFilter: "blur(6px)",
              }}
            >
              <p className="text-[10px] leading-snug" style={{ color: dotColorBright }}>
                ✦ {c.label}
              </p>
            </motion.div>
          ))}

          {/* Gợi ý nhỏ phía dưới */}
          <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/35">
            Chạm vào một chấm sáng để đọc · chạm ra ngoài để đóng
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
