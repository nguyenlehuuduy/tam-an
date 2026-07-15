"use client";

import {
  Cloud,
  Circle,
  CircleDashed,
  Droplet,
  LucideIcon,
  Moon,
  Shell,
  Sparkle,
  Star,
  RefreshCw,
  Zap,
  Music,
  Flame,
  X,
  Check,
} from "lucide-react";
import { IdentityIcon, IdentityVibe } from "@/lib/identity";
import { useAppState } from "@/context/AppStateContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const ICON_MAP: Record<IdentityIcon, LucideIcon> = {
  "moon-crescent": Moon,
  "star-dot": Star,
  "dew-drop": Droplet,
  pebble: Circle,
  "cloud-cluster": Cloud,
  shell: Shell,
  "air-bubble": CircleDashed,
  "soft-spark": Sparkle,
};

export function IdentityIconGlyph({ icon, size = 16, className }: { icon: IdentityIcon; size?: number; className?: string }) {
  const Comp = ICON_MAP[icon];
  return <Comp size={size} className={className} />;
}

interface AnonymousIdentityBadgeProps {
  compact?: boolean;
}

// =====================================================
// VIBE METADATA — full description of what each changes
// =====================================================
interface VibeMeta {
  label: string;
  emoji: string;
  tagline: string;
  icon: LucideIcon;
  accentColor: string;
  bgPreview: string;
  dotClass: string;
  glowClass: string;
  changes: string[];
  writeHint: string; // Gợi ý viết cho vibe này
}

const VIBE_META: Record<IdentityVibe, VibeMeta> = {
  cozy: {
    label: "Ấm Áp",
    emoji: "🕯️",
    tagline: "Như góc cafe khuya, yên tĩnh và dịu dàng",
    icon: Flame,
    accentColor: "#E8A47A",
    bgPreview: "linear-gradient(135deg, #3B1F0E 0%, rgba(232,164,122,0.3) 100%)",
    dotClass: "bg-vibe-cozy",
    glowClass: "glow-cozy",
    changes: [
      "Accent cam vàng ấm trong toàn app",
      "Bầu trời nhuốm màu hoàng hôn nhẹ",
      "Badge sáng tông cam ấm áp",
    ],
    writeHint: "Hôm nay có điều gì nhỏ thôi nhưng khiến bạn cảm thấy...",
  },
  dreamy: {
    label: "Mơ Mộng",
    emoji: "🌙",
    tagline: "Như đêm trăng tím, ngân hà xa và những giấc mơ",
    icon: Moon,
    accentColor: "#C084FC",
    bgPreview: "linear-gradient(135deg, #1A0533 0%, rgba(192,132,252,0.35) 100%)",
    dotClass: "bg-vibe-dreamy",
    glowClass: "glow-dreamy",
    changes: [
      "Accent tím lavender thơ mộng",
      "Bầu trời đậm tím như giải ngân hà",
      "Badge phát sáng tím mộng mơ",
    ],
    writeHint: "Đôi khi trong những khoảnh khắc yên tĩnh nhất, bạn nghĩ về...",
  },
  cyber: {
    label: "Công Nghệ",
    emoji: "⚡",
    tagline: "Neon cyan sắc bén, digital và đậm chất tương lai",
    icon: Zap,
    accentColor: "#22D3EE",
    bgPreview: "linear-gradient(135deg, #001A20 0%, rgba(34,211,238,0.35) 100%)",
    dotClass: "bg-vibe-cyber",
    glowClass: "glow-cyber",
    changes: [
      "Accent neon cyan lạnh và sharp",
      "Bầu trời tông xanh digital",
      "Badge phát sáng xanh neon",
    ],
    writeHint: "Có một điều mình cần nói thẳng ra, không vòng vo...",
  },
  lofi: {
    label: "Hoài Niệm",
    emoji: "🎵",
    tagline: "Amber hoài cổ, như cassette cũ và những chiều mưa",
    icon: Music,
    accentColor: "#FBBF24",
    bgPreview: "linear-gradient(135deg, #1A1000 0%, rgba(251,191,36,0.35) 100%)",
    dotClass: "bg-vibe-lofi",
    glowClass: "glow-lofi",
    changes: [
      "Accent vàng amber hoài niệm",
      "Bầu trời nhuốm tông vàng ấm retro",
      "Badge sáng vàng vintage",
    ],
    writeHint: "Có một ký ức cứ mãi quay lại trong đầu mình, đó là...",
  },
};

