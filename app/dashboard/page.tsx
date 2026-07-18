"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Waves,
  Calendar,
  Sparkles,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Wind,
  Feather,
  Compass,
  X,
  BookOpen,
  Settings as SettingsIcon,
  Library,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { useLanguage } from "@/context/LanguageContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { FeedbackNudge } from "@/components/feedback/FeedbackNudge";
import { Story } from "@/lib/mockSignals";
import { suggestArticlesForMood, getArticleTranslation, CATEGORY_LABELS } from "@/lib/libraryContent";
import clsx from "clsx";

// =====================================================
// MODULE 4 — Dashboard cá nhân (nâng cấp từ /history)
// Trung tâm theo dõi sức khoẻ tinh thần: Emotion Calendar (tuần/tháng/năm)
// + Insights cá nhân hoá. Toàn bộ tính toán chạy client-side trên dữ liệu
// đã có sẵn trong AppStateContext (moodHistory, userStories) — chưa cần
// backend, đúng ràng buộc hiện tại của dự án.
// =====================================================

type ViewMode = "week" | "month" | "year";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_LABELS = [
  "Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12",
];

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function keyForYMD(y: number, m: number, day: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Icon spectrum ☁️ → ☀️ theo mức mood 1–10 — spec 4.1 */
function moodMeta(value: number | null) {
  if (value === null) {
    return { emoji: "·", label: "Chưa có dữ liệu", color: "rgba(255,255,255,0.12)", text: "rgba(255,255,255,0.3)" };
  }
  if (value <= 2.5) return { emoji: "☁️", label: "Rất nặng", color: "#6B3FA0", text: "#C9A8F0" };
  if (value <= 4.5) return { emoji: "🌥️", label: "Trĩu nặng", color: "#4A5E8A", text: "#A8C0F0" };
  if (value <= 6.5) return { emoji: "⛅", label: "Bình bình", color: "#7C9EFF", text: "#CBD8FF" };
  if (value <= 8.5) return { emoji: "🌤️", label: "Khá ổn", color: "#4FD1C5", text: "#B8F0EA" };
  return { emoji: "☀️", label: "Nhẹ bổng", color: "#F5D67D", text: "#FCEBB8" };
}

function formatDateLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });
}

