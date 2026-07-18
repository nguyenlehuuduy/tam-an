"use client";

import { useEffect, useRef } from "react";
import { useAppState } from "@/context/AppStateContext";
import { useNotifications } from "@/context/NotificationContext";
import { warmthLabel } from "@/lib/mockSignals";

// =====================================================
// MODULE 6.2 — Cầu nối sự kiện thật → thông báo trong app.
// Vì MVP hiện tại chưa có multi-user thật (không có backend để biết ai
// khác vừa reaction vào story của bạn), component này theo dõi chính
// userStories của bạn và phát thông báo khi reactionCount/warmth của một
// câu chuyện của bạn tăng lên — mô phỏng đúng luồng "ai đó gửi phản hồi
// cho story của bạn" / "story đạt warmth milestone" một cách trung thực
// với dữ liệu đang có, không giả lập số liệu giả bừa bãi.
// =====================================================
export function NotificationEventsBridge() {
  const { userStories, hydrated } = useAppState();
  const { addNotification } = useNotifications();
  const prevRef = useRef<Record<string, { reactionCount: number; warmth: string }> | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    // Lần chạy đầu tiên sau khi hydrate: chỉ ghi nhận baseline, không bắn
    // thông báo (tránh spam thông báo giả cho dữ liệu đã có sẵn từ trước).
    if (prevRef.current === null) {
      const baseline: Record<string, { reactionCount: number; warmth: string }> = {};
      userStories.forEach((s) => {
        baseline[s.id] = { reactionCount: s.reactionCount, warmth: s.warmth };
      });
      prevRef.current = baseline;
      return;
    }

    userStories.forEach((s) => {
      const prev = prevRef.current![s.id];
      if (prev) {
        if (s.reactionCount > prev.reactionCount) {
          addNotification({
            type: "reaction",
            title: "Có người vừa gửi tia sáng cho bạn",
            body: `Câu chuyện "${s.content.slice(0, 48)}${s.content.length > 48 ? "..." : ""}" vừa nhận được một phản hồi ấm áp.`,
            link: "/dashboard",
          });
        }
        if (s.warmth !== prev.warmth && s.warmth !== "few") {
          addNotification({
            type: "milestone",
            title: "Câu chuyện của bạn đang toả sáng",
            body: `"${s.content.slice(0, 40)}${s.content.length > 40 ? "..." : ""}" ${warmthLabel(s.warmth).toLowerCase()}.`,
            link: "/dashboard",
          });
        }
      }
      prevRef.current![s.id] = { reactionCount: s.reactionCount, warmth: s.warmth };
    });
  }, [userStories, hydrated, addNotification]);

  return null;
}
