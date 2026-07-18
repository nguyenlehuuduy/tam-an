"use client";

/**
 * AIAvatarOrb — hiển thị avatar trừu tượng của Registered user (Module 1.2).
 * Xem lib/avatar.ts để biết cách hình được sinh ra (MVP: thuật toán thuần,
 * không gọi API AI ngoài — sẽ thay bằng ảnh AI thật khi có backend).
 */
import { useMemo } from "react";
import { generateAvatarBlobs } from "@/lib/avatar";
import { IdentityVibe } from "@/lib/identity";

// Cùng bộ màu với VIBE_META ở AnonymousIdentityBadge — giữ nhất quán hình ảnh
// giữa badge, /profile-setup, và bất kỳ nơi nào khác hiển thị avatar.
const VIBE_AVATAR_COLORS: Record<IdentityVibe, [accent: string, deep: string]> = {
  cozy: ["#E8A47A", "#3B1F0E"],
  dreamy: ["#C084FC", "#1A0533"],
  cyber: ["#22D3EE", "#001A20"],
  lofi: ["#FBBF24", "#1A1000"],
};

interface AIAvatarOrbProps {
  seed: string;
  vibe: IdentityVibe;
  size?: number;
  className?: string;
}

export function AIAvatarOrb({ seed, vibe, size = 36, className }: AIAvatarOrbProps) {
  const blobs = useMemo(() => generateAvatarBlobs(seed), [seed]);
  const [accent, deep] = VIBE_AVATAR_COLORS[vibe] ?? VIBE_AVATAR_COLORS.cozy;
  // id duy nhất cho <defs> để nhiều avatar trên cùng trang không đụng gradient của nhau
  const uid = useMemo(() => seed.replace(/[^a-zA-Z0-9]/g, "") || "default", [seed]);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Avatar trừu tượng do AI gợi ý — không khuôn mặt"
    >
      <defs>
        <radialGradient id={`av-bg-${uid}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={deep} stopOpacity="1" />
        </radialGradient>
        <filter id={`av-blur-${uid}`}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#av-bg-${uid})`} />
      <g filter={`url(#av-blur-${uid})`}>
        {blobs.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="#ffffff" opacity={b.opacity} />
        ))}
      </g>
      {/* Điểm sáng nhỏ tạo cảm giác "orb" nhất quán với SignalOrb/ReleaseGesture */}
      <circle cx="36" cy="32" r="6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
