"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Language, translate } from "@/lib/i18n";

const LANG_KEY = "solace:lang";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Tra chuỗi theo path dạng "settings.account.title" — xem lib/i18n.ts */
  t: (path: string) => string;
  hydrated: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function loadLanguage(): Language {
  if (typeof window === "undefined") return "vi";
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === "vi" || saved === "en") return saved;
  } catch {
    // ignore
  }
  return "vi"; // Module 8.2 — mặc định tiếng Việt (target market chính)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLanguageState(loadLanguage());
    setHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // storage unavailable — ignore
    }
    // Spec 8.2: "sync profile nếu logged-in". Chưa có backend thật (bảng
    // anonymous_users) nên tạm thời chỉ lưu cục bộ — đây là nơi sẽ gọi API
    // cập nhật field `language` cho user đã đăng nhập khi nối backend.
  }, []);

  const t = useCallback((path: string) => translate(language, path), [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, hydrated }),
    [language, setLanguage, t, hydrated]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
