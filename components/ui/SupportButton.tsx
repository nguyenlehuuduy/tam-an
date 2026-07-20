"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, Phone, X } from "lucide-react";
import { SUPPORT_RESOURCES, SUPPORT_DISCLAIMER } from "@/lib/supportResources";

// =====================================================
// Nút "Cần hỗ trợ" — LUÔN có thể bấm vào, ở mọi trang chính, không cần chờ
// nội dung bị hệ thống kiểm duyệt gắn cờ highRisk trước (khác với
// HotlineBanner vốn chỉ xuất hiện sau khi thả một câu chuyện bị gắn cờ).
// Góc nhìn chuyên gia tâm lý: một người đang cần giúp đỡ không phải lúc
// nào cũng viết ra điều gì "đủ nguy hiểm" để hệ thống nhận diện được —
// nên luôn phải có một lối vào tới nguồn hỗ trợ thật, mọi lúc.
// =====================================================
export function SupportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Cần hỗ trợ ngay"
        onClick={() => setOpen(true)}
        className="orb-btn rounded-lg bg-white/[0.04] p-2 text-base-text-secondary/50 hover:bg-caution/15 hover:text-caution transition-colors"
        style={{ minHeight: 0 }}
      >
        <HeartHandshake size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-t-3xl border border-white/10 bg-[#0c101c] p-5 md:rounded-3xl"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-caution/80">
                    Cần ai đó lắng nghe ngay?
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-base-text-secondary/70">
                    Bạn không cần phải một mình xử lý mọi thứ. Đây là những nơi sẵn sàng lắng nghe bạn.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="orb-btn shrink-0 rounded-full p-1.5 text-base-text-secondary/40 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
                  style={{ minHeight: 0 }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {SUPPORT_RESOURCES.map((r) => (
                  <a
                    key={r.id}
                    href={`tel:${r.phone.replace(/\s/g, "")}`}
                    className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3.5 hover:border-caution/30 hover:bg-caution/6 transition-colors"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-caution/15 text-caution">
                      <Phone size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-base-text-primary">
                        {r.name} · <span className="font-mono">{r.phone}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-caution/70">{r.hours}</p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-base-text-secondary/60">
                        {r.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              <p className="mt-4 text-center text-[10.5px] leading-relaxed text-base-text-secondary/40">
                {SUPPORT_DISCLAIMER}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
