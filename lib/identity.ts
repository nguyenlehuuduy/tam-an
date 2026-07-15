// Random anonymous identity generator — spec mục A6.1
// Ghép một tính từ cảm xúc/thiên nhiên với một danh từ thuộc hệ Sky/Ocean.
// Không cho nhập tên tự do, để tránh lộ danh tính thật hoặc ngôn từ không phù hợp.

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

export interface AnonymousIdentity {
  name: string;
  icon: IdentityIcon;
  vibe: IdentityVibe;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateIdentity(): AnonymousIdentity {
  return {
    name: `${pick(NOUNS)} ${pick(ADJECTIVES)}`,
    icon: pick(IDENTITY_ICONS),
    vibe: pick(IDENTITY_VIBES),
  };
}
