"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { OceanCanvas } from "@/components/canvas/OceanCanvas";
import { ReleaseGesture } from "@/components/release/ReleaseGesture";
import { HotlineBanner } from "@/components/ui/HotlineBanner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { suggestArticlesForMood, getArticleTranslation, LibraryArticle } from "@/lib/libraryContent";
import { BookOpen, Lock, Sparkles } from "lucide-react";
import { StoryType } from "@/lib/mockSignals";
import { generateCompanionReflection } from "@/lib/aiCompanion";

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
  const { isAuthenticated, hydrated: authHydrated } = useAuth();
  const { language } = useLanguage();
  // Đăng chia sẻ (thả câu chuyện) giờ cần đăng nhập — lý do duy nhất: để
  // khi có người phản hồi/gửi tia sáng, TÁC GIẢ có một kênh (thông báo +
  // sau này là email) để nhận lại. Soạn thảo ở /write vẫn hoàn toàn tự do
  // cho Guest — chỉ chặn đúng ở bước "thả" này, không chặn từ đầu.
  const needsLogin = authHydrated && !isAuthenticated;
  const [phase, setPhase] = useState<"hold" | "released">("hold");
  const [highRisk, setHighRisk] = useState(false);
  const [lowMoodArticles, setLowMoodArticles] = useState<LibraryArticle[]>([]);
  const [msgIdx, setMsgIdx] = useState(0);
  // "Solace đồng hành" — phản hồi tự động, cá nhân hoá theo nội dung + mood
  // vừa thả (xem lib/aiCompanion.ts, MÔ PHỎNG rule-based, không phải AI thật).
  const [companionNote, setCompanionNote] = useState<string | null>(null);

  const [savedType] = useState(draft.type);
  // Loại THẬT SỰ sau khi thả — quyết định bởi hướng kéo (lên = bầu trời,
  // xuống = đại dương), có thể khác với lựa chọn ban đầu ở /write. null
  // nghĩa là chưa thả, vẫn đang ở phase "hold".
  const [finalType, setFinalType] = useState<StoryType | null>(null);

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

  // Trước khi thả: nền vẫn theo lựa chọn ban đầu ở /write. Ngay khi thả
  // xong, nền chuyển tới đúng không gian mà hướng kéo đã chọn — "kéo
  // xuống thì load đại dương, kéo lên thì load bầu trời".
  const displayType = finalType ?? savedType;
  const Canvas = displayType === "star" ? SkyCanvas : OceanCanvas;
  const isStar = displayType === "star";

  function handleReleased(releasedType: StoryType) {
    setFinalType(releasedType);
    const result = releaseDraft(releasedType);
    const isHighRisk = Boolean(result?.highRisk);
    const mood = result?.story.moodAtRelease ?? null;
    // Module 5.3 — "sau khi release story mood thấp → gợi ý 1-2 bài liên
    // quan (không intrusive)". Chỉ áp dụng khi không phải highRisk (màn
    // highRisk đã ưu tiên hotline banner, tránh dồn quá nhiều thứ cùng lúc).
    const isLowMood = !isHighRisk && mood !== null && mood <= 3;
    setHighRisk(isHighRisk);
    setLowMoodArticles(isLowMood ? suggestArticlesForMood(mood, 2) : []);
    // Bỏ qua khi highRisk — ưu tiên duy nhất lúc đó là HotlineBanner, không
    // muốn làm loãng bằng một phản hồi tự động khác cùng lúc.
    if (!isHighRisk && result) {
      setCompanionNote(
        generateCompanionReflection({ id: result.story.id, content: result.story.content, moodAtRelease: mood })
      );
    }
    setPhase("released");
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
                {needsLogin ? (
                  // ============================================
                  // GATE — cần đăng nhập trước khi thả câu chuyện
                  // Draft vẫn nguyên vẹn (lưu trong AppStateContext), quay
                  // lại đây sau khi đăng nhập là thả được ngay.
                  // ============================================
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col items-center gap-5 rounded-card border border-white/10 bg-white/[0.04] px-6 py-8 text-center backdrop-blur"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warm/15 text-warm">
                      <Lock size={22} />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-bold text-base-text-primary mb-2">
                        Đăng nhập để thả câu chuyện này
                      </h2>
                      <p className="text-[13px] leading-relaxed text-base-text-secondary/70">
                        Để khi có người gửi tia sáng hay phản hồi câu chuyện này, bạn sẽ nhận được thông báo —
                        chỉ cần một email, không cần mật khẩu, vẫn ẩn danh hoàn toàn với người khác.
                      </p>
                    </div>
                    <Button
                      accent={savedType === "star" ? "sky" : "ocean"}
                      onClick={() => router.push("/auth?next=/ritual")}
                      className="w-full font-bold"
                    >
                      Đăng nhập ngay →
                    </Button>
                    <button
                      onClick={() => router.push("/write")}
                      className="orb-btn text-xs text-base-text-secondary/50 hover:text-base-text-secondary transition-colors py-1"
                      style={{ minHeight: 0 }}
                    >
                      ← Quay lại chỉnh sửa, chưa muốn đăng nhập
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* Instruction — soft & mysterious */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-base-text-secondary/40 mb-2">
                        bầu trời và đại dương đều đang chờ
                      </p>
                      <p className="text-sm text-base-text-secondary/60">
                        Vuốt lên để hoá thành sao bay lên bầu trời,{" "}
                        <br className="hidden sm:block" />
                        hoặc vuốt xuống để hoá thành bong bóng chìm xuống đại dương
                      </p>
                    </motion.div>

                    {/* Gesture widget — hướng kéo quyết định đích đến, không
                        còn bị khoá cứng theo lựa chọn ban đầu ở /write nữa */}
                    <ReleaseGesture type={savedType} onReleased={handleReleased} />

                    {/* Subtle pulsing hint */}
                    <motion.p
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-[11px] text-base-text-secondary/40"
                    >
                      ↑ bầu trời &nbsp;·&nbsp; đại dương ↓
                    </motion.p>
                  </>
                )}
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

                {/* "Solace đồng hành" — phản hồi tự động cá nhân hoá, KHÔNG
                    phải người thật (ghi rõ để không tạo hiểu lầm) */}
                {!highRisk && companionNote && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65, duration: 0.5 }}
                    className="mt-5 w-full rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left"
                  >
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.15em] text-purple-300/70">
                      <Sparkles size={11} /> Solace đồng hành
                    </p>
                    <p className="text-[13px] leading-relaxed text-base-text-secondary/85">
                      {companionNote}
                    </p>
                    <p className="mt-2 text-[10px] text-base-text-secondary/35">
                      ✦ Phản hồi tự động dựa trên từ khoá, không thay thế một người thật lắng nghe bạn
                    </p>
                  </motion.div>
                )}

                {/* Nút tiếp tục thủ công — thay cho auto-redirect trước đây,
                    để có thời gian đọc phản hồi đồng hành ở trên trước khi rời đi */}
                {!highRisk && lowMoodArticles.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mt-5 w-full"
                  >
                    <Button
                      accent={isStar ? "sky" : "ocean"}
                      onClick={() => router.push("/explore")}
                      className="w-full font-bold"
                    >
                      Khám phá không gian →
                    </Button>
                  </motion.div>
                )}

                {/* Mood thấp (không highRisk): gợi ý nhẹ 1-2 bài từ Thư viện — spec 5.3 */}
                {lowMoodArticles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 w-full text-left"
                  >
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-base-text-secondary/40 flex items-center gap-1.5">
                      <BookOpen size={12} /> Có thể sẽ hữu ích với bạn lúc này
                    </p>
                    <div className="flex flex-col gap-2">
                      {lowMoodArticles.map((a) => {
                        const tr = getArticleTranslation(a, language);
                        return (
                          <Link
                            key={a.slug}
                            href={`/library/${a.slug}`}
                            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 hover:bg-white/[0.07] hover:border-white/15 transition-all"
                          >
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                              style={{ background: a.coverGradient }}
                            >
                              {a.coverEmoji}
                            </span>
                            <span className="text-[12.5px] font-semibold text-base-text-primary leading-snug">
                              {tr.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <Button
                      accent={isStar ? "sky" : "ocean"}
                      onClick={() => router.push("/explore")}
                      className="mt-4 w-full font-bold"
                    >
                      Khám phá không gian →
                    </Button>
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
