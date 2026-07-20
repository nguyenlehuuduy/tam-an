"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppState } from "@/context/AppStateContext";

/**
 * Root page — redirect logic:
 * - Đã đăng nhập nhưng chưa tuỳ chỉnh hồ sơ → /profile-setup (Module 1.2,
 *   vẫn là bước bắt buộc một lần duy nhất cho Registered user).
 * - Mọi trường hợp còn lại (Guest, hoặc Registered đã xong hồ sơ) → thẳng
 *   vào /explore. Trước đây Guest bị bắt qua /auth mỗi lần vào lại app (vì
 *   không có gì đánh dấu "đã từng chọn Guest"), và mọi người đều bị ép qua
 *   /checkin trước khi thấy được không gian — nay bỏ hẳn 2 rào cản này để
 *   ai cũng có thể trải nghiệm /explore ngay lập tức. Đăng nhập chỉ còn
 *   cần thiết cho các tính năng gắn với tài khoản cá nhân (xem banner
 *   trong /dashboard), không còn là điều kiện để vào không gian chung hay
 *   để gửi phản hồi/thả câu chuyện — những thao tác đó vẫn ẩn danh hoàn
 *   toàn như trước.
 */
export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated: authHydrated } = useAuth();
  const { profileSetupComplete, hydrated: appHydrated } = useAppState();

  useEffect(() => {
    if (!authHydrated || !appHydrated) return;
    if (isAuthenticated && !profileSetupComplete) {
      router.replace("/profile-setup");
    } else {
      router.replace("/explore");
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
