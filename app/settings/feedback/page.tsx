"use client";

import { useEffect, useMemo, useState, ChangeEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Paperclip, X, Send, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { useAppState } from "@/context/AppStateContext";
import { useLanguage } from "@/context/LanguageContext";
import { APP_VERSION } from "@/lib/version";

// =====================================================
// MODULE 7 — Feedback từ người dùng
// -----------------------------------------------------
// 7.2/7.3: chưa có backend thật (bảng `feedback` trên Supabase là việc của
// tương lai) — submissions được lưu vào localStorage như một "mock DB",
// đủ để minh hoạ luồng UI đầy đủ (category, rating, message, screenshot,
// context tự động đính kèm) mà không cần server.
// =====================================================

type FeedbackCategory = "bug" | "feature" | "ux" | "content" | "other";

const CATEGORY_ORDER: FeedbackCategory[] = ["bug", "feature", "ux", "content", "other"];

const STORAGE_KEY = "solace:feedback-submissions";

interface FeedbackSubmission {
  id: string;
  category: FeedbackCategory;
  rating: number; // 0 = chưa đánh giá
  message: string;
  screenshotDataUrl?: string;
  context: {
    pageUrl: string;
    mood: number | null;
    appVersion: string;
    device: string;
  };
  timestamp: number;
}

function getDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Không xác định";
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  let os = "Không rõ hệ điều hành";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  return `${isMobile ? "Di động" : "Máy tính"} · ${os}`;
}

export default function FeedbackPage() {
  const { mood, moodHistory } = useAppState();
  const { t } = useLanguage();

  const [category, setCategory] = useState<FeedbackCategory>("ux");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pageUrl, setPageUrl] = useState("/settings");
  const [device, setDevice] = useState("");

  useEffect(() => {
    try {
      const ref = document.referrer;
      if (ref) {
        const url = new URL(ref);
        if (url.origin === window.location.origin) setPageUrl(url.pathname);
      }
    } catch {
      // ignore
    }
    setDevice(getDeviceLabel());
  }, []);

  const latestMood = useMemo(() => {
    if (mood !== null) return mood;
    if (moodHistory.length === 0) return null;
    return moodHistory.reduce((latest, e) => (e.timestamp > latest.timestamp ? e : latest)).value;
  }, [mood, moodHistory]);

  function handleScreenshotChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (message.trim().length === 0) return;

    const submission: FeedbackSubmission = {
      id: `fb-${Date.now()}`,
      category,
      rating,
      message: message.trim(),
      screenshotDataUrl: screenshot ?? undefined,
      context: {
        pageUrl,
        mood: latestMood,
        appVersion: APP_VERSION,
        device,
      },
      timestamp: Date.now(),
    };

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const list: FeedbackSubmission[] = raw ? JSON.parse(raw) : [];
      list.unshift(submission);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // storage full/unavailable — vẫn cho qua UI để không chặn trải nghiệm
    }

    setSubmitted(true);
  }

  return (
    <div className="min-h-dvh bg-base-gradient px-4 py-8 md:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/settings"
          className="mb-6 inline-flex items-center gap-2 text-sm text-base-text-secondary hover:text-base-text-primary transition-colors"
        >
          <ArrowLeft size={16} /> {t("common.back")}
        </Link>

        <header className="mb-6">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-base-text-primary">
            {t("feedback.title")}
          </h1>
          <p className="mt-2 text-sm text-base-text-secondary">{t("feedback.subtitle")}</p>
        </header>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 rounded-card border border-warm/25 bg-warm/8 p-8 text-center"
            >
              <CheckCircle2 size={32} className="text-warm" />
              <p className="text-sm font-bold text-base-text-primary">{t("feedback.submitted")}</p>
              <Link
                href="/settings"
                className="mt-2 text-xs font-bold text-sky-aurora underline underline-offset-4 hover:text-sky-glow"
              >
                {t("common.back")}
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-5 rounded-card border border-base-divider bg-base-surface/40 p-5 backdrop-blur"
            >
              {/* Category */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-base-text-secondary/60">
                  {t("feedback.category")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ORDER.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={clsx(
                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all",
                        category === c
                          ? "border-sky-aurora/50 bg-sky-aurora/15 text-sky-aurora"
                          : "border-base-divider text-base-text-secondary/60 hover:text-base-text-primary"
                      )}
                    >
                      {t(`feedback.categories.${c}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-base-text-secondary/60">
                  {t("feedback.rating")}
                </p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = (hoverRating || rating) >= n;
                    return (
                      <button
                        key={n}
                        onClick={() => setRating(rating === n ? 0 : n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${n} sao`}
                        className="orb-btn p-0.5"
                        style={{ minHeight: 0 }}
                      >
                        <Star
                          size={22}
                          className={filled ? "text-sky-gold" : "text-white/15"}
                          fill={filled ? "currentColor" : "none"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-base-text-secondary/60">
                  {t("feedback.message")}
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("feedback.messagePlaceholder")}
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-base-divider bg-base-surface/60 px-4 py-3 text-sm leading-relaxed text-base-text-primary placeholder:text-base-text-secondary/40 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* Screenshot */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-base-text-secondary/60">
                  {t("feedback.attachScreenshot")}
                </p>
                {screenshot ? (
                  <div className="relative w-fit">
                    <img src={screenshot} alt="Screenshot" className="max-h-40 rounded-xl border border-white/10" />
                    <button
                      onClick={() => setScreenshot(null)}
                      className="orb-btn absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-critical text-white"
                      style={{ minHeight: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="orb-btn inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-white/15 px-3.5 py-2 text-[12px] text-base-text-secondary/60 hover:text-base-text-primary hover:border-white/30 transition-colors">
                    <Paperclip size={13} />
                    {t("feedback.attachScreenshot")}
                    <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotChange} />
                  </label>
                )}
              </div>

              {/* Auto-attached context */}
              <div className="rounded-xl border border-white/6 bg-white/[0.02] px-3.5 py-3">
                <p className="text-[10.5px] leading-relaxed text-base-text-secondary/45">{t("feedback.contextNote")}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-base-text-secondary/40">
                  <span>📍 {pageUrl}</span>
                  <span>💭 {latestMood !== null ? `${latestMood}/10` : "—"}</span>
                  <span>📦 v{APP_VERSION}</span>
                  <span>📱 {device}</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={message.trim().length === 0}
                className="orb-btn flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  minHeight: 0,
                  background: "linear-gradient(135deg, #3A2E5C 0%, #F5D67D 100%)",
                }}
              >
                <Send size={14} />
                {t("feedback.submit")}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
