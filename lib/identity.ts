// Random anonymous identity generator — spec mục A6.1 + Module 1 (Xác thực & tài khoản)
// Ghép một tính từ cảm xúc/thiên nhiên với một danh từ thuộc hệ Sky/Ocean.
// Không cho nhập tên tự do cho Guest, để tránh lộ danh tính thật hoặc ngôn từ
// không phù hợp. Registered user thì được đặt tên hiển thị riêng (Module 1.1).

const ADJECTIVES = [
  "Lặng Lẽ",
  "Dịu Dàng",
  "Buổi Sớm",
  "Nhỏ Bé",
  "Bình Yên",
  "Xa Xăm",
  "Ấm Áp",
  "Trong Veo",
  "Mong Manh",
  "Thầm Lặng",
];

const NOUNS = [
  "Ánh Sao",
  "Giọt Sương",
  "Con Sóng",
  "Cơn Gió",
  "Vầng Trăng Khuyết",
  "Vệt Mây",
  "Viên Sỏi",
  "Vỏ Sò",
  "Bong Bóng Khí",
  "Tia Chớp Nhẹ",
];

// Abstract nature/cosmos shapes — never a human face, to keep anonymity (A6.2)
export const IDENTITY_ICONS = [
  "moon-crescent",
  "star-dot",
  "dew-drop",
  "pebble",
  "cloud-cluster",
  "shell",
  "air-bubble",
  "soft-spark",
] as const;

export type IdentityIcon = (typeof IDENTITY_ICONS)[number];
export type IdentityVibe = "cozy" | "dreamy" | "cyber" | "lofi";

export const IDENTITY_VIBES: IdentityVibe[] = ["cozy", "dreamy", "cyber", "lofi"];

/** Màu accent gọn nhẹ theo vibe — dùng ở những nơi chỉ cần 1 màu (vd. badge
 * tác giả ẩn danh trên Story Detail), tách khỏi VIBE_META đầy đủ trong
 * AnonymousIdentityBadge.tsx (nơi đó còn có tagline, gradient, danh sách
 * thay đổi UI...). Giữ 2 nguồn để tránh phải export toàn bộ metadata UI
 * ra khỏi component chỉ vì cần mỗi màu sắc. */
export const VIBE_ACCENT_COLORS: Record<IdentityVibe, string> = {
  cozy: "#E8A47A",
  dreamy: "#C084FC",
  cyber: "#22D3EE",
  lofi: "#FBBF24",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// =====================================================
// MODULE 1.1 — Hai loại người dùng
// =====================================================

/** Guest (bỏ qua đăng nhập) — danh tính tự sinh hoàn toàn, không sửa được tên. */
export interface GuestIdentity {
  kind: "guest";
  name: string;
  icon: IdentityIcon;
  vibe: IdentityVibe;
}

/**
 * Registered (đã đăng nhập qua magic link) — tên hiển thị tự đặt + avatar AI
 * (trừu tượng, không khuôn mặt — xem lib/avatar.ts), gắn với userId.
 * MVP hiện tại: userId = email đã xác thực (xem context/AuthContext.tsx).
 * Khi nối backend thật, đây chính là bản ghi trong bảng `anonymous_users`
 * (auth_type, display_name, avatar_url, vibe) theo mục 1.3 của đặc tả.
 */
export interface UserProfile {
  kind: "user";
  userId: string;
  displayName: string;
  avatarSeed: string;
  avatarPrompt?: string;
  vibe: IdentityVibe;
}

export type Identity = GuestIdentity | UserProfile;

export function generateGuestIdentity(): GuestIdentity {
  return {
    kind: "guest",
    name: `${pick(NOUNS)} ${pick(ADJECTIVES)}`,
    icon: pick(IDENTITY_ICONS),
    vibe: pick(IDENTITY_VIBES),
  };
}

/** Hồ sơ mặc định khi vừa đăng nhập lần đầu — người dùng có thể tuỳ chỉnh
 * lại ngay ở /profile-setup, hoặc bỏ qua và giữ nguyên bản này. */
export function createDefaultUserProfile(userId: string, vibe?: IdentityVibe): UserProfile {
  return {
    kind: "user",
    userId,
    displayName: `${pick(NOUNS)} ${pick(ADJECTIVES)}`,
    avatarSeed: Math.random().toString(36).slice(2, 10),
    vibe: vibe ?? pick(IDENTITY_VIBES),
  };
}

export function getIdentityDisplayName(identity: Identity): string {
  return identity.kind === "guest" ? identity.name : identity.displayName;
}
