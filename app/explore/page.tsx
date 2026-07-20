"use client";

import {
  useMemo,
  useState,
  useRef,
  useEffect,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  animate,
} from "framer-motion";
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
  Waves,
  HeartHandshake,
  X,
  Sparkles,
  Lock,
  MessageCircle,
} from "lucide-react";
import clsx from "clsx";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { OceanCanvas } from "@/components/canvas/OceanCanvas";
import { SignalOrb } from "@/components/canvas/SignalOrb";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SignalCard } from "@/components/explore/SignalCard";
import { SpaceMap } from "@/components/explore/SpaceMap";
import { ConstellationView } from "@/components/explore/ConstellationView";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SupportButton } from "@/components/ui/SupportButton";
import { MoreMenu } from "@/components/ui/MoreMenu";
import { useAppState } from "@/context/AppStateContext";
import { Story } from "@/lib/mockSignals";
import { playOpenSignal, startAmbient, stopAmbient } from "@/lib/sound";

type Space = "sky" | "ocean";

// =====================================================
// WHISPER TEXTS
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

// Chỉ hiện đúng MỘT lần trong đời của thiết bị này — bù lại phần "chạm cảm
// xúc" mà phase intro của /checkin cũ từng đảm nhiệm cho lần đầu ghé thăm,
// từ khi /checkin trở thành tuỳ chọn thay vì bắt buộc (xem app/page.tsx).
const WELCOME_SEEN_KEY = "solace:has-seen-welcome";

