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
  Sparkles,
} from "lucide-react";
import { IdentityIcon, IdentityVibe } from "@/lib/identity";
import { useAppState } from "@/context/AppStateContext";
import { useState } from "react";
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

const VIBE_META: Record<IdentityVibe, { label: string; dotClass: string; glowClass: string }> = {
  cozy: { label: "Ấm áp", dotClass: "bg-vibe-cozy", glowClass: "glow-cozy" },
  dreamy: { label: "Mơ mộng", dotClass: "bg-vibe-dreamy", glowClass: "glow-dreamy" },
  cyber: { label: "Công nghệ", dotClass: "bg-vibe-cyber", glowClass: "glow-cyber" },
  lofi: { label: "Hoài niệm", dotClass: "bg-vibe-lofi", glowClass: "glow-lofi" },
};

export function AnonymousIdentityBadge({ compact = false }: AnonymousIdentityBadgeProps) {
  const { identity, regenerateIdentity, setIdentityVibe, hydrated } = useAppState();
  const [showVibeSelector, setShowVibeSelector] = useState(false);

  const activeVibe = identity.vibe || "cozy";
  const meta = VIBE_META[activeVibe];

  // Trong khi chưa hydrate xong (server vs client khác nhau),
  // render skeleton ổn định để tránh mismatch
  if (!hydrated) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-full bg-white/8" />
    );
  }

  return (
    <div className="relative flex flex-col items-end gap-1.5">
      <div 
        className={clsx(
          "flex items-center gap-2 rounded-full bg-base-surface/80 py-1.5 pl-2 pr-3 transition-all duration-300 border",
          meta.glowClass
        )}
      >
        {/* Nhấn vào icon để mở cài đặt Vibe */}
        <button
          aria-label="Chọn hệ cảm xúc"
          onClick={() => setShowVibeSelector(!showVibeSelector)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-base-text-primary hover:bg-white/10 transition-colors"
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

        {/* Nút đổi tên ẩn danh */}
        <button
          aria-label="Đổi tên ẩn danh khác"
          onClick={regenerateIdentity}
          className="text-base-text-secondary/70 hover:text-base-text-primary p-0.5"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Vibe Selection Panel - Floating Glass Dropdown */}
      {showVibeSelector && (
        <div className="absolute right-0 top-12 z-50 flex flex-col gap-2 rounded-2xl glass-panel-heavy p-3 shadow-2xl animate-fade-in w-44">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-base-text-secondary flex items-center gap-1">
            <Sparkles size={11} /> Hệ cảm xúc (Vibe)
          </p>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {(Object.keys(VIBE_META) as IdentityVibe[]).map((v) => {
              const active = activeVibe === v;
              return (
                <button
                  key={v}
                  onClick={() => {
                    setIdentityVibe(v);
                    setShowVibeSelector(false);
                  }}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-lg px-2 py-1 text-left text-xs transition-colors",
                    active 
                      ? "bg-white/10 text-base-text-primary" 
                      : "text-base-text-secondary hover:bg-white/5 hover:text-base-text-primary"
                  )}
                >
                  <span className={clsx("h-2.5 w-2.5 rounded-full", VIBE_META[v].dotClass)} />
                  <span className="capitalize">{VIBE_META[v].label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
