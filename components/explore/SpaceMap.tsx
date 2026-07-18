"use client";

import { animate, motion, MotionValue, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Story } from "@/lib/mockSignals";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// =====================================================
// "Bản đồ" không gian ảo — giờ mang hình dạng một QUẢ CẦU THUỶ TINH nhỏ
// bỏ túi (thay vì khung radar chữ nhật cứng cạnh trước đây), ở góc trái
// màn hình, luôn hiển thị thường trực. Bốn việc chính:
//  1. Đồng bộ 1:1 với dữ liệu thật đang có trong không gian — nhận thẳng
//     `stories` đã lọc từ /explore.
//  2. Chạm vào BẤT KỲ đâu trên mặt cầu đều lướt (pan) mượt tới đúng nơi đó
//     trong không gian thật.
//  3. Câu chuyện càng nhận nhiều tia sáng/khích lệ thì chấm càng to hơn,
//     sáng hơn — "độ ấm" cảm nhận được ngay trên bản đồ.
//  4. GIỮ chạm (long-press) để mở "chế độ chiêm ngưỡng" toàn màn hình
//     (ConstellationView) — biến bản đồ từ một công cụ điều hướng thuần
//     tuý thành một khoảnh khắc dừng lại ngắm nhìn cả không gian.
// =====================================================

const MAP_SIZE = 128; // px — hình tròn, width = height
// Co toạ độ về gần tâm một chút để các câu chuyện ở góc xa (gần 4%/94%)
// không bị cắt mất bởi viền tròn của quả cầu (một hình vuông áp vào hình
// tròn sẽ mất 4 góc nếu không co lại).
const RADIAL_SCALE = 0.86;
const LONG_PRESS_MS = 480;

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
  /** Giữ chạm đủ lâu trên mặt cầu để mở chế độ chiêm ngưỡng toàn màn hình. */
  onOpenConstellation?: () => void;
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

