"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, LucideIcon } from "lucide-react";

export interface MoreMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// =====================================================
// Gom các link ít dùng hơn (Dashboard/Thư viện/Cài đặt...) vào một menu
// duy nhất — trước đây mỗi trang xếp 4-6 icon riêng lẻ cạnh nhau trong
// cùng một hàng header, đủ chỗ trên desktop nhưng vỡ layout hoàn toàn trên
// màn hình điện thoại (~375px). SupportButton/NotificationBell vẫn đứng
// riêng ở mọi nơi vì đó là hai thứ cần thấy ngay, không nên giấu.
// =====================================================
export function MoreMenu({ items, label = "Thêm" }: { items: MoreMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="orb-btn flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-base-text-secondary/60 hover:bg-white/10 hover:text-base-text-primary transition-colors sm:h-auto sm:w-auto sm:rounded-lg sm:p-2"
        style={{ minHeight: 0 }}
      >
        <MoreHorizontal size={15} className="sm:hidden" />
        <MoreHorizontal size={14} className="hidden sm:block" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0c101c] py-1.5 shadow-xl"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] text-base-text-secondary/80 hover:bg-white/8 hover:text-base-text-primary transition-colors"
              >
                <item.icon size={14} className="shrink-0" />
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
