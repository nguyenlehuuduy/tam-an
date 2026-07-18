"use client";

import { animate, motion, MotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Story } from "@/lib/mockSignals";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// =====================================================
// "Bản đồ" không gian ảo — radar ở góc TRÁI màn hình (đúng vị trí quen
// thuộc của phiên bản cũ), luôn hiển thị thường trực. Ba việc chính:
//  1. Đồng bộ 1:1 với dữ liệu thật đang có trong không gian (không phải
//     dữ liệu tĩnh riêng) — nhận thẳng `stories` đã lọc từ /explore.
//  2. Bấm vào BẤT KỲ đâu trên bản đồ (một chấm hay một vùng trống) đều
//     lướt (pan) mượt tới đúng nơi đó trong không gian thật.
//  3. Câu chuyện càng nhận nhiều tia sáng/khích lệ thì chấm càng to hơn,
//     sáng hơn, có quầng sáng riêng — để "độ ấm" cảm nhận được ngay trên
//     bản đồ, không chỉ khi mở từng câu chuyện.
// =====================================================

const MAP_W = 152; // px
const MAP_H = 112; // px

interface SpaceMapProps {
  stories: Story[];
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
  dragRangeX: number;
  dragRangeY: number;
  worldWidthPx: number;
  worldHeightPx: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
  isSky: boolean;
  /** Những câu chuyện đã nhận lời động viên có kèm tin nhắn — cho thêm một
   * quầng sáng nhẹ nhấp nháy trên bản đồ, tách biệt với warmth thường. */
  encouragedStoryIds?: string[];
}

/** Kích thước/độ sáng chấm trên bản đồ theo warmth — câu chuyện càng được
 * đón nhận nhiều thì càng nổi bật, giống một "vì sao sáng" thật sự giữa
 * bầu trời thay vì mọi chấm đều giống hệt nhau. */
function dotVisual(warmth: Story["warmth"]) {
  switch (warmth) {
    case "many":
      return { size: 7, glow: 10, ring: true };
    case "some":
      return { size: 4.5, glow: 5, ring: false };
    default:
      return { size: 2.6, glow: 0, ring: false };
  }
}