export default function DashboardPage() {
  const { moodHistory, userStories } = useAppState();
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const now = useRef(new Date()).current;
  const [monthCursor, setMonthCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [yearCursor, setYearCursor] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [breathOpen, setBreathOpen] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");

  // ---- Gộp dữ liệu theo ngày ----
  const moodByDay = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    moodHistory.forEach((e) => {
      const k = dayKey(e.timestamp);
      const cur = map.get(k) || { sum: 0, count: 0 };
      cur.sum += e.value;
      cur.count += 1;
      map.set(k, cur);
    });
    return map;
  }, [moodHistory]);

  const storiesByDay = useMemo(() => {
    const map = new Map<string, Story[]>();
    userStories.forEach((s) => {
      const k = dayKey(s.createdAt);
      const arr = map.get(k) || [];
      arr.push(s);
      map.set(k, arr);
    });
    return map;
  }, [userStories]);

  function avgMoodForDay(k: string): number | null {
    const v = moodByDay.get(k);
    return v ? v.sum / v.count : null;
  }

  // ---- Tuần — 7 ngày gần nhất ----
  const weekDays = useMemo(() => {
    const days: { key: string; label: string; dateLabel: string; value: number | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = dayKey(d.getTime());
      const weekdayIdx = (d.getDay() + 6) % 7; // Monday = 0
      days.push({
        key: k,
        label: WEEKDAY_LABELS[weekdayIdx],
        dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
        value: avgMoodForDay(k),
      });
    }
    return days;
  }, [moodByDay, now]);

  const weekCheckinCount = weekDays.filter((d) => d.value !== null).length;

  // ---- Module 5.3 — gợi ý bài viết từ Thư viện theo mood pattern gần đây ----
  const recentMoodAvg = useMemo(() => {
    const vals = weekDays.map((d) => d.value).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [weekDays]);

  const suggestedArticles = useMemo(() => suggestArticlesForMood(recentMoodAvg, 2), [recentMoodAvg]);

  // ---- Tháng — calendar grid ----
  const monthGrid = useMemo(() => {
    const { year, month } = monthCursor;
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekdayIdx = (firstDay.getDay() + 6) % 7; // Monday = 0
    const cells: { day: number | null; key: string | null }[] = [];
    for (let i = 0; i < firstWeekdayIdx; i++) cells.push({ day: null, key: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: keyForYMD(year, month, d) });
    return cells;
  }, [monthCursor]);

  const isCurrentRealMonth = monthCursor.year === now.getFullYear() && monthCursor.month === now.getMonth();

  // ---- Năm — trung bình mood theo 12 tháng ----
  const yearMonths = useMemo(() => {
    const sums = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }));
    moodHistory.forEach((e) => {
      const d = new Date(e.timestamp);
      if (d.getFullYear() !== yearCursor) return;
      sums[d.getMonth()].sum += e.value;
      sums[d.getMonth()].count += 1;
    });
    return sums.map((s, idx) => ({
      month: idx,
      label: MONTH_LABELS[idx],
      value: s.count > 0 ? s.sum / s.count : null,
    }));
  }, [moodHistory, yearCursor]);

  const isCurrentRealYear = yearCursor === now.getFullYear();

  // ---- Insights (4.2) ----
  const monthlyComparison = useMemo(() => {
    const curKey = `${now.getFullYear()}-${now.getMonth()}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let curSum = 0, curCount = 0, prevSum = 0, prevCount = 0;
    moodHistory.forEach((e) => {
      const d = new Date(e.timestamp);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        curSum += e.value;
        curCount += 1;
      } else if (d.getFullYear() === prevDate.getFullYear() && d.getMonth() === prevDate.getMonth()) {
        prevSum += e.value;
        prevCount += 1;
      }
    });
    const curAvg = curCount > 0 ? curSum / curCount : null;
    const prevAvg = prevCount > 0 ? prevSum / prevCount : null;
    return { curAvg, prevAvg };
  }, [moodHistory, now]);

  const comparisonText = useMemo(() => {
    const { curAvg, prevAvg } = monthlyComparison;
    if (curAvg === null) return "Chưa có đủ dữ liệu check-in tháng này để so sánh.";
    if (prevAvg === null) return `Mood trung bình tháng này đang ở mức ${curAvg.toFixed(1)}/10.`;
    const diff = curAvg - prevAvg;
    if (diff <= -0.5) {
      return `Mood trung bình tháng này (${curAvg.toFixed(1)}/10) thấp hơn tháng trước (${prevAvg.toFixed(1)}/10) một chút. Có lẽ đây là lúc chậm lại và chăm sóc bản thân nhiều hơn.`;
    }
    if (diff >= 0.5) {
      return `Mood trung bình tháng này (${curAvg.toFixed(1)}/10) đang nhẹ nhàng hơn tháng trước (${prevAvg.toFixed(1)}/10). Bạn đang làm rất tốt!`;
    }
    return `Mood trung bình tháng này (${curAvg.toFixed(1)}/10) khá ổn định so với tháng trước.`;
  }, [monthlyComparison]);

  const streakText = useMemo(() => {
    if (weekCheckinCount >= 6) return `Tuần này bạn check-in ${weekCheckinCount}/7 ngày — thật đều đặn, tiếp tục nhé!`;
    if (weekCheckinCount >= 3) return `Tuần này bạn check-in ${weekCheckinCount}/7 ngày — tiếp tục nhé, mỗi lần ghé qua đều có ý nghĩa.`;
    if (weekCheckinCount > 0) return `Tuần này bạn check-in ${weekCheckinCount}/7 ngày. Bắt đầu chậm cũng không sao, cứ quay lại khi bạn sẵn sàng.`;
    return "Tuần này chưa có check-in nào. Ghé qua một chút mỗi ngày cũng đủ để nhận ra mình đang cảm thấy thế nào.";
  }, [weekCheckinCount]);

  // ---- Bài tập hít thở 4-7-8 ----
  useEffect(() => {
    if (!breathOpen) return;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    function cycle() {
      setBreathPhase("in");
      t1 = setTimeout(() => {
        setBreathPhase("hold");
        t2 = setTimeout(() => {
          setBreathPhase("out");
          t3 = setTimeout(cycle, 8000);
        }, 7000);
      }, 4000);
    }
    cycle();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [breathOpen]);

  const breathCaption =
    breathPhase === "in" ? "Hít vào thật sâu..." : breathPhase === "hold" ? "Giữ hơi thở..." : "Thở ra thật chậm...";

  const selectedDayStories = selectedDate ? storiesByDay.get(selectedDate) || [] : [];
  const selectedDayMood = selectedDate ? avgMoodForDay(selectedDate) : null;

  return (
    <div className="min-h-dvh bg-base-gradient px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm text-base-text-secondary hover:text-base-text-primary transition-colors"
          >
            <ArrowLeft size={16} /> Quay lại không gian khám phá
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href="/library"
              aria-label="Thư viện kiến thức"
              className="orb-btn flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-base-text-secondary/70 hover:bg-white/10 hover:text-base-text-primary transition-colors"
              style={{ minHeight: 0 }}
            >
              <Library size={15} />
            </Link>
            <NotificationBell />
            <Link
              href="/settings"
              aria-label="Cài đặt"
              className="orb-btn flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-base-text-secondary/70 hover:bg-white/10 hover:text-base-text-primary transition-colors"
              style={{ minHeight: 0 }}
            >
              <SettingsIcon size={15} />
            </Link>
          </div>
        </div>

        <header className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-base-text-primary">
            Dashboard cá nhân
          </h1>
          <p className="mt-2 text-sm text-base-text-secondary">
            Nơi nhìn lại chặng đường cảm xúc của bạn. Chỉ duy nhất thiết bị của bạn lưu giữ những dữ liệu này.
          </p>
        </header>

        <FeedbackNudge />

        {/* ======================================================
            4.1 — EMOTION CALENDAR
            ====================================================== */}
        <section className="mb-8 rounded-card border border-base-divider bg-base-surface/40 p-5 backdrop-blur shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-base-text-secondary flex items-center gap-2">
              <Calendar size={16} className="text-sky-aurora" /> Emotion Calendar
            </h2>
            <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/6">
              {(["week", "month", "year"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={clsx(
                    "rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all duration-300",
                    viewMode === v
                      ? "bg-sky-violet/80 text-white shadow-md"
                      : "text-base-text-secondary/60 hover:text-base-text-secondary"
                  )}
                >
                  {v === "week" ? "Tuần" : v === "month" ? "Tháng" : "Năm"}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === "week" && (
              <motion.div
                key="week"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-7 gap-2"
              >
                {weekDays.map((d) => {
                  const meta = moodMeta(d.value);
                  const heightPct = d.value !== null ? 20 + (d.value / 10) * 80 : 12;
                  return (
                    <button
                      key={d.key}
                      onClick={() => setSelectedDate(d.key)}
                      className="orb-btn flex flex-col items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.02] px-1 py-3 hover:bg-white/[0.06] transition-colors"
                      style={{ minHeight: 0 }}
                    >
                      <span className="text-base leading-none">{meta.emoji}</span>
                      <div className="flex h-16 w-full items-end justify-center">
                        <div
                          className="w-3.5 rounded-full transition-all duration-500"
                          style={{ height: `${heightPct}%`, background: meta.color, opacity: d.value !== null ? 0.85 : 0.25 }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-base-text-secondary/60">{d.label}</span>
                      <span className="text-[9px] text-base-text-secondary/35">{d.dateLabel}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {viewMode === "month" && (
              <motion.div key="month" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setMonthCursor((c) => {
                        const m = c.month === 0 ? 11 : c.month - 1;
                        const y = c.month === 0 ? c.year - 1 : c.year;
                        return { year: y, month: m };
                      })
                    }
                    className="orb-btn rounded-lg bg-white/[0.04] p-1.5 text-base-text-secondary/60 hover:text-base-text-primary hover:bg-white/8 transition-colors"
                    style={{ minHeight: 0 }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <p className="text-xs font-bold text-base-text-primary">
                    Tháng {monthCursor.month + 1}/{monthCursor.year}
                  </p>
                  <button
                    disabled={isCurrentRealMonth}
                    onClick={() =>
                      setMonthCursor((c) => {
                        const m = c.month === 11 ? 0 : c.month + 1;
                        const y = c.month === 11 ? c.year + 1 : c.year;
                        return { year: y, month: m };
                      })
                    }
                    className="orb-btn rounded-lg bg-white/[0.04] p-1.5 text-base-text-secondary/60 hover:text-base-text-primary hover:bg-white/8 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{ minHeight: 0 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  {WEEKDAY_LABELS.map((w) => (
                    <p key={w} className="text-center text-[9px] font-bold uppercase text-base-text-secondary/35">
                      {w}
                    </p>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {monthGrid.map((cell, idx) => {
                    if (cell.day === null || cell.key === null) {
                      return <div key={`blank-${idx}`} />;
                    }
                    const value = avgMoodForDay(cell.key);
                    const meta = moodMeta(value);
                    const hasStories = (storiesByDay.get(cell.key) || []).length > 0;
                    return (
                      <button
                        key={cell.key}
                        onClick={() => setSelectedDate(cell.key)}
                        className="orb-btn relative aspect-square rounded-xl border text-[11px] font-semibold transition-all hover:scale-105"
                        style={{
                          minHeight: 0,
                          background: value !== null ? `${meta.color}30` : "rgba(255,255,255,0.02)",
                          borderColor: value !== null ? `${meta.color}55` : "rgba(255,255,255,0.06)",
                          color: value !== null ? meta.text : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {cell.day}
                        {hasStories && (
                          <span
                            className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                            style={{ background: meta.color }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {viewMode === "year" && (
              <motion.div key="year" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() => setYearCursor((y) => y - 1)}
                    className="orb-btn rounded-lg bg-white/[0.04] p-1.5 text-base-text-secondary/60 hover:text-base-text-primary hover:bg-white/8 transition-colors"
                    style={{ minHeight: 0 }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <p className="text-xs font-bold text-base-text-primary">Năm {yearCursor}</p>
                  <button
                    disabled={isCurrentRealYear}
                    onClick={() => setYearCursor((y) => y + 1)}
                    className="orb-btn rounded-lg bg-white/[0.04] p-1.5 text-base-text-secondary/60 hover:text-base-text-primary hover:bg-white/8 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{ minHeight: 0 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
                  {yearMonths.map((m) => {
                    const meta = moodMeta(m.value);
                    return (
                      <button
                        key={m.month}
                        onClick={() => {
                          setMonthCursor({ year: yearCursor, month: m.month });
                          setViewMode("month");
                        }}
                        className="orb-btn flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-all hover:scale-105"
                        style={{
                          minHeight: 0,
                          background: m.value !== null ? `${meta.color}20` : "rgba(255,255,255,0.02)",
                          borderColor: m.value !== null ? `${meta.color}45` : "rgba(255,255,255,0.06)",
                        }}
                      >
                        <span className="text-sm leading-none">{meta.emoji}</span>
                        <span className="text-[10px] font-bold text-base-text-secondary/70">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Trend line — 12 tháng */}
                <YearTrendLine months={yearMonths} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Day drill-down — tap vào ngày (spec 4.1) */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-base-text-primary capitalize">
                      {formatDateLabel(selectedDate)}
                    </p>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="orb-btn rounded-full p-1 text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
                      style={{ minHeight: 0 }}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="mb-3 flex items-center gap-2 text-xs text-base-text-secondary/70">
                    <span>{moodMeta(selectedDayMood).emoji}</span>
                    {selectedDayMood !== null
                      ? `Mood check-in: ${moodMeta(selectedDayMood).label} (${selectedDayMood.toFixed(1)}/10)`
                      : "Chưa có check-in nào trong ngày này"}
                  </div>

                  {selectedDayStories.length === 0 ? (
                    <p className="text-[12px] text-base-text-secondary/45 italic">
                      Chưa có câu chuyện nào được thả trong ngày này.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {selectedDayStories.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5 text-[12.5px] text-base-text-primary/85"
                        >
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] text-base-text-secondary/50">
                            {s.type === "star" ? <Star size={10} /> : <Waves size={10} />}
                            {s.createdAgo}
                          </div>
                          {s.content}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ======================================================
            4.2 — INSIGHTS & GỢI Ý CÁ NHÂN HOÁ
            ====================================================== */}
        <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-card border border-white/5 bg-white/5 p-5 backdrop-blur flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warm/20 text-warm">
              <TrendingUp size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-base-text-primary">Chuỗi check-in tuần này</h3>
              <p className="mt-1 text-sm leading-relaxed text-base-text-secondary">{streakText}</p>
            </div>
          </div>

          <div className="rounded-card border border-white/5 bg-white/5 p-5 backdrop-blur flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-aurora/20 text-sky-aurora">
              <Sparkles size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-base-text-primary">So sánh với tháng trước</h3>
              <p className="mt-1 text-sm leading-relaxed text-base-text-secondary">{comparisonText}</p>
            </div>
          </div>
        </section>

        {/* Module 5.3 — gợi ý bài viết từ Thư viện theo mood pattern gần đây */}
        {suggestedArticles.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold tracking-wider uppercase text-base-text-secondary flex items-center gap-2">
              <BookOpen size={16} className="text-warm" /> Gợi ý từ Thư viện dành cho bạn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedArticles.map((a) => {
                const tr = getArticleTranslation(a, language);
                return (
                  <Link
                    key={a.slug}
                    href={`/library/${a.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-base-divider bg-base-surface/40 p-3.5 backdrop-blur hover:border-white/15 hover:bg-base-surface/60 transition-all"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: a.coverGradient }}
                    >
                      {a.coverEmoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-base-text-secondary/45">
                        {CATEGORY_LABELS[a.category].emoji} {CATEGORY_LABELS[a.category].vi}
                      </p>
                      <p className="text-[13px] font-semibold text-base-text-primary group-hover:text-white transition-colors leading-snug truncate">
                        {tr.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ---- Gợi ý hành động nhẹ ---- */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold tracking-wider uppercase text-base-text-secondary flex items-center gap-2">
            <Feather size={16} className="text-ocean-aqua" /> Gợi ý cho bạn lúc này
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Breathing exercise */}
            <div className="rounded-card border border-base-divider bg-base-surface/40 p-4 backdrop-blur flex flex-col items-center text-center gap-3">
              <Wind size={18} className="text-sky-aurora" />
              <div>
                <p className="text-xs font-bold text-base-text-primary">Bài tập hít thở 4-7-8</p>
                <p className="mt-1 text-[11px] text-base-text-secondary/60 leading-relaxed">
                  Vài phút thở chậm lại có thể giúp bạn dịu đi rất nhiều.
                </p>
              </div>

              {!breathOpen ? (
                <button
                  onClick={() => setBreathOpen(true)}
                  className="orb-btn rounded-full bg-sky-aurora/15 px-4 py-1.5 text-[11px] font-bold text-sky-aurora hover:bg-sky-aurora/25 transition-colors"
                  style={{ minHeight: 0 }}
                >
                  Bắt đầu
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ scale: breathPhase === "out" ? 1 : 1.4 }}
                    transition={{ duration: breathPhase === "in" ? 4 : breathPhase === "out" ? 8 : 0, ease: "easeInOut" }}
                    className="h-14 w-14 rounded-full"
                    style={{
                      background: "radial-gradient(circle at 35% 35%, rgba(124,158,255,0.5), rgba(124,158,255,0.1))",
                      border: "1px solid rgba(124,158,255,0.4)",
                    }}
                  />
                  <p className="text-[11px] font-semibold text-sky-aurora">{breathCaption}</p>
                  <button
                    onClick={() => setBreathOpen(false)}
                    className="orb-btn text-[10px] text-base-text-secondary/50 hover:text-base-text-secondary underline underline-offset-2"
                    style={{ minHeight: 0 }}
                  >
                    Dừng lại
                  </button>
                </div>
              )}
            </div>

            {/* Journaling prompt */}
            <Link
              href="/write"
              className="rounded-card border border-base-divider bg-base-surface/40 p-4 backdrop-blur flex flex-col items-center text-center gap-3 hover:border-white/15 hover:bg-base-surface/60 transition-all"
            >
              <Feather size={18} className="text-purple-300" />
              <div>
                <p className="text-xs font-bold text-base-text-primary">Viết ra một điều trong lòng</p>
                <p className="mt-1 text-[11px] text-base-text-secondary/60 leading-relaxed">
                  Không cần phải hay — chỉ cần thật. Một dòng thôi cũng đủ nhẹ hơn.
                </p>
              </div>
              <span className="rounded-full bg-purple-400/15 px-4 py-1.5 text-[11px] font-bold text-purple-300">
                Đến trang viết
              </span>
            </Link>

            {/* Explore nudge */}
            <Link
              href="/explore"
              className="rounded-card border border-base-divider bg-base-surface/40 p-4 backdrop-blur flex flex-col items-center text-center gap-3 hover:border-white/15 hover:bg-base-surface/60 transition-all"
            >
              <Compass size={18} className="text-ocean-aqua" />
              <div>
                <p className="text-xs font-bold text-base-text-primary">Lắng nghe câu chuyện khác</p>
                <p className="mt-1 text-[11px] text-base-text-secondary/60 leading-relaxed">
                  Đôi khi biết mình không cô đơn cũng đã là một liều thuốc nhẹ.
                </p>
              </div>
              <span className="rounded-full bg-ocean-aqua/15 px-4 py-1.5 text-[11px] font-bold text-ocean-aqua">
                Vào không gian khám phá
              </span>
            </Link>
          </div>
        </section>

        {/* ---- Toàn bộ câu chuyện đã thả (giữ lại từ /history cũ) ---- */}
        <section>
          <h2 className="text-sm font-semibold tracking-wider uppercase text-base-text-secondary mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-ocean-aqua" /> Các nỗi lòng đã thả đi
          </h2>

          {userStories.length === 0 ? (
            <div className="rounded-card border border-base-divider bg-base-surface/20 p-8 text-center backdrop-blur">
              <p className="text-sm text-base-text-secondary italic">
                Bạn chưa thả tâm tư nào xuống biển hay lên bầu trời cả.
              </p>
              <Link
                href="/write"
                className="mt-4 inline-block text-xs font-bold text-sky-aurora underline underline-offset-4 hover:text-sky-glow"
              >
                Bắt đầu chia sẻ nỗi lòng ngay
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {userStories.map((s) => (
                <li
                  key={s.id}
                  className="group rounded-card border border-base-divider bg-base-surface/50 p-4 transition-all duration-300 hover:border-white/10 hover:bg-base-surface/80"
                >
                  <div className="flex items-center gap-2 text-[11px] text-base-text-secondary font-medium">
                    {s.type === "star" ? (
                      <span className="flex items-center gap-1 text-sky-gold">
                        <Star size={12} fill="currentColor" /> Bầu trời
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-ocean-aqua">
                        <Waves size={12} /> Đại dương
                      </span>
                    )}
                    <span>·</span>
                    <span>{s.createdAgo}</span>

                    {s.status === "pending_review" && (
                      <span className="ml-auto rounded-full bg-caution/10 px-2 py-0.5 text-[10px] font-semibold text-caution border border-caution/25">
                        Đang được kiểm duyệt nhẹ nhàng
                      </span>
                    )}
                  </div>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-base-text-primary group-hover:text-white transition-colors">
                    {s.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/** Đường trend nhỏ gọn cho 12 tháng — biến thể đơn giản của biểu đồ ở
 * /history cũ, chỉ vẽ những tháng có dữ liệu (bỏ qua tháng null). */
function YearTrendLine({ months }: { months: { month: number; label: string; value: number | null }[] }) {
  const width = 600;
  const height = 100;
  const padding = 20;

  const points = months
    .map((m, idx) => {
      if (m.value === null) return null;
      const x = padding + (idx / 11) * (width - padding * 2);
      const y = height - padding - ((m.value - 1) / 9) * (height - padding * 2);
      return { x, y };
    })
    .filter((p): p is { x: number; y: number } => p !== null);

  if (points.length < 2) {
    return (
      <p className="text-center text-[11px] text-base-text-secondary/35 italic py-4">
        Cần thêm dữ liệu ở vài tháng nữa để vẽ đường xu hướng cả năm.
      </p>
    );
  }

  const path = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px] h-auto">
        <path d={path} fill="none" stroke="#7C9EFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="2.5" fill="#A8C8FF" />
        ))}
      </svg>
    </div>
  );
}
