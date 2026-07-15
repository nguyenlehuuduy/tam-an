"use client";

import { HeartHandshake, Phone } from "lucide-react";

// Số 111 là Tổng đài điện thoại Quốc gia Bảo vệ Trẻ em (Cục Trẻ em, Bộ
// LĐTBXH) — hoạt động 24/7, miễn phí, có tư vấn tâm lý cho lo âu, trầm
// cảm, stress, ý nghĩ tự tử. Trước khi ra mắt thật, đội ngũ nên xác nhận
// lại số này và cân nhắc bổ sung thêm đường dây phù hợp với độ tuổi/khu
// vực cụ thể của người dùng mục tiêu.
const HOTLINE_NUMBER = "111";
const HOTLINE_LABEL = "Tổng đài Quốc gia Bảo vệ Trẻ em — miễn phí, 24/7";

export function HotlineBanner() {
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
            href={`tel:${HOTLINE_NUMBER}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-caution underline-offset-4 hover:underline"
          >
            <Phone size={14} />
            Gọi {HOTLINE_NUMBER} · {HOTLINE_LABEL}
          </a>
        </div>
      </div>
    </div>
  );
}
