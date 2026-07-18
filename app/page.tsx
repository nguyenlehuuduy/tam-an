"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppState } from "@/context/AppStateContext";

/**
 * Root page — redirect logic:
 * - Chưa đăng nhập → /auth (mời tạo tài khoản, hoặc bỏ qua để dùng Guest)
 * - Đã đăng nhập nhưng chưa tuỳ chỉnh hồ sơ → /profile-setup (Module 1.2)
 * - Đã đăng nhập và đã xong hồ sơ → /checkin (vào app luôn)
 */
export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated: authHydrated } = useAuth();
  const { profileSetupComplete, hydrated: appHydrated } = useAppState();

  useEffect(() => {
    if (!authHydrated || !appHydrated) return;
    if (isAuthenticated) {
      router.replace(profileSetupComplete ? "/checkin" : "/profile-setup");
    } else {
      router.replace("/auth");
    }
  }, [authHydrated, appHydrated, isAuthenticated, profileSetupComplete, router]);

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
