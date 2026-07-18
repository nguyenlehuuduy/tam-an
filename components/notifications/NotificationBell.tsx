"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, TrendingUp, Calendar, BookOpen, HeartHandshake, Megaphone, X } from "lucide-react";
import clsx from "clsx";
import { useNotifications, AppNotification, NotificationType } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";

// =====================================================
// MODULE 6.3 — UI Notifications
// Bell icon + notification center (dropdown, không phải trang riêng —
// gọn hơn cho MVP), grouped Hôm nay / Tuần này / Trước đó, badge unread.
// =====================================================

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  reaction: Heart,
  milestone: TrendingUp,
  "checkin-reminder": Calendar,
  "article-suggestion": BookOpen,
  hotline: HeartHandshake,
  "product-update": Megaphone,
};

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function groupNotifications(items: AppNotification[]) {
  const now = Date.now();
  const todayK = dayKey(now);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const today: AppNotification[] = [];
  const thisWeek: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  items.forEach((n) => {
    if (dayKey(n.timestamp) === todayK) today.push(n);
    else if (n.timestamp >= weekAgo) thisWeek.push(n);
    else earlier.push(n);
  });
  return { today, thisWeek, earlier };
}

function timeAgoLabel(ts: number): string {
  const diffMs = Date.now() - ts;
  const hr = Math.floor(diffMs / (60 * 60 * 1000));
  if (hr < 1) return "vừa xong";
  if (hr < 24) return `${hr} giờ trước`;
  return `${Math.floor(hr / 24)} ngày trước`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const grouped = groupNotifications(notifications);

  function handleTap(n: AppNotification) {
    markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  function renderGroup(label: string, items: AppNotification[]) {
    if (items.length === 0) return null;
    return (
      <div key={label} className="mb-3 last:mb-0">
        <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-base-text-secondary/40">{label}</p>
        <div className="flex flex-col gap-1">
          {items.map((n) => {
            const Icon = TYPE_ICON[n.type];
            return (
              <button
                key={n.id}
                onClick={() => handleTap(n)}
                className={clsx(
                  "orb-btn flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/6",
                  !n.read && "bg-white/[0.04]"
                )}
                style={{ minHeight: 0 }}
              >
                <span
                  className={clsx(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    n.type === "hotline" ? "bg-caution/20 text-caution" : "bg-sky-aurora/15 text-sky-aurora"
                  )}
                >
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-semibold text-base-text-primary">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-aurora" />}
                  </span>
                  <span className="block text-[11px] leading-snug text-base-text-secondary/60 line-clamp-2">{n.body}</span>
                  <span className="mt-0.5 block text-[9.5px] text-base-text-secondary/35">{timeAgoLabel(n.timestamp)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        aria-label={t("notifications.title")}
        onClick={() => setOpen((v) => !v)}
        className="orb-btn relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-base-text-secondary/70 hover:bg-white/10 hover:text-base-text-primary transition-colors"
        style={{ minHeight: 0 }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-11 z-50 max-h-[70vh] w-80 overflow-y-auto rounded-2xl shadow-2xl"
              style={{
                background: "rgba(12,16,28,0.97)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
              }}
            >
              <div
                className="sticky top-0 flex items-center justify-between border-b border-white/8 px-4 py-3"
                style={{ background: "rgba(12,16,28,0.97)" }}
              >
                <p className="text-xs font-bold text-base-text-primary">{t("notifications.title")}</p>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="orb-btn text-[10px] font-semibold text-sky-aurora hover:underline"
                      style={{ minHeight: 0 }}
                    >
                      {t("notifications.markAllRead")}
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="orb-btn text-base-text-secondary/50 hover:text-base-text-secondary"
                    style={{ minHeight: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-[12px] italic text-base-text-secondary/40">{t("notifications.empty")}</p>
                ) : (
                  <>
                    {renderGroup(t("notifications.groups.today"), grouped.today)}
                    {renderGroup(t("notifications.groups.thisWeek"), grouped.thisWeek)}
                    {renderGroup(t("notifications.groups.earlier"), grouped.earlier)}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
