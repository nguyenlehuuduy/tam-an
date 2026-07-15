"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

interface ToastGentleProps {
  message: string | null;
  onDone: () => void;
  durationMs?: number;
}

export function ToastGentle({ message, onDone, durationMs = 2600 }: ToastGentleProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDone]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-6"
        >
          <div className="rounded-full bg-base-surface/95 px-5 py-3 text-sm text-base-text-primary shadow-lg backdrop-blur">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