/** Áp RADIAL_SCALE quanh tâm (50,50) — kéo mọi điểm vào gần tâm một chút. */
function toGlobePct(pct: number): number {
  return 50 + (pct - 50) * RADIAL_SCALE;
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
  onOpenConstellation,
}: SpaceMapProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [showHint, setShowHint] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4200);
    return () => clearTimeout(t);
  }, []);

  // Camera (viewport) center trong toạ độ % của thế giới ảo, suy ra từ vị
  // trí kéo hiện tại. LƯU Ý: công thức phải tính đến tỉ lệ khung nhìn/thế
  // giới (viewportPx / worldPx) — world lớn hơn khung nhìn NHIỀU LẦN
  // (700%), nên KHÔNG thể coi dragX=0 là "đang ở giữa thế giới". Công thức
  // đúng: điểm đang nằm giữa khung nhìn = (khungNhìn/2 - drag) / thếGiới,
  // biểu diễn theo %.
  const cameraLeftPct = useTransform(dragX, (v) => ((viewportWidthPx / 2 - v) / worldWidthPx) * 100);
  const cameraTopPct = useTransform(dragY, (v) => ((viewportHeightPx / 2 - v) / worldHeightPx) * 100);
  const cameraLeftPx = useTransform(cameraLeftPct, (pct) => (toGlobePct(pct) / 100) * MAP_SIZE);
  const cameraTopPx = useTransform(cameraTopPct, (pct) => (toGlobePct(pct) / 100) * MAP_SIZE);

  // Quầng "đèn pin" mềm thay cho khung camera cứng cạnh — kích thước theo
  // tỉ lệ khung nhìn/thế giới, nhưng luôn đủ lớn để cảm nhận được như một
  // vùng sáng, không phải một hình chữ nhật kỹ thuật.
  const glowSize = Math.max(30, Math.min(MAP_SIZE * 0.85, (viewportWidthPx / worldWidthPx) * MAP_SIZE * 1.8));

  const accent = isSky ? "#7C9EFF" : "#4FD1C5";
  const dotColor = isSky ? "#F5D67D" : "#B8E9E0";
  const dotColorBright = isSky ? "#FFE9A8" : "#E4FFFA";

  // Lướt camera tới một toạ độ % bất kỳ trong không gian thật (dùng chung
  // cho cả "chạm vào 1 câu chuyện" lẫn "chạm vào 1 vùng trống trên mặt
  // cầu"). Đây là phép nghịch đảo CHÍNH XÁC của cameraLeftPct/cameraTopPct
  // ở trên — quan trọng để bản đồ và thực tế luôn khớp nhau tuyệt đối.
  function panTo(xPct: number, yPct: number) {
    const targetX = clamp(viewportWidthPx / 2 - (xPct / 100) * worldWidthPx, -dragRangeX, dragRangeX);
    const targetY = clamp(viewportHeightPx / 2 - (yPct / 100) * worldHeightPx, -dragRangeY, dragRangeY);
    animate(dragX, targetX, { type: "spring", stiffness: 120, damping: 24 });
    animate(dragY, targetY, { type: "spring", stiffness: 120, damping: 24 });
  }

  function handlePanelClick(e: React.MouseEvent<HTMLDivElement>) {
    if (longPressFiredRef.current) {
      // Vừa mở chế độ chiêm ngưỡng bằng giữ chạm — bỏ qua click theo sau,
      // không lướt camera nhầm.
      longPressFiredRef.current = false;
      return;
    }
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Đảo ngược RADIAL_SCALE để suy đúng toạ độ thế giới thật từ điểm chạm
    // trên mặt cầu đã bị co lại.
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const xPct = clamp(50 + (rawX - 50) / RADIAL_SCALE, 0, 100);
    const yPct = clamp(50 + (rawY - 50) / RADIAL_SCALE, 0, 100);
    panTo(xPct, yPct);
    setShowHint(false);
  }

  function handlePressStart() {
    longPressFiredRef.current = false;
    if (!onOpenConstellation) return;
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setShowHint(false);
      onOpenConstellation();
    }, LONG_PRESS_MS);
  }

  function handlePressEnd() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }

  return (
    <motion.div
      ref={panelRef}
      onClick={handlePanelClick}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
      initial={{ opacity: 0, x: -12, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative cursor-pointer overflow-hidden rounded-full pointer-events-auto"
      style={{
        width: MAP_SIZE,
        height: MAP_SIZE,
        background: isSky
          ? "radial-gradient(circle at 32% 28%, rgba(40,46,80,0.55) 0%, rgba(8,10,22,0.88) 65%, rgba(4,6,14,0.94) 100%)"
          : "radial-gradient(circle at 32% 28%, rgba(10,55,66,0.5) 0%, rgba(3,18,30,0.88) 65%, rgba(2,10,18,0.94) 100%)",
        backdropFilter: "blur(14px)",
        border: `1px solid ${accent}35`,
        boxShadow: `0 8px 28px rgba(0,0,0,0.5), inset 0 0 24px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Viền ngoài "thở" nhẹ theo màu không gian — quả cầu như đang sống,
          không phải một overlay tĩnh. Tắt khi người dùng bật giảm chuyển
          động, chỉ giữ viền tĩnh. */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ border: `1.5px solid ${accent}` }}
        animate={
          prefersReducedMotion
            ? { opacity: 0.35 }
            : { opacity: [0.25, 0.6, 0.25], boxShadow: [`0 0 6px ${accent}55`, `0 0 18px ${accent}70`, `0 0 6px ${accent}55`] }
        }
        transition={prefersReducedMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Điểm phản chiếu như thuỷ tinh thật — tĩnh, chỉ để tạo cảm giác mặt
          cầu cong, có khối, không phải hình phẳng. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.20) 0%, transparent 30%)",
        }}
      />

      {/* Sương mờ chiều sâu thay cho lưới ô vuông kỹ thuật trước đây */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle at 50% 55%, transparent 35%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Chấm đại diện từng câu chuyện — to/sáng hơn nếu nhận nhiều tia
          sáng, chạm vào để lướt thẳng tới đó */}
      {stories.map((s) => {
        const v = dotVisual(s.warmth);
        const encouraged = encouragedStoryIds.includes(s.id);
        const gx = toGlobePct(s.x);
        const gy = toGlobePct(s.y);
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
              left: `${(gx / 100) * MAP_SIZE}px`,
              top: `${(gy / 100) * MAP_SIZE}px`,
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
                animate={prefersReducedMotion ? { opacity: 0.35 } : { scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
                transition={prefersReducedMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            {/* Quầng sáng liên tục cho warmth cao ("many") */}
            {v.ring && (
              <motion.span
                className="absolute rounded-full pointer-events-none"
                style={{ background: `${dotColorBright}30`, width: v.size + 10, height: v.size + 10 }}
                animate={prefersReducedMotion ? { opacity: 0.7 } : { scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={prefersReducedMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
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

      {/* Quầng "đèn pin" mềm — thay cho khung camera hình chữ nhật cứng
          cạnh trước đây, cảm giác như "đây là nơi mắt bạn đang nhìn" thay
          vì một vùng crop kỹ thuật. */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: glowSize,
          height: glowSize,
          left: cameraLeftPx,
          top: cameraTopPx,
          x: "-50%",
          y: "-50%",
          background: `radial-gradient(circle, ${accent}2e 0%, ${accent}14 45%, transparent 75%)`,
        }}
      />
      {/* Chấm "bạn đang ở đây" ngay tâm quầng sáng */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 5,
          height: 5,
          left: cameraLeftPx,
          top: cameraTopPx,
          x: "-50%",
          y: "-50%",
          background: "#fff",
          boxShadow: `0 0 6px 2px ${accent}`,
        }}
        animate={prefersReducedMotion ? { opacity: 0.9 } : { opacity: [0.7, 1, 0.7] }}
        transition={prefersReducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Gợi ý cách dùng — tự ẩn sau vài giây, không làm phiền lâu dài */}
      {showHint && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute bottom-2.5 left-0 right-0 text-center text-[8.5px] leading-tight text-white/40"
        >
          chạm để lướt · giữ để chiêm ngưỡng
        </motion.span>
      )}
    </motion.div>
  );
}
