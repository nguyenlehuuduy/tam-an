"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Waves, ArrowLeft } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/Button";
import { AnonymousIdentityBadge } from "@/components/onboarding/AnonymousIdentityBadge";
import clsx from "clsx";

const CHAR_LIMIT = 300;

// Stagger container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function WritePage() {
  const router = useRouter();
  const { draft, setDraftContent, setDraftType } = useAppState();
  const remaining = CHAR_LIMIT - draft.content.length;
  const isStar = draft.type === "star";
  const isBubble = draft.type === "bubble";

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {/* Background cross-fade */}
      <motion.div
        className="absolute inset-0 bg-sky-gradient"
        animate={{ opacity: isBubble ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-ocean-gradient"
        animate={{ opacity: isBubble ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      {draft.type === null && <div className="absolute inset-0 bg-base-gradient" />}

      {/* Ambient glow that changes with selection */}
      <AnimatePresence>
        {isStar && (
          <motion.div
            key="sky-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-[80%] rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(124,158,255,0.15) 0%, transparent 70%)" }}
          />
        )}
        {isBubble && (
          <motion.div
            key="ocean-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-64 w-[80%] rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(79,209,197,0.12) 0%, transparent 70%)" }}
          />
        )}
      </AnimatePresence>

      {/* Main container */}
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-8 pt-4 md:px-8 md:pb-12 md:pt-6">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between z-10"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-base-text-secondary hover:text-base-text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <AnonymousIdentityBadge compact />
        </motion.header>

        {/* Form */}
        <main className="flex flex-1 items-center justify-center my-6 z-10 w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-xl"
          >
            <div className="glass-card rounded-sheet px-6 py-8 md:px-8 md:py-10">

              {/* Title */}
              <motion.div variants={itemVariants} className="mb-6">
                <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-base-text-primary">
                  Gửi gắm{" "}
                  <span className="shimmer-text">nỗi niềm</span>
                </h1>
                <p className="mt-2 text-sm text-base-text-secondary leading-relaxed">
                  Viết bao nhiêu tùy bạn — không ai chấm điểm,
                  không ai phán xét câu chữ này.
                </p>
              </motion.div>

              {/* Textarea */}
              <motion.div variants={itemVariants} className="relative">
                <textarea
                  value={draft.content}
                  maxLength={CHAR_LIMIT}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Điều gì đang khiến lòng bạn nặng trĩu hôm nay..."
                  className="min-h-[160px] w-full resize-none rounded-card border border-base-divider bg-base-surface/40 p-4 text-[16px] leading-relaxed text-base-text-primary placeholder:text-base-text-secondary/50 focus:border-sky-aurora/60 focus:bg-base-surface/70 focus:outline-none transition-all duration-300"
                  style={{
                    boxShadow: draft.content.length > 0
                      ? "inset 0 0 0 1px rgba(124,158,255,0.15)"
                      : "none",
                  }}
                />
                {/* Character count */}
                <div
                  className={clsx(
                    "absolute bottom-3 right-3 text-xs font-mono transition-colors",
                    remaining < 50 ? "text-caution font-semibold" : remaining < 20 ? "text-critical font-bold" : "text-base-text-secondary/50"
                  )}
                >
                  {remaining}
                </div>
                {/* Subtle progress bar */}
                {draft.content.length > 0 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: draft.content.length / CHAR_LIMIT }}
                    className="absolute bottom-0 left-0 h-0.5 rounded-b-card origin-left"
                    style={{
                      background: remaining < 30
                        ? "rgba(231,111,111,0.6)"
                        : "rgba(124,158,255,0.4)",
                    }}
                  />
                )}
              </motion.div>

              {/* Destination selection */}
              <motion.div variants={itemVariants} className="mt-8">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-base-text-secondary">
                  Gửi nỗi niềm này về đâu?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* Sky button */}
                  <motion.button
                    onClick={() => setDraftType("star")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={clsx(
                      "relative overflow-hidden rounded-card border p-5 text-left transition-all duration-300 flex flex-col gap-3",
                      isStar
                        ? "border-sky-gold/60 bg-sky-violet/20"
                        : "border-base-divider bg-base-surface/20 hover:border-white/15 hover:bg-white/5"
                    )}
                    style={
                      isStar
                        ? { boxShadow: "0 0 20px rgba(245,214,125,0.2), inset 0 0 20px rgba(124,158,255,0.08)" }
                        : {}
                    }
                  >
                    {/* Shimmer when selected */}
                    {isStar && (
                      <div className="absolute inset-0 shimmer-bg pointer-events-none" />
                    )}
                    <div className="relative flex items-center justify-between w-full">
                      <span className="text-sm font-bold text-base-text-primary">
                        ✦ Thả lên bầu trời
                      </span>
                      <motion.div
                        animate={isStar ? { rotate: [0, 20, -10, 0], scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <Star
                          size={20}
                          className="text-sky-gold"
                          fill={isStar ? "#F5D67D" : "none"}
                        />
                      </motion.div>
                    </div>
                    <p className="relative text-xs text-base-text-secondary leading-relaxed">
                      Khi bạn muốn nhìn vấn đề từ khoảng cách xa hơn — như ngắm nhìn trái đất từ ngoài vũ trụ
                    </p>
                  </motion.button>

                  {/* Ocean button */}
                  <motion.button
                    onClick={() => setDraftType("bubble")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={clsx(
                      "relative overflow-hidden rounded-card border p-5 text-left transition-all duration-300 flex flex-col gap-3",
                      isBubble
                        ? "border-ocean-aqua/60 bg-ocean-teal/20"
                        : "border-base-divider bg-base-surface/20 hover:border-white/15 hover:bg-white/5"
                    )}
                    style={
                      isBubble
                        ? { boxShadow: "0 0 20px rgba(79,209,197,0.2), inset 0 0 20px rgba(14,77,92,0.2)" }
                        : {}
                    }
                  >
                    {isBubble && (
                      <div className="absolute inset-0 shimmer-bg pointer-events-none" />
                    )}
                    <div className="relative flex items-center justify-between w-full">
                      <span className="text-sm font-bold text-base-text-primary">
                        ◎ Thả xuống đại dương
                      </span>
                      <motion.div
                        animate={isBubble ? { y: [0, -4, 0], scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
                      >
                        <Waves
                          size={20}
                          className={clsx("transition-colors", isBubble ? "text-ocean-aqua" : "text-base-text-secondary")}
                        />
                      </motion.div>
                    </div>
                    <p className="relative text-xs text-base-text-secondary leading-relaxed">
                      Khi bạn muốn buông bỏ và để nó chìm xuống mãi mãi — sâu dưới lớp nước yên bình
                    </p>
                  </motion.button>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div variants={itemVariants} className="mt-8">
                <Button
                  accent={isBubble ? "ocean" : "sky"}
                  disabled={!draft.type || draft.content.trim().length === 0}
                  onClick={() => router.push("/ritual")}
                  className="w-full py-4 text-base"
                >
                  {!draft.type
                    ? "Chọn nơi thả để tiếp tục"
                    : draft.content.trim().length === 0
                    ? "Hãy viết điều gì đó..."
                    : isStar
                    ? "✦ Chuẩn bị nghi thức thả sao"
                    : "◎ Chuẩn bị nghi thức thả bong bóng"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
