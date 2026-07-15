"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Root page — redirect logic:
 * - Chưa đăng nhập → /auth (mời tạo tài khoản)
 * - Đã đăng nhập → /checkin (vào app luôn)
 */
export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) {
      router.replace("/checkin");
    } else {
      router.replace("/auth");
    }
  }, [hydrated, isAuthenticated, router]);

  // Loading skeleton while hydrating
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#060a13]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
        <p className="text-xs text-base-text-secondary/40 animate-pulse">
          Đang mở không gian...
        </p>
      </div>
    </div>
  );
}