export function AnonymousIdentityBadge({ compact = false }: AnonymousIdentityBadgeProps) {
  const { identity, regenerateIdentity, setIdentityVibe, hydrated } = useAppState();
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const [showVibeSelector, setShowVibeSelector] = useState(false);
  const [justChanged, setJustChanged] = useState<IdentityVibe | null>(null);

  const activeVibe = identity.vibe || "cozy";
  const meta = VIBE_META[activeVibe];

  if (!hydrated) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-white/8" />;
  }

  function handleSelectVibe(v: IdentityVibe) {
    setIdentityVibe(v);
    setJustChanged(v);
    setTimeout(() => {
      setJustChanged(null);
      setShowVibeSelector(false);
    }, 1200);
  }

  return (
    <div className="relative flex flex-col items-end gap-1.5">
      {/* ── Main Badge ── */}
      <div
        className={clsx(
          "flex items-center gap-2 rounded-full bg-base-surface/80 py-1.5 pl-2 pr-3 transition-all duration-500 border cursor-pointer",
          meta.glowClass
        )}
      >
        <button
          aria-label="Chọn hệ cảm xúc (Vibe)"
          onClick={() => setShowVibeSelector(!showVibeSelector)}
          className="orb-btn flex h-7 w-7 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
          style={{
            minHeight: 0,
            color: meta.accentColor,
          }}
        >
          <IdentityIconGlyph icon={identity.icon} size={15} />
        </button>

        {!compact && (
          <span
            className="text-xs font-semibold text-base-text-primary"
            suppressHydrationWarning
          >
            {identity.name}
          </span>
        )}

        <button
          aria-label="Đổi tên ẩn danh khác"
          onClick={regenerateIdentity}
          className="orb-btn text-base-text-secondary/70 hover:text-base-text-primary p-0.5 transition-colors"
          style={{ minHeight: 0 }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* ── Vibe Selector Panel ── */}
      <AnimatePresence>
        {showVibeSelector && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-12 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "rgba(12, 16, 28, 0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <div>
                <p className="text-xs font-bold text-base-text-primary">Hệ cảm xúc (Vibe)</p>
                <p className="text-[10px] text-base-text-secondary/60 mt-0.5">
                  Thay đổi màu sắc và không gian cảm xúc của bạn
                </p>
              </div>
              <button
                onClick={() => setShowVibeSelector(false)}
                className="orb-btn rounded-full p-1 text-base-text-secondary/50 hover:bg-white/8 hover:text-base-text-secondary transition-colors"
                style={{ minHeight: 0 }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Vibe options */}
            <div className="p-3 flex flex-col gap-2">
              {(Object.keys(VIBE_META) as IdentityVibe[]).map((v) => {
                const vm = VIBE_META[v];
                const isActive = activeVibe === v;
                const isJustChanged = justChanged === v;
                const VibIcon = vm.icon;

                return (
                  <motion.button
                    key={v}
                    onClick={() => handleSelectVibe(v)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="orb-btn relative w-full overflow-hidden rounded-xl text-left transition-all duration-300"
                    style={{
                      minHeight: 0,
                      background: isActive
                        ? vm.bgPreview
                        : "rgba(255,255,255,0.03)",
                      border: isActive
                        ? `1px solid ${vm.accentColor}55`
                        : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: isActive
                        ? `0 0 16px ${vm.accentColor}30`
                        : "none",
                    }}
                  >
                    <div className="flex items-start gap-3 px-3 py-2.5">
                      {/* Color preview dot */}
                      <div
                        className="mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm"
                        style={{
                          background: `${vm.accentColor}20`,
                          border: `1.5px solid ${vm.accentColor}55`,
                          color: vm.accentColor,
                        }}
                      >
                        <VibIcon size={15} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold text-base-text-primary">
                            {vm.emoji} {vm.label}
                          </span>
                          {isActive && !isJustChanged && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                              style={{
                                background: `${vm.accentColor}25`,
                                color: vm.accentColor,
                              }}
                            >
                              Đang dùng
                            </span>
                          )}
                          {isJustChanged && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{
                                background: `${vm.accentColor}35`,
                                color: vm.accentColor,
                              }}
                            >
                              ✓ Đã chuyển!
                            </motion.span>
                          )}
                        </div>
                        <p className="text-[10px] text-base-text-secondary/60 leading-snug mb-1.5">
                          {vm.tagline}
                        </p>

                        {/* What changes */}
                        <div className="flex flex-col gap-0.5">
                          {vm.changes.map((change, idx) => (
                            <p
                              key={idx}
                              className="text-[10px] text-base-text-secondary/50 flex items-center gap-1"
                            >
                              <span style={{ color: vm.accentColor, fontSize: 8 }}>●</span>
                              {change}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Panel footer */}
            <div
              className="border-t border-white/8 px-4 py-3 text-center"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <p className="text-[10px] text-base-text-secondary/40 leading-relaxed">
                Vibe chỉ thay đổi giao diện của bạn —
                <br />câu chuyện vẫn được giữ hoàn toàn ẩn danh
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
