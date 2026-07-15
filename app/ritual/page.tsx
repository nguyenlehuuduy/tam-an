"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { OceanCanvas } from "@/components/canvas/OceanCanvas";
import { ReleaseGesture } from "@/components/release/ReleaseGesture";
import { HotlineBanner } from "@/components/ui/HotlineBanner";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/context/AppStateContext";

// =====================================================
// THÔNG ĐIỆP TÍCH CỰC — xoay vòng mỗi 3 giây
// Nhẹ nhàng, ấm áp, chạm vào Gen Z
// =====================================================
const POSITIVE_MESSAGES = [
  "Bạn đang làm tốt hơn bạn nghĩ đấy ✦",
  "Dù sao đi nữa, hôm nay bạn vẫn ở đây — và thế là đủ",
  "Có những thứ không cần giải pháp, chỉ cần được nghe",
  "Bạn không cần mạnh mẽ mọi lúc",
  "Đêm nào rồi cũng sẽ qua đi, tin mình đi",
  "Có ai đó ngoài kia cũng đang nghĩ về bạn lúc này",
  "Cảm xúc của bạn là thật — và nó xứng đáng được tồn tại",
  "Thả nó đi — bạn không cần phải giữ mãi đâu",
  "Bầu trời vẫn ở đây chờ bạn, như luôn luôn vậy",
  "Một bước nhỏ hôm nay, một con đường dài ngày mai",
];

export default function RitualPage() {
  const router = useRouter();
  const { draft, releaseDraft } = useAppState();
  const [phase, setPhase] = useState<"hold" | "released">("hold");
  const [highRisk, setHighRisk] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  const [savedType] = useState(draft.type);

  // Redirect nếu không có draft
  useEffect(() => {
    if (phase !== "released" && (!draft.type || draft.content.trim().length === 0)) {
      router.replace("/write");
    }
  }, [draft, router, phase]);

  // Xoay thông điệp tích cực mỗi 3 giây
  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx((p) => (p + 1) % POSITIVE_MESSAGES.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  if (!savedType) return null;

  const Canvas = savedType === "star" ? SkyCanvas : OceanCanvas;
  const isStar = savedType === "star";

  function handleReleased() {
    const result = releaseDraft();
    setHighRisk(Boolean(result?.highRisk));
    setPhase("released");

    // Không highRisk → redirect thẳng /explore sau 2s
    const fromParam = savedType === "star" ? "sky" : "ocean";
    if (!result?.highRisk) {
      setTimeout(() => router.push(`/explore?from=${fromParam}`), 2000);
    }
  }

  return (
    <Canvas>
      <div className="relative flex min-h-dvh w-full flex-col items-center justify-between px-5 py-6 md:px-8">

        {/* ── Header — rotating positive message ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-10 w-full text-center"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-5 py-2.5 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="text-xs text-base-text-secondary/70 leading-relaxed"
              >
                {POSITIVE_MESSAGES[msgIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Center area — Gesture or Released ── */}
        <main className="flex flex-1 items-center justify-center w-full z-10">
          <AnimatePresence mode="wait">
            {phase === "hold" ? (
              <motion.div
                key="gesture"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-6 w-full max-w-sm"
              >
                {/* Instruction — soft & mysterious */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-base-text-secondary/40 mb-2">
                    {isStar ? "bầu trời đang chờ" : "đại dương đang lắng nghe"}
                  </p>
                  <p className="text-sm text-base-text-secondary/60">
                    {isStar
                      ? "Vuốt ngôi sao lên — để nó bay đi"
                      : "Vuốt bong bóng xuống — để nó chìm sâu"}
                  </p>
                </motion.div>

                {/* Gesture widget */}
                <ReleaseGesture type={savedType} onReleased={handleReleased} />

                {/* Subtle pulsing hint */}
                <motion.p
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[11px] text-base-text-secondary/40"
                >
                  {isStar ? "↑ vuốt lên" : "↓ vuốt xuống"}
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="released"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center max-w-sm"
              >
                {/* Celebration glow */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 1] }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    background: isStar
                      ? "radial-gradient(circle at 40% 40%, #F5D67D, #8B7330)"
                      : "radial-gradient(circle at 40% 40%, #4FD1C5, #0E4D5C)",
                    boxShadow: isStar
                      ? "0 0 60px 15px rgba(245,214,125,0.4)"
                      : "0 0 60px 15px rgba(79,209,197,0.35)",
                  }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                    className="text-3xl"
                  >
                    {isStar ? "✦" : "◎"}
                  </motion.span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display text-xl font-bold text-base-text-primary mb-2"
                >
                  {isStar ? "Ngôi sao đã bay lên trời rồi" : "Bong bóng đã chìm xuống biển rồi"}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="text-sm text-base-text-secondary/60 leading-relaxed mb-2"
                >
                  Câu chuyện của bạn giờ đã thuộc về{" "}
                  {isStar ? "bầu trời" : "đại dương"}.
                  <br />
                  Cảm ơn bạn đã dũng cảm chia sẻ 💛
                </motion.p>

                {/* Auto-redirect indicator */}
                {!highRisk && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 flex items-center gap-2"
                  >
                    <motion.div
                      className="h-1 w-24 rounded-full bg-white/10 overflow-hidden"
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: isStar
                            ? "rgba(245,214,125,0.6)"
                            : "rgba(79,209,197,0.6)",
                        }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "linear" }}
                      />
                    </motion.div>
                    <p className="text-[10px] text-base-text-secondary/40">
                      Đang đưa bạn đến không gian...
                    </p>
                  </motion.div>
                )}

                {/* High-risk: hotline banner + manual continue */}
                {highRisk && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 w-full text-left"
                  >
                    <HotlineBanner />
                    <Button
                      accent={isStar ? "sky" : "ocean"}
                      onClick={() => router.push(`/explore?from=${isStar ? "sky" : "ocean"}`)}
                      className="mt-5 w-full font-bold"
                    >
                      Khám phá không gian →
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Footer ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ delay: 0.5 }}
          className="z-10 text-center"
        >
          <p className="text-[10px] text-base-text-secondary">
            🔒 Ẩn danh · An toàn · Riêng tư
          </p>
        </motion.footer>
      </div>
    </Canvas>
  );
}
