import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Nunito } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/context/AppStateContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { VibeSync } from "@/components/onboarding/VibeSync";
import { NotificationEventsBridge } from "@/components/notifications/NotificationEventsBridge";

// Chuyển từ <link> Google Fonts nạp lúc runtime sang next/font/google — tải
// font ngay lúc BUILD, tự host static, không còn phụ thuộc mạng lúc người
// dùng mở app và loại bỏ hiện tượng giật layout (CLS) do font nhảy vào
// sau khi trang đã render (mục 3.3/3.9 tài liệu dự án — khoảng trống design
// system đã ghi nhận). CSS variable được set trên <html>, dùng lại trong
// tailwind.config.ts (fontFamily.display/body) và globals.css.
const plusJakarta = Plus_Jakarta_Sans({
  // "vietnamese" subset cần thiết để chữ có dấu (dùng trong tiêu đề như
  // "Không gian Bầu Trời") render đúng font này thay vì rơi về fallback.
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trạm Phát Sáng",
  description:
    "Không gian ảo ẩn danh — viết ra điều đang nặng lòng, thả nó vào bầu trời hoặc đại dương, và nhận lại một tia sáng ấm áp.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0e17",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`dark ${plusJakarta.variable} ${nunito.variable}`} data-vibe="cozy">
      <body className="bg-base-gradient">
        <LanguageProvider>
          <AuthProvider>
            <AppStateProvider>
              <NotificationProvider>
                <VibeSync />
                <NotificationEventsBridge />
                <main className="app-frame">{children}</main>
              </NotificationProvider>
            </AppStateProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
