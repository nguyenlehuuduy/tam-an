import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStateProvider } from "@/context/AppStateContext";
import { AuthProvider } from "@/context/AuthContext";
import { VibeSync } from "@/components/onboarding/VibeSync";

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
    <html lang="vi" className="dark" data-vibe="cozy">
      <head>
        {/*
          Fonts are linked at runtime (not next/font/google) so this project
          builds fine offline too — swap for next/font/google once you have
          normal internet access, per the design spec (mục A5).
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base-gradient">
        <AuthProvider>
          <AppStateProvider>
            <VibeSync />
            <main className="app-frame">{children}</main>
          </AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
