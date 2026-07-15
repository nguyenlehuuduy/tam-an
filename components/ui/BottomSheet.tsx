"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop blur */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(6, 10, 19, 0.7)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              y: { type: "spring", stiffness: 320, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] overflow-hidden"
            style={{
              borderRadius: "28px 28px 0 0",
              background: "rgba(14, 20, 36, 0.92)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              borderRight: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,158,255,0.05)",
            }}
          >
            {/* Top shimmer line */}
            <div
              className="absolute top-0 left-0 right-0 h-px shimmer-bg"
              style={{ background: "linear-gradient(90deg, transparent, rgba(124,158,255,0.4), rgba(179,136,255,0.4), transparent)" }}
            />

            {/* Drag handle */}
            <div className="flex justify-center pt-4 pb-2">
              <motion.div
                className="h-1.5 w-12 rounded-full bg-white/20"
                whileHover={{ width: 48, background: "rgba(255,255,255,0.3)" }}
              />
            </div>

            {/* Close button */}
            <button
              aria-label="Đóng"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-base-text-secondary hover:bg-white/10 hover:text-base-text-primary transition-all"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="px-6 pb-10 pt-2"
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
