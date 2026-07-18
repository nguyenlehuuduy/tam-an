"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// =====================================================
// MODULE 6 — Thông báo (Notifications)
// -----------------------------------------------------
// Chưa có backend thật (không có real-time server, không có email service
// thật — Resend/SendGrid/Supabase Edge Functions ở mục 6.4 chỉ là ghi chú
// kiến trúc cho tương lai). Ở đây toàn bộ là dữ liệu ảo: một bộ thông báo
// mẫu được "seed" sẵn, cộng với vài thông báo được tạo động ngay trên máy
// khi chính bạn tương tác với câu chuyện của mình (xem
// NotificationEventsBridge bên dưới) — mô phỏng đúng luồng sự kiện thật
// (ai đó reaction -> bạn nhận thông báo) mà không cần multi-user thật.
// =====================================================

export type NotificationType =
  | "reaction" // Ai đó gửi reaction/ôm/quà cho story của bạn
  | "milestone" // Story của bạn đạt warmth milestone
  | "checkin-reminder" // Gợi ý check-in hàng ngày
  | "article-suggestion" // Bài viết mới phù hợp mood pattern
  | "hotline" // Hotline / crisis alert (system)
  | "product-update"; // Cập nhật sản phẩm

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

export type EmailFrequency = "off" | "daily" | "weekly";

/** Theo bảng spec 6.2 — milestone & hotline không có tuỳ chọn email
 * (luôn false, không cho bật), các loại còn lại người dùng tự bật/tắt. */
export const EMAIL_CAPABLE_TYPES: NotificationType[] = [
  "reaction",
  "checkin-reminder",
  "article-suggestion",
  "product-update",
];

export interface NotificationSettings {
  inApp: Record<NotificationType, boolean>;
  email: Record<NotificationType, boolean>;
  emailFrequency: EmailFrequency;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  settings: NotificationSettings;
  setInAppSetting: (type: NotificationType, enabled: boolean) => void;
  setEmailSetting: (type: NotificationType, enabled: boolean) => void;
  setEmailFrequency: (freq: EmailFrequency) => void;
  hydrated: boolean;
}

const STORAGE_KEY = "solace:notifications";

export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  "reaction",
  "milestone",
  "checkin-reminder",
  "article-suggestion",
  "hotline",
  "product-update",
];

function defaultSettings(): NotificationSettings {
  const inApp = {} as Record<NotificationType, boolean>;
  const email = {} as Record<NotificationType, boolean>;
  ALL_NOTIFICATION_TYPES.forEach((t) => {
    inApp[t] = true; // mọi loại đều bật in-app mặc định
    email[t] = EMAIL_CAPABLE_TYPES.includes(t) && t !== "product-update"; // mặc định bật email cho reaction/checkin/article, tắt product-update (opt-in)
  });
  return { inApp, email, emailFrequency: "weekly" };
}

function seedNotifications(): AppNotification[] {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  return [
    {
      id: "seed-1",
      type: "reaction",
      title: "Có người vừa gửi tia sáng cho bạn",
      body: "Một câu chuyện bạn thả lên bầu trời vừa nhận được một tia sáng ấm áp.",
      timestamp: now - 2 * HOUR,
      read: false,
      link: "/dashboard",
    },
    {
      id: "seed-2",
      type: "checkin-reminder",
      title: "Ghé qua check-in một chút nhé",
      body: "Hôm nay bạn chưa check-in cảm xúc — chỉ mất vài giây thôi.",
      timestamp: now - 20 * HOUR,
      read: false,
      link: "/checkin",
    },
    {
      id: "seed-3",
      type: "article-suggestion",
      title: "Bài viết có thể hợp với bạn lúc này",
      body: "\"Khi lo âu kéo đến vào ban đêm\" — một bài viết từ chuyên gia tâm lý.",
      timestamp: now - 1 * DAY - 3 * HOUR,
      read: true,
      link: "/library/doi-dien-voi-lo-au",
    },
    {
      id: "seed-4",
      type: "milestone",
      title: "Câu chuyện của bạn đang toả sáng",
      body: "Một câu chuyện bạn thả xuống đại dương đã nhận được nhiều tia sáng — cộng đồng đang ở bên bạn.",
      timestamp: now - 3 * DAY,
      read: true,
      link: "/dashboard",
    },
    {
      id: "seed-5",
      type: "product-update",
      title: "Solace vừa có bản cập nhật mới",
      body: "Thư viện kiến thức và Dashboard cá nhân vừa ra mắt — khám phá ngay.",
      timestamp: now - 6 * DAY,
      read: true,
      link: "/library",
    },
  ];
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(() => defaultSettings());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { items?: AppNotification[]; settings?: NotificationSettings };
        setNotifications(Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : seedNotifications());
        if (parsed.settings) {
          setSettings((prev) => ({ ...prev, ...parsed.settings }));
        }
      } else {
        setNotifications(seedNotifications());
      }
    } catch {
      setNotifications(seedNotifications());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: notifications, settings }));
    } catch {
      // storage full/unavailable — ignore
    }
  }, [notifications, settings, hydrated]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    setNotifications((prev) => [
      { ...n, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now(), read: false },
      ...prev,
    ]);
  }, []);

  const setInAppSetting = useCallback((type: NotificationType, enabled: boolean) => {
    setSettings((prev) => ({ ...prev, inApp: { ...prev.inApp, [type]: enabled } }));
  }, []);

  const setEmailSetting = useCallback((type: NotificationType, enabled: boolean) => {
    if (!EMAIL_CAPABLE_TYPES.includes(type)) return;
    setSettings((prev) => ({ ...prev, email: { ...prev.email, [type]: enabled } }));
  }, []);

  const setEmailFrequency = useCallback((freq: EmailFrequency) => {
    setSettings((prev) => ({ ...prev, emailFrequency: freq }));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    addNotification,
    settings,
    setInAppSetting,
    setEmailSetting,
    setEmailFrequency,
    hydrated,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