export function SpaceMap({
  stories,
  dragX,
  dragY,
  dragRangeX,
  dragRangeY,
  worldWidthPx,
  worldHeightPx,
  viewportWidthPx,
  viewportHeightPx,
  isSky,
  encouragedStoryIds = [],
}: SpaceMapProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4200);
    return () => clearTimeout(t);
  }, []);

  // Camera (viewport) center trong toạ độ % của thế giới ảo, suy ra từ vị
  // trí kéo hiện tại. LƯU Ý: công thức phải tính đến tỉ lệ khung nhìn/thế
  // giới (viewportPx / worldPx) — world lớn hơn khung nhìn NHIỀU LẦN
  // (700%), nên KHÔNG thể coi dragX=0 là "đang ở giữa thế giới" (bản cũ
  // từng giả định vậy → bản đồ và không gian thật lệch nhau, bấm vào giữa
  // bản đồ sẽ nhảy sai chỗ). Công thức đúng: điểm đang nằm giữa khung nhìn
  // = (khungNhìn/2 - drag) / thếGiới, biểu diễn theo %.
  const cameraLeftPct = useTransform(dragX, (v) => ((viewportWidthPx / 2 - v) / worldWidthPx) * 100);
  const cameraTopPct = useTransform(dragY, (v) => ((viewportHeightPx / 2 - v) / worldHeightPx) * 100);
  const cameraLeftPx = useTransform(cameraLeftPct, (pct) => (pct / 100) * MAP_W);
  const cameraTopPx = useTransform(cameraTopPct, (pct) => (pct / 100) * MAP_H);

  const viewportBoxW = Math.max(12, Math.min(MAP_W, (viewportWidthPx / worldWidthPx) * MAP_W));
  const viewportBoxH = Math.max(12, Math.min(MAP_H, (viewportHeightPx / worldHeightPx) * MAP_H));

  const accent = isSky ? "#7C9EFF" : "#4FD1C5";
  const dotColor = isSky ? "#F5D67D" : "#B8E9E0";
  const dotColorBright = isSky ? "#FFE9A8" : "#E4FFFA";

  // Lướt camera tới một toạ độ % bất kỳ trong không gian thật (dùng chung
  // cho cả "bấm vào 1 câu chuyện" lẫn "bấm vào 1 vùng trống trên bản đồ").
  // Đây là phép nghịch đảo CHÍNH XÁC của cameraLeftPct/cameraTopPct ở trên
  // — quan trọng để bản đồ và thực tế luôn khớp nhau tuyệt đối.
  function panTo(xPct: number, yPct: number) {
    const targetX = clamp(viewportWidthPx / 2 - (xPct / 100) * worldWidthPx, -dragRangeX, dragRangeX);
    const targetY = clamp(viewportHeightPx / 2 - (yPct / 100) * worldHeightPx, -dragRangeY, dragRangeY);
    animate(dragX, targetX, { type: "spring", stiffness: 120, damping: 24 });
    animate(dragY, targetY, { type: "spring", stiffness: 120, damping: 24 });
  }

  function handlePanelClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPct = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const yPct = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    panTo(xPct, yPct);
    setShowHint(false);
  }

  return (
    <motion.div
      ref={panelRef}
      onClick={handlePanelClick}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="relative cursor-crosshair overflow-hidden rounded-xl pointer-events-auto"
      style={{
        width: MAP_W,
        height: MAP_H,
        background: "rgba(8,12,22,0.72)",
        backdropFilter: "blur(14px)",
        border: `1px solid ${accent}30`,
        boxShadow: `0 6px 24px rgba(0,0,0,0.45), 0 0 16px ${accent}12`,
      }}
    >
      {/* Nền radar — lưới mờ gợi cảm giác bản đồ */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "13px 13px",
        }}
      />

      {/* Nhãn góc — tên không gian (trái) / MAP (phải) */}
      <span
        className="pointer-events-none absolute left-2 top-1.5 text-[8px] font-bold uppercase tracking-[0.15em]"
        style={{ color: `${accent}99` }}
      >
        {isSky ? "Sky" : "Ocean"}
      </span>
      <span className="pointer-events-none absolute right-2 top-1.5 text-[8px] font-bold uppercase tracking-[0.15em] text-white/30">
        Map
      </span>

      {/* Chấm đại diện từng câu chuyện — to/sáng hơn nếu nhận nhiều tia
          sáng, bấm vào để lướt thẳng tới đó */}
      {stories.map((s) => {
        const v = dotVisual(s.warmth);
        const encouraged = encouragedStoryIds.includes(s.id);
        return (
          <button
            key={s.id}
            onClick={(e) => {
              e.stopPropagation();
              panTo(s.x, s.y);
              setShowHint(false);
            }}
            aria-label="Đến câu chuyện này trong không gian"
            className="group absolute flex items-center justify-center"
            style={{
              left: `${(s.x / 100) * MAP_W}px`,
              top: `${(s.y / 100) * MAP_H}px`,
              width: 14,
              height: 14,
              minHeight: 0,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Quầng nhấp nháy cho câu chuyện đã được khích lệ bằng lời nhắn */}
            {encouraged && (
              <motion.span
                className="absolute rounded-full pointer-events-none"
                style={{ border: `1px solid ${dotColorBright}`, width: v.size + 6, height: v.size + 6 }}
                animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            {/* Quầng sáng liên tục cho warmth cao ("many") — nổi bật rõ
                như một điểm sáng nhất trong không gian */}
            {v.ring && (
              <motion.span
                className="absolute rounded-full pointer-events-none"
                style={{ background: `${dotColorBright}30`, width: v.size + 10, height: v.size + 10 }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span
              className="rounded-full transition-transform group-hover:scale-[1.7] group-active:scale-125"
              style={{
                width: v.size,
                height: v.size,
                background: v.glow ? dotColorBright : dotColor,
                boxShadow: v.glow ? `0 0 ${v.glow}px ${dotColorBright}` : `0 0 2px ${dotColor}`,
              }}
            />
          </button>
        );
      })}

      {/* Khung camera — đúng phần bạn đang thấy trên màn hình */}
      <motion.div
        className="absolute rounded-[3px] pointer-events-none"
        style={{
          width: viewportBoxW,
          height: viewportBoxH,
          left: cameraLeftPx,
          top: cameraTopPx,
          x: "-50%",
          y: "-50%",
          border: `1.5px solid ${accent}`,
          background: `${accent}14`,
          boxShadow: `0 0 8px ${accent}55`,
        }}
      />

      {/* Số lượng câu chuyện trong không gian này */}
      <span className="pointer-events-none absolute bottom-1.5 left-2 text-[8px] text-white/35">
        {stories.length} câu chuyện
      </span>

      {/* Gợi ý cách dùng — tự ẩn sau vài giây, không làm phiền lâu dài */}
      {showHint && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute bottom-1.5 right-2 text-right text-[7.5px] leading-tight text-white/30"
        >
          chạm để lướt nhanh
        </motion.span>
      )}
    </motion.div>
  );
}
