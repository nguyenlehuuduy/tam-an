"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Bell,
  Globe,
  Volume2,
  VolumeX,
  Palette,
  MessageCircleHeart,
  Info,
  Package,
  LogOut,
  RotateCcw,
  RefreshCw,
  Pencil,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import clsx from "clsx";
import { useAppState } from "@/context/AppStateContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications, ALL_NOTIFICATION_TYPES, EMAIL_CAPABLE_TYPES, NotificationType, EmailFrequency } from "@/context/NotificationContext";
import { AIAvatarOrb } from "@/components/onboarding/AIAvatarOrb";
import { IdentityIconGlyph } from "@/components/onboarding/AnonymousIdentityBadge";
import { IdentityVibe } from "@/lib/identity";
import { APP_VERSION, BUILD_NUMBER } from "@/lib/version";

const VIBE_OPTIONS: { key: IdentityVibe; label: string; emoji: string; color: string }[] = [
  { key: "cozy", label: "Ấm Áp", emoji: "🕯️", color: "#E8A47A" },
  { key: "dreamy", label: "Mơ Mộng", emoji: "🌙", color: "#C084FC" },
  { key: "cyber", label: "Công Nghệ", emoji: "⚡", color: "#22D3EE" },
  { key: "lofi", label: "Hoài Niệm", emoji: "🎵", color: "#FBBF24" },
];

