"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  History,
  Plus,
  Volume2,
  VolumeX,
  Compass,
  Eye,
  Headphones,
  Settings,
  BookOpen,
} from "lucide-react";
import clsx from "clsx";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { OceanCanvas } from "@/components/canvas/OceanCanvas";
import { SignalOrb } from "@/components/canvas/SignalOrb";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SignalCard } from "@/components/explore/SignalCard";
import { SpaceMap } from "@/components/explore/SpaceMap";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAppState } from "@/context/AppStateContext";
import { Story } from "@/lib/mockSignals";
import { playOpenSignal } from "@/lib/sound";

type Space = "sky" | "ocean";

// =====================================================
// IMMERSIVE WHISPERS — xoay vòng tự động mỗi 4s
// =====================================================
const SKY_WHISPERS = [
  "Mỗi ngôi sao là một câu chuyện ai đó đang giữ...",
  "Chạm vào ánh sáng — để nghe điều chưa kể",
  "Có ai đó ngoài kia cũng đang nhìn lên bầu trời này",
  "Đêm nay vũ trụ có thêm một câu chuyện mới",
  "Kéo để khám phá — vẫn còn những vì sao chưa được tìm thấy",
];

const OCEAN_WHISPERS = [
  "Những bong bóng đang trôi nhẹ dưới lòng biển...",
  "Chạm vào một bong bóng — nghe lời thì thầm",
  "Ai đó vừa thả điều họ giữ rất lâu xuống đây",
  "Đại dương giữ mọi bí mật, không phán xét",
  "Lắng nghe... biển đang kể chuyện, cứ lướt xa hơn xem",
];

// Stats shown to create social presence
const STATS_DATA = {
  sky: { count: 1247, label: "câu chuyện đang bay trên trời" },
  ocean: { count: 893, label: "bí mật đang chìm dưới biển" },
};

// =====================================================
// Kích thước "thế giới ảo" kéo lướt được — 700% khung nhìn (thay vì 300%
// trước đây) để không gian thật sự rộng, đủ chỗ cho hàng chục ngôi
// sao/bong bóng mà vẫn còn nhiều góc chưa khám phá. dragRangeX/Y được suy
// ra động từ kích thước khung nhìn đo được, dùng chung cho cả
// dragConstraints lẫn tính toán camera trên bản đồ thu nhỏ (SpaceMap).
// =====================================================
const WORLD_SCALE = 7; // container = 700% kích thước khung nhìn

