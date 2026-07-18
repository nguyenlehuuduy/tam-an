"use client";

// Module 4 — /history đã được nâng cấp thành /dashboard (Personal Dashboard
// đầy đủ Emotion Calendar + Insights). Giữ route này lại làm redirect để
// không phá các đường dẫn cũ (bookmark, link đã chia sẻ...).
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HistoryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