interface DustMote {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

function isSkyForPresence(space: Space): boolean {
  return space === "sky";
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
  const { stories, soundEnabled, toggleSound, encouragedStoryIds, mood } = useAppState();
  // Module "vào thẳng /explore" — check-in không còn là điều kiện bắt buộc
  // trước khi vào không gian (xem app/page.tsx). Thay vào đó, một lời mời
  // nhẹ nhàng, có thể đóng bất cứ lúc nào, xuất hiện nếu người dùng chưa
  // check-in mood trong phiên này — không chặn thao tác nào cả.
  const [checkinNudgeDismissed, setCheckinNudgeDismissed] = useState(false);
  const [space, setSpace] = useState<Space>("sky");
  const [openStory, setOpenStory] = useState<Story | null>(null);
  const [whisperIdx, setWhisperIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [mounted, setMounted] = useState(false);
  // Module 2.2 — "Chỉ lắng nghe thôi": đọc thẳng từ URL (?from=listen) thay
  // vì dùng useSearchParams để khỏi cần bọc Suspense riêng cho trang này.
  const [listenOnly, setListenOnly] = useState(false);

  // Chào mừng lần đầu — xem WELCOME_SEEN_KEY ở trên. Hiện TRƯỚC overlay
  // giới thiệu sky/ocean (showIntro), và chỉ đóng bằng hành động chủ động
  // (không tự tắt theo thời gian), vì đây là ấn tượng đầu tiên nên xứng
  // đáng có một khoảnh khắc chủ đích thay vì trôi qua trong vài giây.
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(WELCOME_SEEN_KEY)) {
        setShowWelcome(true);
      }
    } catch {
      // storage không khả dụng — bỏ qua, không chặn trải nghiệm
    }
  }, []);
  function handleCloseWelcome() {
    setShowWelcome(false);
    try {
      window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      // ignore
    }
  }
  // Bụi sao riêng cho khoảnh khắc chào mừng — thêm chiều sâu ngay cả ở
  // phần overlay tối, tái dùng đúng hàm generateDust() đã có sẵn bên dưới.
  const welcomeDust = useMemo(() => generateDust(24, "welcome"), []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 900, height: 700 });
  const hasCenteredRef = useRef(false);

  // =====================================================
  // "VỌNG" — thỉnh thoảng một câu chuyện CŨ (đã thả từ lâu) trôi nhẹ lại
  // gần người đang xem, như một lời nhắc "có người từng cảm thấy giống
  // bạn". Tạo kết nối xuyên thời gian giữa những người dùng không hề gặp
  // nhau, mà không cần real-time đa người dùng thật (dùng được ngay cả ở
  // giai đoạn chỉ có localStorage). Không làm phiền: tự ẩn sau ít giây,
  // không chặn thao tác, không lặp lại câu vừa hiện.
  // =====================================================
  const [echoStory, setEchoStory] = useState<Story | null>(null);
  const lastEchoIdRef = useRef<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // "Chế độ chiêm ngưỡng" — giữ chạm bản đồ để mở toàn cảnh không gian
  // (xem components/explore/ConstellationView.tsx).
  const [showConstellation, setShowConstellation] = useState(false);

  // Đếm số người "cũng đang lặng lẽ ở đây lúc này" — mô phỏng có chủ đích
  // (chưa có real-time đa người dùng thật, xem tai-lieu-du-an mục 4.5),
  // nhưng thay đổi hợp lý theo khung giờ trong ngày và làm mới sau mỗi ~2
  // phút để không cảm giác là một con số bịa cố định.
  const [presenceTick, setPresenceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPresenceTick((p) => p + 1), 120000);
    return () => clearInterval(t);
  }, []);
  const presenceCount = useMemo(() => {
    const hour = new Date().getHours();
    const base = hour >= 20 || hour < 2 ? 6 : hour >= 6 && hour < 12 ? 2 : 4;
    const raw = Math.sin(presenceTick * 12.9898 + (isSkyForPresence(space) ? 1.7 : 5.3)) * 10000;
    const jitter = Math.floor(Math.abs(raw % 1) * 3) - 1; // -1..+1
    return Math.max(1, base + jitter);
  }, [presenceTick, space]);

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

  // Âm thanh nền liên tục (gió xa/sóng vỗ khẽ) — trước đây /explore chỉ có
  // tiếng lúc có hành động cụ thể, khiến không gian im lặng hoàn toàn phần
  // lớn thời gian. Tự tắt khi rời trang hoặc tắt âm thanh.
  useEffect(() => {
    if (!soundEnabled) {
      stopAmbient();
      return;
    }
    startAmbient(isSky ? "sky" : "ocean");
    return () => stopAmbient();
  }, [soundEnabled, isSky]);

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

  // Auto-dismiss intro after 3.5s
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(t);
  }, []);

  // Reset whisper on space change
  useEffect(() => {
    setWhisperIdx(0);
  }, [space]);

  const visible = useMemo(
    () => stories.filter((s) => (isSky ? s.type === "star" : s.type === "bubble")),
    [stories, isSky]
  );

  // Lên lịch "vọng" — chỉ chọn trong số câu chuyện đã đủ cũ (>3 giờ), để
  // không bao giờ vô tình "vọng lại" chính câu chuyện ai đó vừa mới thả
  // (lúc đó họ cần im lặng đón nhận, không cần bị nhắc lại ngay).
  useEffect(() => {
    if (showIntro) return;
    let timer: ReturnType<typeof setTimeout>;
    function scheduleNext() {
      const delay = 55000 + Math.random() * 40000; // 55–95 giây, không đều đặn máy móc
      timer = setTimeout(() => {
        setOpenStory((currentOpen) => {
          if (!currentOpen) {
            const now = Date.now();
            const candidates = visible.filter(
              (s) => now - s.createdAt > 3 * 60 * 60 * 1000 && s.id !== lastEchoIdRef.current
            );
            if (candidates.length > 0) {
              const pick = candidates[Math.floor(Math.random() * candidates.length)];
              lastEchoIdRef.current = pick.id;
              setEchoStory(pick);
            }
          }
          return currentOpen;
        });
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => clearTimeout(timer);
  }, [showIntro, visible]);

  // Vọng tự ẩn sau 9 giây nếu không ai chạm vào
  useEffect(() => {
    if (!echoStory) return;
    const t = setTimeout(() => setEchoStory(null), 9000);
    return () => clearTimeout(t);
  }, [echoStory]);

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
            CHÀO MỪNG LẦN ĐẦU — chỉ hiện một lần duy nhất (xem
            WELCOME_SEEN_KEY), z-index cao hơn overlay giới thiệu sky/ocean
            bên dưới vì đây là ấn tượng đầu tiên thật sự của người dùng.
            ====================================================== */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              key="welcome-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 z-[60] flex items-center justify-center overflow-hidden px-5"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 45%, rgba(6,9,17,0.5) 0%, rgba(6,9,17,0.32) 55%, rgba(4,6,12,0.18) 100%)",
                backdropFilter: "blur(1.5px)",
              }}
            >
              {/* Bụi sao riêng cho khoảnh khắc này — sao thật của SkyCanvas
                  vẫn le lói qua lớp phủ mờ phía sau, lớp này chỉ tô thêm
                  chiều sâu ngay quanh khu vực thẻ nội dung */}
              {welcomeDust.map((d) => (
                <span
                  key={d.id}
                  className="pointer-events-none absolute rounded-full animate-twinkle"
                  style={{
                    top: `${d.y}%`,
                    left: `${d.x}%`,
                    width: d.size,
                    height: d.size,
                    opacity: d.opacity,
                    background: "#fff",
                    animationDuration: `${d.twinkleSpeed}s`,
                  }}
                />
              ))}

              {/* Nebula trôi chậm phía sau thẻ — tăng cảm giác bí ẩn, có
                  chủ đích chứ không chỉ là một hộp thoại phẳng */}
              {!prefersReducedMotion && (
                <>
                  <div
                    className="pointer-events-none absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full blur-[110px] animate-nebula-drift"
                    style={{ background: "radial-gradient(circle, rgba(162,119,255,0.28), transparent 70%)" }}
                  />
                  <div
                    className="pointer-events-none absolute -bottom-40 right-1/4 h-[380px] w-[380px] rounded-full blur-[100px]"
                    style={{
                      background: "radial-gradient(circle, rgba(79,209,197,0.16), transparent 70%)",
                      animation: "nebula-drift 26s ease-in-out infinite reverse",
                    }}
                  />
                </>
              )}

              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 14 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card relative z-10 flex w-full max-w-sm flex-col items-center rounded-[28px] px-7 py-8 text-center"
              >
                {/* Icon + quầng sáng nhiều lớp */}
                <div className="relative mb-6 flex h-[76px] w-[76px] items-center justify-center">
                  {!prefersReducedMotion && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2.6, repeat: Infinity }}
                        style={{ background: "rgba(192,132,252,0.35)" }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
                        animate={{ scale: [1, 2, 1], opacity: [0.25, 0, 0.25] }}
                        transition={{ duration: 3.2, repeat: Infinity, delay: 0.4 }}
                        style={{ background: "rgba(124,158,255,0.25)" }}
                      />
                    </>
                  )}
                  <motion.div
                    className="relative flex h-16 w-16 items-center justify-center rounded-full"
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : { boxShadow: ["0 0 30px rgba(162,119,255,0.35)", "0 0 55px rgba(162,119,255,0.55)", "0 0 30px rgba(162,119,255,0.35)"] }
                    }
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      background: "radial-gradient(circle at 40% 40%, rgba(192,132,252,0.4), rgba(45,31,94,0.7))",
                      border: "1px solid rgba(192,132,252,0.4)",
                    }}
                  >
                    <Sparkles size={28} className="text-[#d8b4fe]" />
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0, filter: "blur(6px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-base-text-secondary/60"
                >
                  Chào mừng đến với
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, filter: "blur(10px)", y: 6 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{ delay: 0.4, duration: 0.65 }}
                  className="mb-3 font-display text-3xl font-black leading-snug text-base-text-primary"
                >
                  <span className="shimmer-text">Solace</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, filter: "blur(6px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.55, duration: 0.6 }}
                  className="mb-6 text-[13.5px] leading-relaxed text-base-text-secondary/75"
                >
                  Một không gian ẩn danh để bạn lắng nghe và được lắng nghe. Đi dạo quanh đây — mỗi ngôi sao,
                  mỗi bong bóng là một câu chuyện ai đó đã thả xuống.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="mb-7 flex w-full flex-col divide-y divide-white/6 border-y border-white/8"
                >
                  <div className="flex items-center gap-3 py-2.5 text-left">
                    <Lock size={13} className="shrink-0 text-purple-300/70" />
                    <p className="text-[12px] text-base-text-secondary/75">Ẩn danh hoàn toàn — không cần tài khoản để bắt đầu</p>
                  </div>
                  <div className="flex items-center gap-3 py-2.5 text-left">
                    <MessageCircle size={13} className="shrink-0 text-purple-300/70" />
                    <p className="text-[12px] text-base-text-secondary/75">Gửi phản hồi, viết ra tâm sự thoải mái, không cần đăng nhập</p>
                  </div>
                  <div className="flex items-center gap-3 py-2.5 text-left">
                    <Sparkles size={13} className="shrink-0 text-purple-300/70" />
                    <p className="text-[12px] text-base-text-secondary/75">Chạm vào bất kỳ ngôi sao hay bong bóng nào để nghe câu chuyện</p>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85, duration: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCloseWelcome}
                  className="orb-btn relative w-full overflow-hidden rounded-full py-3.5 text-[14px] font-bold text-white"
                  style={{
                    minHeight: 0,
                    background: "linear-gradient(135deg, #2D1F5E 0%, #7C5AE2 50%, #C084FC 100%)",
                    boxShadow: "0 0 28px rgba(124,90,226,0.45), 0 6px 20px rgba(0,0,0,0.4)",
                  }}
                >
                  <span className="absolute inset-0 shimmer-bg pointer-events-none" style={{ borderRadius: "inherit" }} />
                  <span className="relative">Bắt đầu khám phá →</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================
            INTRO OVERLAY
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
                background: isSky
                  ? "radial-gradient(ellipse at 50% 50%, rgba(6,10,19,0.97) 0%, rgba(6,10,19,0.99) 70%)"
                  : "radial-gradient(ellipse at 50% 60%, rgba(3,16,32,0.97) 0%, rgba(3,16,32,0.99) 70%)",
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  animate={{
                    boxShadow: prefersReducedMotion
                      ? isSky
                        ? "0 0 50px rgba(162,119,255,0.5)"
                        : "0 0 50px rgba(79,209,197,0.5)"
                      : isSky
                      ? [
                          "0 0 30px rgba(162,119,255,0.4)",
                          "0 0 70px rgba(162,119,255,0.6)",
                          "0 0 30px rgba(162,119,255,0.4)",
                        ]
                      : [
                          "0 0 30px rgba(79,209,197,0.4)",
                          "0 0 70px rgba(79,209,197,0.65)",
                          "0 0 30px rgba(79,209,197,0.4)",
                        ],
                  }}
                  transition={prefersReducedMotion ? undefined : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: isSky
                      ? "radial-gradient(circle at 40% 40%, rgba(162,119,255,0.4), rgba(45,31,94,0.7))"
                      : "radial-gradient(circle at 40% 40%, rgba(79,209,197,0.35), rgba(5,35,55,0.75))",
                    border: isSky
                      ? "1px solid rgba(162,119,255,0.4)"
                      : "1px solid rgba(79,209,197,0.4)",
                  }}
                >
                  {isSky ? (
                    <Compass size={28} className="text-[#d8b4fe]" />
                  ) : (
                    <Waves size={28} className="text-[#4FD1C5]" />
                  )}
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-semibold uppercase tracking-[0.3em] mb-3"
                  style={{ color: isSky ? "rgba(162,119,255,0.6)" : "rgba(79,209,197,0.6)" }}
                >
                  Bạn đang bước vào
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="font-display text-2xl font-black text-base-text-primary mb-2"
                >
                  {isSky ? "Không gian Bầu Trời ✦" : "Đại Dương Bao La ◎"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs text-base-text-secondary mb-1"
                >
                  {mounted ? stats.count.toLocaleString() : "—"} {stats.label}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 }}
                  transition={{ delay: 0.85 }}
                  className="text-[10px] text-base-text-secondary"
                >
                  {isSky
                    ? "Kéo để khám phá dải ngân hà câu chuyện"
                    : "Kéo để lặn sâu vào lòng đại dương bí ẩn"}
                </motion.p>

                {/* Progress bar */}
                <motion.div className="mx-auto mt-6 h-0.5 w-32 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isSky
                        ? "rgba(162,119,255,0.7)"
                        : "rgba(79,209,197,0.7)",
                    }}
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
            HEADER
            ====================================================== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? -20 : 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="z-20 w-full px-4 pt-4 md:px-6 md:pt-5"
        >
          <div
            className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl px-3 py-2.5 sm:px-4 md:px-5"
            style={{
              background: "rgba(12,16,28,0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Hàng 1 — luôn có: identity badge + space switcher (chỉ trên
                sm trở lên, xem hàng riêng bên dưới cho mobile) + icon cụm */}
            <div className="flex items-center justify-between gap-2">
              <AnonymousIdentityBadge compact />

              {/* Space switcher — inline trên sm+, ẩn trên mobile để không
                  vỡ layout, thay bằng hàng riêng full-width bên dưới */}
              <div className="hidden items-center rounded-xl border border-white/6 bg-white/[0.04] p-1 sm:flex">
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

              {/* Right — Sound + Support + Notifications luôn hiện; Dashboard/
                  Thư viện/Cài đặt gom vào MoreMenu để gọn trên mobile */}
              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                <button
                  aria-label={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                  onClick={toggleSound}
                  className="orb-btn flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors sm:h-auto sm:w-auto sm:rounded-lg sm:p-2"
                  style={{ minHeight: 0 }}
                >
                  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                <SupportButton />
                <NotificationBell />
                <MoreMenu
                  items={[
                    { href: "/dashboard", label: "Dashboard cá nhân", icon: History },
                    { href: "/library", label: "Thư viện kiến thức", icon: BookOpen },
                    { href: "/settings", label: "Cài đặt", icon: Settings },
                  ]}
                />
              </div>
            </div>

            {/* Hàng 2 — space switcher full-width, CHỈ trên mobile */}
            <div className="flex items-center justify-center rounded-xl border border-white/6 bg-white/[0.04] p-1 sm:hidden">
              <button
                onClick={() => setSpace("sky")}
                className={clsx(
                  "flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all duration-300",
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
                  "flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all duration-300",
                  !isSky
                    ? "bg-ocean-teal/80 text-white shadow-md"
                    : "text-base-text-secondary/60 hover:text-base-text-secondary"
                )}
                style={!isSky ? { boxShadow: "0 0 14px rgba(79,209,197,0.4)" } : {}}
              >
                ◎ Đại dương
              </button>
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
            CHECK-IN NUDGE — lời mời không bắt buộc, thay cho việc ép
            người dùng qua /checkin trước khi vào không gian này.
            ====================================================== */}
        <AnimatePresence>
          {mood === null && !checkinNudgeDismissed && !showIntro && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="z-20 mx-auto mt-2 flex w-full max-w-3xl items-center gap-2.5 px-4 md:px-6"
            >
              <div className="flex w-full items-center gap-2.5 rounded-2xl border border-warm/20 bg-warm/8 px-4 py-2.5 backdrop-blur-sm">
                <HeartHandshake size={14} className="shrink-0 text-warm" />
                <p className="flex-1 text-[11.5px] leading-snug text-base-text-primary/80">
                  Hôm nay bạn cảm thấy thế nào? Check-in chỉ mất 10 giây.
                </p>
                <Link
                  href="/checkin?quick=1"
                  className="orb-btn shrink-0 rounded-full bg-warm/20 px-3 py-1.5 text-[11px] font-bold text-warm hover:bg-warm/30 transition-colors"
                  style={{ minHeight: 0 }}
                >
                  Check-in
                </Link>
                <button
                  onClick={() => setCheckinNudgeDismissed(true)}
                  aria-label="Đóng"
                  className="orb-btn shrink-0 text-base-text-secondary/40 hover:text-base-text-secondary transition-colors"
                  style={{ minHeight: 0 }}
                >
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================
            WHISPER BAR
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

          {/* Hiện diện ẩn danh — giảm cảm giác cô đơn giữa không gian rộng,
              không cần real-time thật (xem ghi chú ở khai báo presenceCount) */}
          <p className="mt-1 text-[10px] text-base-text-secondary/30">
            ✦ {presenceCount} người khác cũng đang lặng lẽ ở đây lúc này
          </p>
        </motion.div>

        {/* ======================================================
            "VỌNG" — một câu chuyện cũ trôi nhẹ lại gần, kết nối xuyên
            thời gian giữa những người không hề gặp nhau. Không chặn thao
            tác, tự ẩn sau vài giây, chạm vào để mở đọc trọn vẹn.
            ====================================================== */}
        <AnimatePresence>
          {echoStory && !openStory && (
            <motion.button
              key={`echo-${echoStory.id}`}
              initial={{ opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => {
                setOpenStory(echoStory);
                setEchoStory(null);
              }}
              // top-[150px] trên mobile để chừa đủ chỗ cho header 2 hàng
              // (badge/icon + space switcher riêng) cộng thêm banner nhắc
              // check-in nếu đang hiện cùng lúc — header 1 hàng cũ chỉ cần
              // 88px, giờ cần nhiều hơn. Từ md trở lên header vẫn 1 hàng
              // như cũ nên giữ nguyên 96px.
              className="pointer-events-auto absolute left-1/2 top-[150px] z-40 w-[86%] max-w-xs -translate-x-1/2 rounded-2xl px-4 py-3 text-left md:top-[96px]"
              style={{
                background: "rgba(10,14,24,0.82)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${isSky ? "rgba(124,158,255,0.25)" : "rgba(79,209,197,0.25)"}`,
                boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 20px ${isSky ? "rgba(124,158,255,0.1)" : "rgba(79,209,197,0.1)"}`,
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.15em]"
                style={{ color: isSky ? "#A8C8FF" : "#9FE8DD" }}
              >
                Một câu chuyện cũ vừa trôi ngang qua đây…
              </p>
              <p className="mt-1 line-clamp-2 text-[12px] italic leading-snug text-base-text-secondary/85">
                "{echoStory.content}"
              </p>
            </motion.button>
          )}
        </AnimatePresence>

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
            // Trên mobile, kéo bản đồ lên cao hơn hẳn (bottom-28 thay vì
            // bottom-4) — vùng FAB + dòng thống kê ở đáy màn hình chiếm
            // khoảng 24-74px tính từ cạnh dưới trên điện thoại, nếu để bản
            // đồ ở bottom-4 (128px cao) sẽ đè lên đúng vùng đó và chặn tap
            // vào FAB. Từ md trở lên, khung hình rộng ra nên không còn
            // xung đột, quay lại vị trí góc dưới-trái quen thuộc.
            className="pointer-events-none absolute bottom-28 left-3 z-30 md:bottom-5 md:left-5"
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
              onOpenConstellation={() => setShowConstellation(true)}
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
                ? "linear-gradient(180deg, rgba(6,10,19,0.85) 0%, transparent 100%)"
                : "linear-gradient(180deg, rgba(3,16,32,0.85) 0%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-20"
            style={{
              background: isSky
                ? "linear-gradient(0deg, rgba(6,10,19,0.9) 0%, transparent 100%)"
                : "linear-gradient(0deg, rgba(3,16,32,0.9) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* ======================================================
            BOTTOM AREA — Stats + FAB + Mini-Map
            ====================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showIntro ? 0 : 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="absolute bottom-0 left-0 right-0 z-20 pb-6 px-4"
        >
          {/* Live stat counter */}
          <div className="text-center mb-4">
            <motion.p className="text-[10px] text-base-text-secondary/35 flex items-center justify-center gap-1.5">
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
              {/* Glow pulses — tắt hẳn hiệu ứng lặp vô hạn khi người dùng
                  bật "giảm chuyển động", chỉ giữ quầng sáng tĩnh */}
              {!prefersReducedMotion && (
                <>
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
                </>
              )}

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

      {/* ======================================================
          CHẾ ĐỘ CHIÊM NGƯỠNG — mở bằng cách giữ chạm bản đồ thu nhỏ
          ====================================================== */}
      {showConstellation && (
        <ConstellationView
          stories={visible}
          isSky={isSky}
          onClose={() => setShowConstellation(false)}
          onSelectStory={(s) => {
            setShowConstellation(false);
            setOpenStory(s);
          }}
        />
      )}
    </Canvas>
  );
}
