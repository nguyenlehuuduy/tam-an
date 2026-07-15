"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AUTH_STORAGE_KEY = "tram-phat-sang:auth";

// =====================================================
// TYPES
// =====================================================

export interface AuthUser {
  email: string;
  /** Phần email đã che giấu, ví dụ "abc***@gmail.com" */
  maskedEmail: string;
  createdAt: number;
}

interface AuthContextValue {
  /** User đã đăng nhập, hoặc null */
  user: AuthUser | null;
  /** Shorthand kiểm tra trạng thái auth */
  isAuthenticated: boolean;
  /** Đã hydrate từ localStorage chưa (tránh hydration mismatch) */
  hydrated: boolean;
  /** Giả lập gửi magic link — lưu email vào pending state */
  sendMagicLink: (email: string) => void;
  /** Giả lập confirm magic link — tạo session từ pending email */
  confirmMagicLink: () => void;
  /** Email đang chờ confirm (đã gửi magic link) */
  pendingEmail: string | null;
  /** Đăng xuất */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// =====================================================
// UTILS
// =====================================================

/** Che giấu email: "nguyen@gmail.com" → "ngu***@gmail.com" */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
}

function loadAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function saveAuth(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadAuth();
    if (saved) setUser(saved);
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (hydrated) {
      saveAuth(user);
    }
  }, [user, hydrated]);

  const sendMagicLink = useCallback((email: string) => {
    setPendingEmail(email);
  }, []);

  const confirmMagicLink = useCallback(() => {
    if (!pendingEmail) return;
    const newUser: AuthUser = {
      email: pendingEmail,
      maskedEmail: maskEmail(pendingEmail),
      createdAt: Date.now(),
    };
    setUser(newUser);
    setPendingEmail(null);
  }, [pendingEmail]);

  const signOut = useCallback(() => {
    setUser(null);
    setPendingEmail(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      hydrated,
      sendMagicLink,
      confirmMagicLink,
      pendingEmail,
      signOut,
    }),
    [user, hydrated, sendMagicLink, confirmMagicLink, pendingEmail, signOut]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
