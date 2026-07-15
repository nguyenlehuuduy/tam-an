"use client";

import { HeartHandshake, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function HotlineBanner() {
  const { lang } = useLanguage();

  return (
    <div className="rounded-card border border-caution/30 bg-caution/10 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-caution/20 p-2">
          <HeartHandshake size={18} className="text-caution" />
        </div>
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-base-text-primary">
            {lang === "vi"
              ? "Nếu lòng bạn đang rất nặng, có người sẵn sàng lắng nghe ngay bây giờ."
              : "If you are carrying a heavy burden, please know someone is ready to listen to you right now."}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href="tel:111"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-caution underline-offset-4 hover:underline"
            >
              <Phone size={13} />
              {lang === "vi"
                ? "Gọi 111 · Tổng đài Quốc gia Bảo vệ Trẻ em (Miễn phí, 24/7)"
                : "Call 111 · National Child Protection Hotline (Vietnam, Free 24/7)"}
            </a>
            
            {lang === "vi" ? (
              <a
                href="tel:0963061414"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-caution/80 underline-offset-4 hover:underline"
              >
                <Phone size={11} />
                Gọi 096 306 1414 · Đường dây nóng Ngày Mai (Hỗ trợ trầm cảm)
              </a>
            ) : (
              <div className="text-[11px] text-base-text-secondary/70">
                International: Please contact your local crisis hotline (e.g. 988 in USA/Canada, 111 in UK).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