interface DustMote {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

function generateDust(count: number, keyPrefix: string): DustMote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${keyPrefix}-${i}`,
    x: Math.random() * 92 + 4,
    y: Math.random() * 92 + 4,
    size: Math.random() * 4 + 2,
    opacity: Math.random() * 0.35 + 0.15,
    twinkleSpeed: Math.random() * 3.5 + 2,
  }));
}

export default function ExplorePage() {
  const { stories, soundEnabled, toggleSound, encouragedStoryIds } = useAppState();
  const [space, setSpace] = useState<Space>("sky");
  const [openStory, setOpenStory] = useState<Story | null>(null);
  const [whisperIdx, setWhisperIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [mounted, setMounted] = useState(false);
  // Module 2.2 — "Chỉ lắng nghe thôi": đọc thẳng từ URL (?from=listen) thay
  // vì dùng useSearchParams để khỏi cần bọc Suspense riêng cho trang này.
  const [listenOnly, setListenOnly] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 900, height: 700 });
  const hasCenteredRef = useRef(false);

  // Vị trí kéo — dùng trực tiếp (không qua spring) cho chính khung kéo để
  // luôn bám sát ngón tay/chuột 1:1, tránh cảm giác trễ/lag khi lướt.
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Đo kích thước khung nhìn thật để tính đúng toạ độ camera cho SpaceMap,
  // và — quan trọng hơn — để CĂN GIỮA camera vào đúng trung tâm thế giới
  // ảo ngay lần đo đầu tiên (world div mặc định neo góc trên-trái, nếu
  // không bù lại thì người dùng sẽ mở app và thấy ngay một góc trống thay
  // vì trung tâm không gian). Chỉ tự căn giữa MỘT LẦN DUY NHẤT — các lần
  // đo lại sau (resize) không được ghi đè vị trí đang xem của người dùng.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setViewportSize({ width: w, height: h });
      if (!hasCenteredRef.current && w > 0 && h > 0) {
        hasCenteredRef.current = true;
        dragX.set(-((w * WORLD_SCALE - w) / 2));
        dragY.set(-((h * WORLD_SCALE - h) / 2));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dragX, dragY]);
  // Spring RIÊNG, nhẹ hơn nhiều — chỉ dùng cho 2 lớp bụi nền (không phải
  // cho từng câu chuyện) để tạo cảm giác chiều sâu mà không tốn hiệu năng.
  const springX = useSpring(dragX, { stiffness: 90, damping: 26 });
  const springY = useSpring(dragY, { stiffness: 90, damping: 26 });

  // 2 lớp parallax duy nhất (thay vì tính riêng cho từng hạt bụi/từng câu
  // chuyện như bản trước — nguyên nhân chính gây lag và hiện tượng các
  // orb "tự xoay/lắc" trong lúc kéo do độ trễ lò xo khác nhau ở mỗi item).
  const farX = useTransform(springX, (v) => v * -0.12);
  const farY = useTransform(springY, (v) => v * -0.12);
  const nearX = useTransform(springX, (v) => v * 0.1);
  const nearY = useTransform(springY, (v) => v * 0.1);

  const isSky = space === "sky";
  const whispers = isSky ? SKY_WHISPERS : OCEAN_WHISPERS;
  const stats = STATS_DATA[space];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setListenOnly(params.get("from") === "listen");
  }, []);

  // Auto-cycle whispers
  useEffect(() => {
    const t = setInterval(() => {
      setWhisperIdx((p) => (p + 1) % whispers.length);
    }, 4000);
    return () => clearInterval(t);
  }, [whispers.length]);

  // Auto-dismiss intro after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(t);
  }, []);

  // Reset whisper index on space change
  useEffect(() => {
    setWhisperIdx(0);
  }, [space]);

  const visible = useMemo(
    () => stories.filter((s) => (isSky ? s.type === "star" : s.type === "bubble")),
    [stories, isSky]
  );

  // =====================================================
  // MODULE 4.3 (MVP slice) — "Nhận biết tâm trạng đối phương": KHÔNG đọc
  // suy nghĩ hay lộ danh tính từng người, chỉ tổng hợp (aggregate) mood
  // trung bình ẩn danh của các câu chuyện đang hiển thị trong không gian
  // hiện tại, để gợi ý tinh tế cách người xem nên cư xử với nhau.
  // Việc ghép cặp "mood buddy" ẩn danh (2 user pattern tương đồng) là
  // hướng Phase 2+ theo đúng đặc tả — CHƯA triển khai ở đây vì cần thêm
  // nghiên cứu về đạo đức/consent trước khi làm.
  // =====================================================
  const communityMood = useMemo(() => {
    const withMood = visible.filter((s) => s.moodAtRelease !== null);
    if (withMood.length === 0) return null;
    const sum = withMood.reduce((acc, s) => acc + (s.moodAtRelease as number), 0);
    return sum / withMood.length;
  }, [visible]);

  const communityMoodMeta = useMemo(() => {
    if (communityMood === null) return null;
    if (communityMood <= 3.5) {
      return { emoji: "☁️", label: "Không gian này đang khá trầm lắng — một tia sáng từ bạn có thể rất ý nghĩa" };
    }
    if (communityMood <= 6.5) {
      return { emoji: "⛅", label: "Cảm xúc chung ở đây khá cân bằng lúc này" };
    }
    return { emoji: "☀️", label: "Không gian này đang nhẹ nhàng và ấm áp" };
  }, [communityMood]);

  // Bụi nền trang trí — tách 2 lớp cố định (xa/gần), MỖI LỚP chỉ 1 phép
  // biến đổi dùng chung, thay vì 80 phép biến đổi riêng lẻ như trước.
  const dustFar = useMemo(() => generateDust(26, "far"), []);
  const dustNear = useMemo(() => generateDust(24, "near"), []);

  function handleTap(story: Story) {
    setOpenStory(story);
    if (soundEnabled) playOpenSignal();
  }

  const Canvas = isSky ? SkyCanvas : OceanCanvas;
  const worldWidthPx = viewportSize.width * WORLD_SCALE;
  const worldHeightPx = viewportSize.height * WORLD_SCALE;
  // Khoảng cách kéo tối đa để chạm được rìa thế giới ảo ở mỗi trục —
  // (kích thước thế giới - khung nhìn) / 2, tính động theo màn hình thật.
  const dragRangeX = (worldWidthPx - viewportSize.width) / 2;
  const dragRangeY = (worldHeightPx - viewportSize.height) / 2;

  return (
    <Canvas mouseX={springX} mouseY={springY}>
      <div className="relative flex h-dvh w-full flex-col overflow-hidden">
        {/* ======================================================
            INTRO OVERLAY — Dramatic entrance (auto-dismiss 3.5s)
            ====================================================== */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center"
              style={{
                background: "radial-gradient(ellipse at 50% 50%, rgba(6,10,19,0.95) 0%, rgba(6,10,19,0.99) 70%)",
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  animate={{ boxShadow: [
                    "0 0 30px rgba(162,119,255,0.4)",
                    "0 0 70px rgba(162,119,255,0.6)",
                    "0 0 30px rgba(162,119,255,0.4)",
                  ]}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: "radial-gradient(circle at 40% 40%, rgba(162,119,255,0.4), rgba(45,31,94,0.7))",
                    border: "1px solid rgba(162,119,255,0.4)",
                  }}
                >
                  <Compass size={28} className="text-[#d8b4fe]" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-aurora/60 mb-3"
                >
                  Bạn đang bước vào
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="font-display text-2xl font-black text-base-text-primary mb-2"
                >
                  Không gian {isSky ? "bầu trời" : "đại dương"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.75 }}
                  className="text-xs text-base-text-secondary"
                >
                  {mounted ? stats.count.toLocaleString() : "—"} {stats.label}
                </motion.p>

                {/* Loading progress bar */}
                <motion.div className="mx-auto mt-6 h-0.5 w-32 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-sky-aurora/60"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.2, ease: "linear" }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================
            HEADER — Compact, floating glass
            ====================================================== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? -20 : 0 }}
          transition={{ duration: 0.5, delay: showIntro ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="z-20 w-full px-4 pt-4 md:px-6 md:pt-5"
        >
          <div
            className="mx-auto flex max-w-3xl items-center justify-between rounded-2xl px-4 py-2.5 md:px-5"
            style={{
              background: "rgba(12,16,28,0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Left — Identity */}
            <AnonymousIdentityBadge compact />

            {/* Center — Space switcher */}
            <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/6">
              <button
                onClick={() => setSpace("sky")}
                className={clsx(
                  "rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all duration-300",
                  isSky
                    ? "bg-sky-violet/80 text-white shadow-md"
                    : "text-base-text-secondary/60 hover:text-base-text-secondary"
                )}
                style={isSky ? { boxShadow: "0 0 14px rgba(124,158,255,0.4)" } : {}}
              >
                ✦ Bầu trời
              </button>
              <button
                onClick={() => setSpace("ocean")}
                className={clsx(
                  "rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all duration-300",
                  !isSky
                    ? "bg-ocean-teal/80 text-white shadow-md"
                    : "text-base-text-secondary/60 hover:text-base-text-secondary"
                )}
                style={!isSky ? { boxShadow: "0 0 14px rgba(79,209,197,0.4)" } : {}}
              >
                ◎ Đại dương
              </button>
            </div>

            {/* Right — Sound + Dashboard + Library + Notifications + Settings
                (Bản đồ đã chuyển sang góc trái màn hình, xem bên dưới) */}
            <div className="flex items-center gap-1.5">
              <button
                aria-label={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                onClick={toggleSound}
                className="orb-btn rounded-lg bg-white/[0.04] p-2 text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
                style={{ minHeight: 0 }}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <Link
                href="/dashboard"
                aria-label="Dashboard cá nhân"
                className="rounded-lg bg-white/[0.04] p-2 text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
              >
                <History size={14} />
              </Link>
              <Link
                href="/library"
                aria-label="Thư viện kiến thức"
                className="rounded-lg bg-white/[0.04] p-2 text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
              >
                <BookOpen size={14} />
              </Link>
              <NotificationBell />
              <Link
                href="/settings"
                aria-label="Cài đặt"
                className="rounded-lg bg-white/[0.04] p-2 text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
              >
                <Settings size={14} />
              </Link>
            </div>
          </div>

          {/* Chỉ báo chế độ "chỉ lắng nghe" — Module 2.2 browse-only mode */}
          <AnimatePresence>
            {listenOnly && !showIntro && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mx-auto mt-2 flex max-w-3xl justify-center"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/30 px-3 py-1 text-[10px] text-base-text-secondary/60">
                  <Headphones size={11} /> Đang ở chế độ chỉ lắng nghe — chưa thả câu chuyện nào
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* ======================================================
            WHISPER BAR — auto-rotating immersive hints
            ====================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showIntro ? 0 : 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="z-10 mt-3 text-center px-4"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/6 bg-black/25 px-4 py-2 backdrop-blur-sm">
            <Eye size={11} className="shrink-0 text-base-text-secondary/40" />
            <AnimatePresence mode="wait">
              <motion.p
                key={`${space}-${whisperIdx}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 0.6, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] text-base-text-secondary"
              >
                {whispers[whisperIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Community mood pulse — tổng hợp ẩn danh, không lộ cá nhân (4.3) */}
          {communityMoodMeta && (
            <p className="mt-1.5 text-[10px] text-base-text-secondary/35">
              {communityMoodMeta.emoji} {communityMoodMeta.label}
            </p>
          )}
        </motion.div>

        {/* ======================================================
            DRAGGABLE SPACE CANVAS — stories floating
            ====================================================== */}
        <div ref={containerRef} className="relative flex-1 w-full overflow-hidden z-10">
          {/* Bản đồ không gian — cố định góc TRÁI màn hình, giống vị trí
              quen thuộc của phiên bản trước, luôn hiển thị thường trực */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showIntro ? 0 : 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="pointer-events-none absolute bottom-4 left-4 z-30 md:bottom-5 md:left-5"
          >
            <SpaceMap
              stories={visible}
              dragX={dragX}
              dragY={dragY}
              dragRangeX={dragRangeX}
              dragRangeY={dragRangeY}
              worldWidthPx={worldWidthPx}
              worldHeightPx={worldHeightPx}
              viewportWidthPx={viewportSize.width}
              viewportHeightPx={viewportSize.height}
              isSky={isSky}
              encouragedStoryIds={encouragedStoryIds}
            />
          </motion.div>

          <motion.div
            drag
            dragConstraints={{ left: -dragRangeX, right: dragRangeX, top: -dragRangeY, bottom: dragRangeY }}
            dragElastic={0.1}
            dragTransition={{ power: 0.25, timeConstant: 220, restDelta: 0.5 }}
            className="absolute w-[700%] h-[700%] cursor-grab active:cursor-grabbing origin-center"
            style={{ touchAction: "none", x: dragX, y: dragY }}
          >
            {/* Nền tinh vân trôi nhẹ — tĩnh, không gắn theo drag để tránh chi phí thêm */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 blur-[80px]"
              style={{
                background: isSky
                  ? "radial-gradient(circle at 50% 50%, rgba(162,119,255,0.15) 0%, transparent 60%)"
                  : "radial-gradient(circle at 50% 50%, rgba(79,209,197,0.1) 0%, transparent 60%)",
              }}
            />

            {/* Lớp bụi nền XA — 1 phép biến đổi dùng chung cho cả lớp */}
            <motion.div className="absolute inset-0 pointer-events-none" style={{ x: farX, y: farY }}>
              {dustFar.map((el) => (
                <span
                  key={el.id}
                  className="absolute rounded-full animate-twinkle"
                  style={{
                    top: `${el.y}%`,
                    left: `${el.x}%`,
                    width: el.size * 0.7,
                    height: el.size * 0.7,
                    opacity: el.opacity * 0.7,
                    background: isSky ? "#A8C8FF" : "#7FE4DC",
                    animationDuration: `${el.twinkleSpeed}s`,
                  }}
                />
              ))}
            </motion.div>

            {/* Lớp bụi nền GẦN — 1 phép biến đổi dùng chung cho cả lớp */}
            <motion.div className="absolute inset-0 pointer-events-none" style={{ x: nearX, y: nearY }}>
              {dustNear.map((el) => (
                <span
                  key={el.id}
                  className="absolute rounded-full animate-twinkle"
                  style={{
                    top: `${el.y}%`,
                    left: `${el.x}%`,
                    width: el.size,
                    height: el.size,
                    opacity: el.opacity,
                    background: isSky ? "#FFFFFF" : "#B8E9E0",
                    boxShadow: el.size > 4 ? "0 0 6px rgba(255,255,255,0.35)" : "none",
                    animationDuration: `${el.twinkleSpeed}s`,
                  }}
                />
              ))}
            </motion.div>

            {/* Câu chuyện — vị trí CỐ ĐỊNH trong thế giới ảo, không gắn thêm
                phép biến đổi nào khác (đây chính là nguồn gây ra hiện tượng
                "tự xoay"/lắc trước đây: mỗi orb có một offset riêng theo lò
                xo trễ khác nhau, xung đột với chuyển động của cả khung kéo). */}
            <AnimatePresence>
              {visible.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    delay: showIntro ? 3.5 + i * 0.06 : i * 0.04,
                    type: "spring",
                    stiffness: 220,
                    damping: 22,
                  }}
                >
                  <SignalOrb
                    signal={s}
                    onTap={handleTap}
                    isEncouraged={encouragedStoryIds.includes(s.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Vignette bí ẩn — làm tối nhẹ 4 góc để thu hút ánh nhìn vào giữa
              và gợi cảm giác "còn nhiều điều chưa khám phá ở rìa xa" */}
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.4) 100%)",
            }}
          />

          {/* Depth hint — subtle edge gradients */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-16 z-20"
            style={{
              background: isSky
                ? "linear-gradient(180deg, rgba(6,10,19,0.85) 0%, rgba(6,10,19,0.3) 50%, transparent 100%)"
                : "linear-gradient(180deg, rgba(3,16,32,0.85) 0%, rgba(3,16,32,0.3) 50%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-20"
            style={{
              background: isSky
                ? "linear-gradient(0deg, rgba(6,10,19,0.9) 0%, rgba(6,10,19,0.4) 60%, transparent 100%)"
                : "linear-gradient(0deg, rgba(3,16,32,0.9) 0%, rgba(3,16,32,0.4) 60%, transparent 100%)",
            }}
          />
        </div>

        {/* ======================================================
            BOTTOM AREA — Stats + FAB
            ====================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showIntro ? 0 : 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="absolute bottom-0 left-0 right-0 z-20 pb-6 px-4"
        >
          {/* Live stat counter */}
          <div className="text-center mb-4">
            <motion.p
              className="text-[10px] text-base-text-secondary/35 flex items-center justify-center gap-1.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                  style={{ background: isSky ? "#7C9EFF" : "#4FD1C5" }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: isSky ? "#7C9EFF" : "#4FD1C5" }}
                />
              </span>
              {mounted ? stats.count.toLocaleString() : "—"} {stats.label}
            </motion.p>
          </div>

          {/* Floating Action Button — Module 2.2: luôn dẫn về /write (mood đã
              có sẵn từ /checkin), không bắt user check-in lại từ đầu. Khi
              đang ở chế độ "chỉ lắng nghe", đổi lời mời cho tha thiết hơn
              một chút để khuyến khích quay lại chia sẻ. */}
          <div className="flex justify-center pointer-events-none">
            <motion.div
              initial={{ y: 20, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 22 }}
              className="pointer-events-auto relative"
            >
              {/* Glow pulses */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  background: isSky
                    ? "rgba(124,158,255,0.3)"
                    : "rgba(79,209,197,0.3)",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                style={{
                  background: isSky
                    ? "rgba(192,132,252,0.2)"
                    : "rgba(79,209,197,0.15)",
                }}
              />

              <Link
                href="/write"
                className={clsx(
                  "relative flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95"
                )}
                style={{
                  background: isSky
                    ? "linear-gradient(135deg, #2D1F5E 0%, #7C9EFF 50%, #C084FC 100%)"
                    : "linear-gradient(135deg, #072034 0%, #0E4D5C 50%, #4FD1C5 100%)",
                  boxShadow: isSky
                    ? "0 0 36px rgba(124,158,255,0.5), 0 6px 24px rgba(0,0,0,0.45)"
                    : "0 0 36px rgba(79,209,197,0.45), 0 6px 24px rgba(0,0,0,0.45)",
                }}
              >
                <Plus size={16} />
                {listenOnly ? "Đổi ý rồi, mình muốn chia sẻ" : "Chia sẻ tâm sự"}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ======================================================
          BOTTOM SHEET — Story detail card
          ====================================================== */}
      <BottomSheet open={openStory !== null} onClose={() => setOpenStory(null)}>
        {openStory && <SignalCard signal={openStory} />}
      </BottomSheet>
    </Canvas>
  );
}