const NOTIF_TYPE_LABELS: Record<NotificationType, string> = {
  reaction: "Ai đó gửi reaction/ôm/quà cho story của bạn",
  milestone: "Story của bạn đạt warmth milestone",
  "checkin-reminder": "Gợi ý check-in hàng ngày",
  "article-suggestion": "Bài viết mới phù hợp mood pattern",
  hotline: "Hotline / cảnh báo khẩn cấp (hệ thống)",
  "product-update": "Cập nhật sản phẩm",
};

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-card border border-base-divider bg-base-surface/40 p-5 backdrop-blur">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-base-text-secondary">
        <Icon size={16} className="text-sky-aurora" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={clsx(
        "orb-btn relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-sky-aurora/70" : "bg-white/10"
      )}
      style={{ minHeight: 0 }}
      aria-pressed={checked}
    >
      <motion.span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { identity, regenerateIdentity, setIdentityVibe, updateDisplayName, soundEnabled, toggleSound } = useAppState();
  const { user, isAuthenticated, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { settings, setInAppSetting, setEmailSetting, setEmailFrequency } = useNotifications();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(identity.kind === "user" ? identity.displayName : "");
  const [aboutOpen, setAboutOpen] = useState<string | null>(null);

  const isUser = identity.kind === "user";

  function handleSaveName() {
    updateDisplayName(nameDraft);
    setEditingName(false);
  }

  function handleLogout() {
    signOut();
    router.push("/auth");
  }

  function handleResetSession() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(t("settings.resetSessionConfirm"));
    if (!ok) return;
    try {
      [
        "solace:v2",
        "solace:all-signals",
        "solace:auth",
        "solace:notifications",
        "solace:feedback-nudge-dismissed",
        "solace:feedback-submissions",
        "solace:lang",
      ].forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.href = "/";
  }

  const ABOUT_ITEMS = [
    { key: "mission", label: t("settings.about.mission"), body: t("settings.about.missionText") },
    {
      key: "privacy",
      label: t("settings.about.privacy"),
      body: "Solace không thu thập thông tin định danh cá nhân. Toàn bộ câu chuyện, mood, và cài đặt của bạn hiện đang lưu trên chính thiết bị của bạn (localStorage) trong giai đoạn MVP này — chưa đồng bộ lên máy chủ.",
    },
    {
      key: "terms",
      label: t("settings.about.terms"),
      body: "Đây là bản MVP thử nghiệm. Nội dung chia sẻ được kiểm duyệt bằng bộ lọc từ khoá cơ bản, không thay thế cho tư vấn y tế/tâm lý chuyên nghiệp.",
    },
    {
      key: "hotline",
      label: t("settings.about.hotline"),
      body: "Tổng đài Quốc gia Bảo vệ Trẻ em — 111 (miễn phí, 24/7, hỗ trợ tâm lý cho lo âu, trầm cảm, stress, ý nghĩ tự tử).",
    },
  ];

  return (
    <div className="min-h-dvh bg-base-gradient px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/explore"
          className="mb-6 inline-flex items-center gap-2 text-sm text-base-text-secondary hover:text-base-text-primary transition-colors"
        >
          <ArrowLeft size={16} /> {t("common.back")}
        </Link>

        <header className="mb-6">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-base-text-primary">
            {t("settings.title")}
          </h1>
        </header>

        {/* Account */}
        <SectionCard icon={User} title={t("settings.account.title")}>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5">
              {isUser ? (
                <AIAvatarOrb seed={identity.avatarSeed} vibe={identity.vibe} size={56} />
              ) : (
                <IdentityIconGlyph icon={identity.icon} size={22} className="text-base-text-secondary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value.slice(0, 24))}
                    className="w-full rounded-lg border border-white/10 bg-base-surface/60 px-2.5 py-1.5 text-sm text-base-text-primary focus:outline-none focus:border-white/25"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="orb-btn shrink-0 rounded-lg bg-sky-aurora/20 p-1.5 text-sky-aurora"
                    style={{ minHeight: 0 }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-base-text-primary">
                    {isUser ? identity.displayName : identity.name}
                  </p>
                  {isUser && (
                    <button
                      onClick={() => {
                        setNameDraft(identity.displayName);
                        setEditingName(true);
                      }}
                      className="orb-btn text-base-text-secondary/40 hover:text-base-text-secondary"
                      style={{ minHeight: 0 }}
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
              <span
                className={clsx(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isAuthenticated ? "bg-sky-aurora/15 text-sky-aurora" : "bg-white/8 text-base-text-secondary/60"
                )}
              >
                {isAuthenticated ? t("settings.account.registered") : t("settings.account.guest")}
              </span>
            </div>
            {isUser && (
              <button
                onClick={regenerateIdentity}
                className="orb-btn shrink-0 flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-base-text-secondary hover:bg-white/15 hover:text-base-text-primary transition-colors"
                style={{ minHeight: 0 }}
              >
                <RefreshCw size={12} /> {t("settings.account.regenerateAvatar")}
              </button>
            )}
          </div>

          {isAuthenticated && user ? (
            <p className="text-[12px] text-base-text-secondary/60">
              {t("settings.account.email")}: <span className="font-mono">{user.maskedEmail}</span>
            </p>
          ) : (
            <Link
              href="/auth?next=/settings"
              className="inline-block text-[12px] font-semibold text-sky-aurora underline underline-offset-4 hover:text-sky-glow"
            >
              {t("settings.account.loginCta")}
            </Link>
          )}
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon={Bell} title={t("settings.notifications.title")}>
          <div className="flex flex-col gap-3">
            {ALL_NOTIFICATION_TYPES.map((type) => (
              <div key={type} className="flex items-center justify-between gap-3">
                <p className="text-[12.5px] text-base-text-secondary/80 leading-snug">{NOTIF_TYPE_LABELS[type]}</p>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <Toggle checked={settings.inApp[type]} onChange={(v) => setInAppSetting(type, v)} />
                    <span className="text-[10px] text-base-text-secondary/40">{t("settings.notifications.inApp")}</span>
                  </div>
                  {EMAIL_CAPABLE_TYPES.includes(type) && (
                    <div className="flex flex-col items-center gap-0.5">
                      <Toggle checked={settings.email[type]} onChange={(v) => setEmailSetting(type, v)} />
                      <span className="text-[10px] text-base-text-secondary/40">{t("settings.notifications.email")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
            <p className="text-[12px] font-semibold text-base-text-secondary/70">{t("settings.notifications.frequency")}</p>
            <div className="flex gap-1.5">
              {(["off", "daily", "weekly"] as EmailFrequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setEmailFrequency(f)}
                  className={clsx(
                    "rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-colors",
                    settings.emailFrequency === f
                      ? "bg-sky-aurora/20 text-sky-aurora"
                      : "bg-white/6 text-base-text-secondary/50"
                  )}
                >
                  {f === "off" ? t("settings.notifications.off") : f === "daily" ? t("settings.notifications.daily") : t("settings.notifications.weekly")}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Language */}
        <SectionCard icon={Globe} title={t("settings.language.title")}>
          <div className="flex gap-2">
            {(["vi", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={clsx(
                  "rounded-full border px-4 py-1.5 text-[12px] font-bold transition-all",
                  language === l
                    ? "border-sky-aurora/50 bg-sky-aurora/15 text-sky-aurora"
                    : "border-base-divider text-base-text-secondary/60 hover:text-base-text-primary"
                )}
              >
                {l === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Sound */}
        <SectionCard icon={soundEnabled ? Volume2 : VolumeX} title={t("settings.sound.title")}>
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] text-base-text-secondary/70">
              {soundEnabled ? "Đang bật âm thanh trị liệu" : "Đang tắt âm thanh"}
            </p>
            <Toggle checked={soundEnabled} onChange={toggleSound} />
          </div>
        </SectionCard>

        {/* Vibe / Theme */}
        <SectionCard icon={Palette} title={t("settings.vibe.title")}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VIBE_OPTIONS.map((v) => {
              const active = identity.vibe === v.key;
              return (
                <button
                  key={v.key}
                  onClick={() => setIdentityVibe(v.key)}
                  className="orb-btn flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition-all"
                  style={{
                    minHeight: 0,
                    borderColor: active ? `${v.color}55` : "rgba(255,255,255,0.08)",
                    background: active ? `${v.color}18` : "rgba(255,255,255,0.02)",
                  }}
                >
                  <span className="text-lg leading-none">{v.emoji}</span>
                  <span className="text-[10.5px] font-semibold" style={{ color: active ? v.color : "rgba(255,255,255,0.5)" }}>
                    {v.label}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Feedback */}
        <SectionCard icon={MessageCircleHeart} title={t("settings.feedback.title")}>
          <Link
            href="/settings/feedback"
            className="orb-btn inline-flex items-center gap-2 rounded-full bg-warm/15 px-4 py-2 text-[12.5px] font-bold text-warm hover:bg-warm/25 transition-colors"
            style={{ minHeight: 0 }}
          >
            {t("settings.feedback.cta")}
          </Link>
        </SectionCard>

        {/* About */}
        <SectionCard icon={Info} title={t("settings.about.title")}>
          <div className="flex flex-col gap-1.5">
            {ABOUT_ITEMS.map((item) => {
              const open = aboutOpen === item.key;
              return (
                <div key={item.key} className="rounded-xl border border-white/6 bg-white/[0.02]">
                  <button
                    onClick={() => setAboutOpen(open ? null : item.key)}
                    className="orb-btn flex w-full items-center justify-between px-3.5 py-2.5 text-left"
                    style={{ minHeight: 0 }}
                  >
                    <span className="text-[12.5px] font-semibold text-base-text-primary">{item.label}</span>
                    {open ? <ChevronUp size={14} className="text-base-text-secondary/40" /> : <ChevronDown size={14} className="text-base-text-secondary/40" />}
                  </button>
                  {open && (
                    <p className="px-3.5 pb-3 text-[11.5px] leading-relaxed text-base-text-secondary/60">{item.body}</p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Version */}
        <SectionCard icon={Package} title={t("settings.version")}>
          <p className="text-[12.5px] text-base-text-secondary/60">
            v{APP_VERSION} · build {BUILD_NUMBER}
          </p>
        </SectionCard>

        {/* Logout / Reset */}
        <section className="mb-4">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="orb-btn flex w-full items-center justify-center gap-2 rounded-full border border-critical/30 bg-critical/10 py-3 text-sm font-bold text-critical hover:bg-critical/20 transition-colors"
              style={{ minHeight: 0 }}
            >
              <LogOut size={15} /> {t("settings.logout")}
            </button>
          ) : (
            <button
              onClick={handleResetSession}
              className="orb-btn flex w-full items-center justify-center gap-2 rounded-full border border-critical/30 bg-critical/10 py-3 text-sm font-bold text-critical hover:bg-critical/20 transition-colors"
              style={{ minHeight: 0 }}
            >
              <RotateCcw size={15} /> {t("settings.resetSession")}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
