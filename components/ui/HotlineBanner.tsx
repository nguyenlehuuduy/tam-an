"use client";

import { HeartHandshake, Phone } from "lucide-react";
import { SUPPORT_RESOURCES } from "@/lib/supportResources";

// Dùng chung nguồn dữ liệu với SupportButton (lib/supportResources.ts) để
// chỉ có MỘT nơi duy nhất cần cập nhật nếu số điện thoại/giờ hoạt động
// thay đổi. Ở đây chỉ hiển thị lựa chọn đầu tiên (ưu tiên cao nhất) để
// giữ banner gọn — muốn xem đầy đủ các lựa chọn thì có SupportButton.

export function HotlineBanner() {
  const primary = SUPPORT_RESOURCES[0];
  return (
    <div className="rounded-card border border-caution/30 bg-caution/10 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-caution/20 p-2">
          <HeartHandshake size={18} className="text-caution" />
        </div>
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-base-text-primary">
            Nếu lòng bạn đang rất nặng, có người sẵn sàng lắng nghe ngay bây giờ.
          </p>
          <a
            href={`tel:${primary.phone.replace(/\s/g, "")}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-caution underline-offset-4 hover:underline"
          >
            <Phone size={14} />
            Gọi {primary.phone} · {primary.name} ({primary.hours})
          </a>
          <p className="mt-1.5 text-[11px] text-caution/60">
            Ngoài giờ trên? Gọi 111 (Tổng đài Quốc gia Bảo vệ Trẻ em, 24/7, miễn phí).
          </p>
        </div>
      </div>
    </div>
  );
}
