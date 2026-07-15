"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Star,
  Lock,
  ChevronLeft,
  Send,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

// =====================================================
// DATA
// =====================================================

/** Những lý do tạo tài khoản — hiện ở hero phase */
const REASONS = [
  { icon: Star, text: "Lưu lại mọi câu chuyện bạn đã chia sẻ" },
  { icon: Eye, text: "Xem ai đã gửi tia sáng cho bạn" },
  { icon: Sparkles, text: "Nhận lời khích lệ riêng từ vũ trụ" },
  { icon: Shield, text: "An toàn tuyệt đối — không ai thấy email" },
];

/** Social proof floating whispers */
const WHISPERS = [
  "1,247 người đã tạo không gian bí mật",
  "328 câu chuyện được chia sẻ hôm nay",
  "Ai đó vừa nhận được một tia sáng ấm áp",
];

// =====================================================
// COMPONENT
// =====================================================
type Phase = "welcome" | "email" | "check";

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated, sendMagicLink, confirmMagicLink, pendingEmail } = useAuth();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [whisperIdx, setWhisperIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nếu đã đăng nhập → redirect về checkin
  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/checkin");
    }
  }, [hydrated, isAuthenticated, router]);

  // Focus email input khi vào phase 2
  useEffect(() => {
    if (phase === "email") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [phase]);

  // Auto-confirm (giả lập magic link click) sau 3s ở phase check
  useEffect(() => {
    if (phase !== "check") return;
    const t = setTimeout(() => {
      confirmMagicLink();
      router.push("/checkin");
    }, 3000);
    return () => clearTimeout(t);
  }, [phase, confirmMagicLink, router]);

  // Resend countdown
  useEffect(() => {
    if (phase !== "check") return;
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [phase, resendTimer]);

  // Rotating whisper text
  useEffect(() => {
    const t = setInterval(() => {
      setWhisperIdx((p) => (p + 1) % WHISPERS.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // Validate email
  function validateEmail(e: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(e);
  }

  function handleSubmitEmail() {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Nhập email để tiếp tục nhé");
      return;
    }
    if (!validateEmail(trimmed)) {
      setEmailError("Email không hợp lệ rồi 🥲");
      return;
    }
    setEmailError("");
    sendMagicLink(trimmed);
    setResendTimer(30);
    setPhase("check");
  }

  function handleResend() {
    if (resendTimer > 0) return;
    setResendTimer(30);
    // Giả lập gửi lại
  }

  // Masked email for display
  function getMaskedEmail(): string {
    const e = pendingEmail || email;
    const [local, domain] = e.split("@");
    if (!domain) return e;
    const vis = local.slice(0, Math.min(3, local.length));
    return `${vis}***@${domain}`;
  }

  // Transition config
  const pageTransition = {
    initial: { opacity: 0, y: 40, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -30, filter: "blur(8px)" },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <SkyCanvas>
      <div className="flex min-h-dvh w-full flex-col items-center justify-center px-5">
        <AnimatePresence mode="wait">

          {/* =============================================
              PHASE 1 — WELCOME HERO
              ============================================= */}
          {phase === "welcome" && (
            <motion.div
              key="welcome"
              {...pageTransition}
              className="flex max-w-md flex-col items-center text-center"
            >
              {/* Logo / Brand mark */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                className="relative mb-8"
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #C084FC, #3A2E5C)",
                    boxShadow: "0 0 40px 10px rgba(192,132,252,0.3)",
                  }}
                >
                  <Sparkles size={32} className="text-white" />
                </div>
                {/* Pulse rings */}
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ background: "rgba(192,132,252,0.2)" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  style={{ background: "rgba(124,158,255,0.15)" }}
                />
              </motion.div>

              {/* Title */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-base-text-secondary/60"
              >
                Trạm Phát Sáng
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-3xl font-black leading-[1.15] tracking-tight text-base-text-primary md:text-4xl"
              >
                Tạo không gian
                <br />
                <span className="shimmer-text">bí mật</span> của riêng bạn
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48 }}
                className="mt-4 max-w-xs text-[15px] leading-[1.7] text-base-text-secondary"
              >
                Một nơi chỉ bạn biết — để giữ lại những điều
                <br className="hidden md:block" />
                bạn đã viết ra, và nhận lại ánh sáng.
              </motion.p>

              {/* Reasons grid */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62 }}
                className="mt-8 grid w-full grid-cols-2 gap-3"
              >
                {REASONS.map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.68 + i * 0.08 }}
                      className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left backdrop-blur-sm"
                    >
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "rgba(192,132,252,0.12)" }}
                      >
                        <Icon size={13} className="text-purple-300" />
                      </div>
                      <p className="text-[12px] leading-snug text-base-text-secondary/80">
                        {r.text}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, type: "spring", stiffness: 280, damping: 22 }}
                className="relative mt-10 w-full"
              >
                {/* Glow behind button */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                  animate={{ opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  style={{ background: "rgba(192,132,252,0.45)", transform: "scale(1.3)" }}
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPhase("email")}
                  className="orb-btn relative w-full rounded-full py-4 text-[15px] font-bold text-white"
                  style={{
                    minHeight: 0,
                    background: "linear-gradient(135deg, #2D1F5E 0%, #7C5AE2 50%, #C084FC 100%)",
                    boxShadow: "0 0 32px rgba(124,90,226,0.45), 0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  <span className="relative flex items-center justify-center gap-2">
                    Bắt đầu hành trình
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      <ArrowRight size={16} />
                    </motion.span>
                  </span>
                </motion.button>
              </motion.div>

              {/* Skip link */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                onClick={() => router.push("/checkin")}
                className="orb-btn mt-5 text-xs text-base-text-secondary/50 hover:text-base-text-secondary transition-colors py-2"
                style={{ minHeight: 0 }}
              >
                Khám phá trước, tạo tài khoản sau →
              </motion.button>

              {/* Rotating social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="mt-6 h-5"
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={whisperIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 0.4, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4 }}
                    className="text-[11px] text-base-text-secondary"
                  >
                    ✦ {WHISPERS[whisperIdx]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* Privacy badge */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ delay: 1.5 }}
                className="mt-4 text-[11px] text-base-text-secondary"
              >
                🔒 Ẩn danh · An toàn · Riêng tư
              </motion.p>
            </motion.div>
          )}

          {/* =============================================
              PHASE 2 — EMAIL INPUT
              ============================================= */}
          {phase === "email" && (
            <motion.div
              key="email"
              {...pageTransition}
              className="flex w-full max-w-sm flex-col items-center"
            >
              {/* Back + step indicator */}
              <div className="mb-8 flex w-full items-center justify-between">
                <motion.button
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setPhase("welcome")}
                  className="orb-btn flex items-center gap-1 text-xs text-base-text-secondary/60 hover:text-base-text-secondary transition-colors py-1"
                  style={{ minHeight: 0 }}
                >
                  <ChevronLeft size={14} />
                  Quay lại
                </motion.button>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-1.5 w-8 rounded-full bg-purple-400" />
                  <div className="h-1.5 w-8 rounded-full bg-white/15" />
                </motion.div>
              </div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(192,132,252,0.12)",
                  border: "1px solid rgba(192,132,252,0.25)",
                }}
              >
                <Mail size={26} className="text-purple-300" />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-2 font-display text-xl font-bold text-base-text-primary"
              >
                Tạo không gian riêng
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="mb-8 text-center text-sm text-base-text-secondary/70"
              >
                Chỉ cần email — không cần mật khẩu,
                <br />
                không cần tên thật
              </motion.p>

              {/* Email input */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-full"
              >
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-base-text-secondary/40">
                    <Mail size={16} />
                  </div>
                  <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitEmail()}
                    placeholder="email@gmail.com"
                    className="w-full rounded-2xl border bg-white/[0.04] py-4 pl-11 pr-4 text-[15px] text-base-text-primary placeholder:text-base-text-secondary/30 focus:outline-none transition-all duration-300"
                    style={{
                      borderColor: emailError
                        ? "rgba(239,68,68,0.5)"
                        : email
                          ? "rgba(192,132,252,0.4)"
                          : "rgba(255,255,255,0.1)",
                      boxShadow: email && !emailError
                        ? "0 0 16px rgba(192,132,252,0.15)"
                        : emailError
                          ? "0 0 16px rgba(239,68,68,0.1)"
                          : "none",
                    }}
                  />
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 text-xs text-red-400/80 pl-1"
                    >
                      {emailError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit button */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="relative mt-6 w-full"
              >
                <motion.div
                  className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                  animate={{ opacity: email ? [0.3, 0.6, 0.3] : 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ background: "rgba(192,132,252,0.4)", transform: "scale(1.2)" }}
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitEmail}
                  className="orb-btn relative w-full rounded-full py-4 text-[15px] font-bold text-white transition-all duration-300"
                  style={{
                    minHeight: 0,
                    background: email
                      ? "linear-gradient(135deg, #2D1F5E 0%, #7C5AE2 50%, #C084FC 100%)"
                      : "rgba(255,255,255,0.08)",
                    boxShadow: email
                      ? "0 0 24px rgba(124,90,226,0.35), 0 6px 20px rgba(0,0,0,0.35)"
                      : "none",
                    color: email ? "#fff" : "rgba(255,255,255,0.35)",
                  }}
                >
                  <span className="relative flex items-center justify-center gap-2">
                    <Send size={15} />
                    Gửi đường dẫn bí mật
                    <ArrowRight size={14} />
                  </span>
                </motion.button>
              </motion.div>

              {/* Privacy note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-6 flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
              >
                <Lock size={13} className="mt-0.5 shrink-0 text-purple-300/60" />
                <p className="text-[11px] leading-relaxed text-base-text-secondary/50">
                  Email chỉ dùng để đăng nhập.{" "}
                  <span className="text-base-text-secondary/70">
                    Không ai khác nhìn thấy được.
                  </span>{" "}
                  Trong app, bạn vẫn xuất hiện với tên ẩn danh.
                </p>
              </motion.div>

              {/* Skip */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                onClick={() => router.push("/checkin")}
                className="orb-btn mt-5 text-xs text-base-text-secondary/40 hover:text-base-text-secondary/60 transition-colors py-2"
                style={{ minHeight: 0 }}
              >
                Tiếp tục ẩn danh →
              </motion.button>
            </motion.div>
          )}

          {/* =============================================
              PHASE 3 — CHECK EMAIL / CONFIRMATION
              ============================================= */}
          {phase === "check" && (
            <motion.div
              key="check"
              {...pageTransition}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              {/* Animated envelope icon */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="relative mb-8"
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #34D399, #065F46)",
                    boxShadow: "0 0 40px 10px rgba(52,211,153,0.25)",
                  }}
                >
                  <Mail size={32} className="text-white" />
                </div>
                {/* Success check overlay */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 15 }}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500"
                  style={{ boxShadow: "0 0 12px rgba(52,211,153,0.5)" }}
                >
                  <CheckCircle2 size={16} className="text-white" />
                </motion.div>
                {/* Pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  style={{ background: "rgba(52,211,153,0.2)" }}
                />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-2 font-display text-xl font-bold text-base-text-primary"
              >
                Kiểm tra hộp thư ✉️
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-sm leading-relaxed text-base-text-secondary/70"
              >
                Một đường dẫn bí mật đã được gửi tới
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="mt-1.5 rounded-full border border-purple-400/20 bg-purple-400/8 px-4 py-1.5 text-sm font-semibold text-purple-300"
              >
                {getMaskedEmail()}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42 }}
                className="mt-5 text-xs text-base-text-secondary/50 leading-relaxed"
              >
                Click vào link trong email
                <br />
                để mở khoá không gian của bạn
              </motion.p>

              {/* Resend */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mt-6"
              >
                {resendTimer > 0 ? (
                  <p className="text-xs text-base-text-secondary/40">
                    Chưa nhận được? Gửi lại sau{" "}
                    <span className="font-mono text-purple-300/60">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="orb-btn flex items-center gap-1.5 text-xs text-purple-300/70 hover:text-purple-300 transition-colors py-1"
                    style={{ minHeight: 0 }}
                  >
                    <RefreshCw size={12} />
                    Gửi lại đường dẫn
                  </button>
                )}
              </motion.div>

              {/* Demo auto-login indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/8 px-4 py-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw size={13} className="text-emerald-400/60" />
                </motion.div>
                <p className="text-[11px] text-emerald-400/70">
                  <span className="font-semibold">Demo:</span> Tự động đăng nhập sau 3 giây...
                </p>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </SkyCanvas>
  );
}
