"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircleHeart, X } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

const DISMISSED_KEY = "tram-phat-sang:feedback-nudge-dismissed";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type MilestoneId = "first-story" | "seven-days";

function loadDismissed(): MilestoneId[] {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as MilestoneId[]) : [];
  } catch {
    return [];
  }
}

function saveDismissed(ids: MilestoneId[]) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

// =====================================================
// MODULE 7.1 — Entry point "gentle prompt" sau milestone (release story lần
// đầu, dùng app 7 ngày). Cố tình KHÔNG dùng popup/modal chặn thao tác —
// chỉ một banner inline, có thể lờ đi hoặc đóng bất cứ lúc nào.
// =====================================================
export function FeedbackNudge() {
  const { userStories, firstOpenAt, hydrated } = useAppState();
  const [dismissed, setDismissed] = useState<MilestoneId[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDismissed(loadDismissed());
    setMounted(true);
  }, []);

  if (!mounted || !hydrated) return null;

  const daysSinceOpen = (Date.now() - firstOpenAt) / (24 * 60 * 60 * 1000);
  const hasReleasedFirstStory = userStories.length >= 1;
  const usedSevenDays = daysSinceOpen >= 7;

  let milestone: MilestoneId | null = null;
  if (!dismissed.includes("first-story") && hasReleasedFirstStory) {
    milestone = "first-story";
  } else if (!dismissed.includes("seven-days") && usedSevenDays) {
    milestone = "seven-days";
  }

  if (!milestone) return null;

  function handleDismiss() {
    const next = [...dismissed, milestone as MilestoneId];
    setDismissed(next);
    saveDismissed(next);
  }

  const copy =
    milestone === "first-story"
      ? "Bạn vừa thả câu chuyện đầu tiên của mình. Trải nghiệm vừa rồi thế nào với bạn?"
      : "Bạn đã đồng hành cùng Trạm được một tuần rồi. Có điều gì bạn muốn Trạm cải thiện không?";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-6 flex items-center gap-3 rounded-2xl border border-warm/25 bg-warm/8 px-4 py-3"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warm/20 text-warm">
          <MessageCircleHeart size={16} />
        </span>
        <p className="flex-1 text-[12.5px] leading-snug text-base-text-primary/90">{copy}</p>
        <Link
          href="/settings/feedback"
          onClick={handleDismiss}
          className="orb-btn shrink-0 rounded-full bg-warm/20 px-3 py-1.5 text-[11px] font-bold text-warm hover:bg-warm/30 transition-colors"
          style={{ minHeight: 0 }}
        >
          Góp ý
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Đóng"
          className="orb-btn shrink-0 text-base-text-secondary/40 hover:text-base-text-secondary transition-colors"
          style={{ minHeight: 0 }}
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
