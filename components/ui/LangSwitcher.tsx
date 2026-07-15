"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";
import clsx from "clsx";

export function LangSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border border-white/6 backdrop-blur-md select-none bg-white/[0.03]"
      style={{
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      }}
    >
      <Globe size={10} className="text-base-text-secondary/40 shrink-0 mr-0.5" />
      
      <button
        onClick={() => setLang("vi")}
        className={clsx(
          "rounded-md px-1.5 py-0.5 transition-all duration-300 relative",
          lang === "vi" ? "text-white" : "text-base-text-secondary/45 hover:text-base-text-secondary/80"
        )}
      >
        {lang === "vi" && (
          <motion.span
            layoutId="activeLangIndicator"
            className="absolute inset-0 bg-white/10 rounded-md -z-10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        VI
      </button>

      <span className="text-white/10 text-[8px]">•</span>

      <button
        onClick={() => setLang("en")}
        className={clsx(
          "rounded-md px-1.5 py-0.5 transition-all duration-300 relative",
          lang === "en" ? "text-white" : "text-base-text-secondary/45 hover:text-base-text-secondary/80"
        )}
      >
        {lang === "en" && (
          <motion.span
            layoutId="activeLangIndicator"
            className="absolute inset-0 bg-white/10 rounded-md -z-10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        EN
      </button>
    </div>
  );
}
