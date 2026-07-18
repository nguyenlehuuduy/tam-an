"use client";

/**
 * /profile-setup — Module 1.2: sau khi Registered user đăng nhập lần đầu,
 * họ được hướng dẫn tuỳ chỉnh hồ sơ ẩn danh: tên hiển thị riêng + avatar AI
 * (trừu tượng, không khuôn mặt) + hệ cảm xúc (vibe). Guest không vào được
 * trang này (không có AI avatar — spec 1.2).
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shuffle, Wand2 } from "lucide-react";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { AIAvatarOrb } from "@/components/onboarding/AIAvatarOrb";
import { useAppState } from "@/context/AppStateContext";
import { useAuth } from "@/context/AuthContext";
import { IdentityVibe, IDENTITY_VIBES } from "@/lib/identity";
import { avatarSeedFromPrompt, randomAvatarSeed } from "@/lib/avatar";

const VIBE_OPTIONS: Record<IdentityVibe, { label: string; emoji: string; accent: string }> = {
  cozy: { label: "Ấm Áp", emoji: "🕯️", accent: "#E8A47A" },
  dreamy: { label: "Mơ Mộng", emoji: "🌙", accent: "#C084FC" },
  cyber: { label: "Công Nghệ", emoji: "⚡", accent: "#22D3EE" },
  lofi: { label: "Hoài Niệm", emoji: "🎵", accent: "#FBBF24" },
};

const NAME_LIMIT = 24;
const PROMPT_LIMIT = 60;

export default function ProfileSetupPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated: authHydrated } = useAuth();
  const { identity, hydrated, completeProfileSetup, skipProfileSetup } = useAppState();

  const [displayName, setDisplayName] = useState("");
  const [vibe, setVibe] = useState<IdentityVibe>("cozy");
  const [prompt, setPrompt] = useState("");
  const [avatarSeed, setAvatarSeed] = useState<string>(() => randomAvatarSeed());
  const [initialized, setInitialized] = useState(false);

  // Guard: chỉ Registered user mới tuỳ chỉnh được avatar AI (spec 1.1/1.2)
  useEffect(() => {
    if (!authHydrated) return;
    if (!isAuthenticated) router.replace("/auth");
  }, [authHydrated, isAuthenticated, router]);

  // Nạp giá trị khởi điểm từ identity hiện tại (tên gợi ý mặc định, vibe đang chọn...)
  useEffect(() => {
    if (!hydrated || initialized) return;
    if (identity.kind === "user") {
      setDisplayName(identity.displayName);
      setAvatarSeed(identity.avatarSeed);
      setPrompt(identity.avatarPrompt ?? "");
    }
    setVibe(identity.vibe);
    setInitialized(true);
  }, [hydrated, initialized, identity]);

  function handleShuffle() {
    setAvatarSeed(randomAvatarSeed());
  }

  function handleGenerateFromPrompt() {
    setAvatarSeed(avatarSeedFromPrompt(prompt || `${displayName}-${Date.now()}`));
  }

  function handleConfirm() {
    completeProfileSetup({
      displayName: displayName.trim() || "Ẩn Danh",
      vibe,
      avatarSeed,
      avatarPrompt: prompt.trim() || undefined,
    });
    router.push("/checkin");
  }

  function handleSkip() {
    skipProfileSetup();
    router.push("/checkin");
  }

  return (
    <SkyCanvas>
      <div className="flex min-h-dvh w-full flex-col items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-7 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-base-text-secondary/60">
              Không gian riêng của bạn
            </p>
            <h1 className="font-display text-2xl font-black text-base-text-primary">
              Tuỳ chỉnh hồ sơ <span className="shimmer-text">ẩn danh</span>
            </h1>
            <p className="mt-2 text-sm text-base-text-secondary/70 leading-relaxed">
              Đặt một cái tên và một avatar trừu tượng — không khuôn mặt, không lộ danh tính thật.
            </p>
          </div>

          {/* Avatar preview */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <motion.div
              key={avatarSeed}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative"
            >
              <AIAvatarOrb seed={avatarSeed} vibe={vibe} size={96} />
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 32px 8px ${VIBE_OPTIONS[vibe].accent}55` }}
              />
            </motion.div>
            <button
              onClick={handleShuffle}
              className="orb-btn flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-base-text-secondary hover:text-base-text-primary hover:bg-white/8 transition-colors"
              style={{ minHeight: 0 }}
            >
              <Shuffle size={12} /> Thử kiểu khác
            </button>
          </div>

          {/* Prompt (optional) */}
          <div className="mb-6">
            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-base-text-secondary/50">
              <Wand2 size={11} /> Gợi ý cho avatar (tuỳ chọn)
            </label>
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_LIMIT))}
                placeholder="một con sóng nhỏ trong đêm..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-base-text-primary placeholder:text-base-text-secondary/30 focus:outline-none focus:border-purple-400/40 transition-colors"
              />
              <button
                onClick={handleGenerateFromPrompt}
                className="orb-btn shrink-0 rounded-2xl bg-white/8 px-4 text-xs font-bold text-base-text-primary hover:bg-white/12 transition-colors"
                style={{ minHeight: 0 }}
              >
                Tạo
              </button>
            </div>
            <p className="mt-1.5 pl-1 text-[10px] text-base-text-secondary/40">
              Chỉ tạo hình dạng trừu tượng — không có khuôn mặt người thật.
            </p>
          </div>

          {/* Display name */}
          <div className="mb-6">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-base-text-secondary/50">
              Tên hiển thị ẩn danh
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, NAME_LIMIT))}
              placeholder="Ánh Sao Lặng Lẽ"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-base-text-primary placeholder:text-base-text-secondary/30 focus:outline-none focus:border-purple-400/40 transition-colors"
            />
            <p className="mt-1.5 pl-1 text-[10px] text-base-text-secondary/40">
              {displayName.length}/{NAME_LIMIT} · không dùng tên thật nhé
            </p>
          </div>

          {/* Vibe picker */}
          <div className="mb-8">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-base-text-secondary/50">
              Hệ cảm xúc (Vibe)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {IDENTITY_VIBES.map((v) => {
                const vm = VIBE_OPTIONS[v];
                const active = vibe === v;
                return (
                  <button
                    key={v}
                    onClick={() => setVibe(v)}
                    className="orb-btn flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition-all duration-300"
                    style={{
                      minHeight: 0,
                      borderColor: active ? `${vm.accent}66` : "rgba(255,255,255,0.08)",
                      background: active ? `${vm.accent}20` : "rgba(255,255,255,0.02)",
                      boxShadow: active ? `0 0 14px ${vm.accent}40` : "none",
                    }}
                  >
                    <span className="text-lg">{vm.emoji}</span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: active ? vm.accent : "rgba(255,255,255,0.5)" }}
                    >
                      {vm.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirm */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            className="orb-btn relative w-full rounded-full py-4 text-[15px] font-bold text-white"
            style={{
              minHeight: 0,
              background: "linear-gradient(135deg, #2D1F5E 0%, #7C5AE2 50%, #C084FC 100%)",
              boxShadow: "0 0 32px rgba(124,90,226,0.45), 0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <span className="relative flex items-center justify-center gap-2">
              <Check size={16} /> Xong, vào không gian
              <ArrowRight size={14} />
            </span>
          </motion.button>

          <button
            onClick={handleSkip}
            className="orb-btn mt-4 w-full text-center text-xs text-base-text-secondary/45 hover:text-base-text-secondary/70 transition-colors py-2"
            style={{ minHeight: 0 }}
          >
            Dùng mặc định, chỉnh sau cũng được →
          </button>
        </motion.div>
      </div>
    </SkyCanvas>
  );
}
