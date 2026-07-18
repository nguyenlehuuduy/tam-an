// "Avatar AI" — Module 1.2: ảnh đại diện trừu tượng cho Registered user,
// tuyệt đối không khuôn mặt người, để giữ ẩn danh hoàn toàn (xem thêm
// lib/identity.ts, mục A6.2 của đặc tả).
//
// Đây là bản MVP CHỈ triển khai front-end: thay vì gọi một API sinh ảnh AI
// thật (cần backend + API key + chi phí), ta tổng hợp một hình trừu tượng
// (các khối sáng mờ chồng lên nhau, giống phong cách "orb" đã dùng ở
// SignalOrb/ReleaseGesture) hoàn toàn bằng thuật toán — xác định
// (deterministic) theo "seed", nên cùng seed luôn cho cùng một hình, giữ
// avatar ổn định giữa các lần tải trang mà không cần lưu ảnh ở đâu cả.
//
// Khi nối backend thật (xem README mục "Nối Supabase thật"): thay
// generateAvatarBlobs() bằng một lệnh gọi tới dịch vụ sinh ảnh AI thật
// (ví dụ DALL·E / Stable Diffusion, dùng avatarPrompt người dùng nhập ở
// /profile-setup làm prompt), rồi lưu link ảnh trả về vào cột avatar_url.

export interface AvatarBlob {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

function hashStringToInt(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(31, h) + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// PRNG nhỏ, xác định theo seed số (mulberry32) — đủ dùng cho hoạ tiết trang trí,
// không cần chất lượng ngẫu nhiên bằng crypto.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sinh danh sách khối sáng mờ tạo nên avatar trừu tượng — cùng seed luôn ra cùng hình. */
export function generateAvatarBlobs(seed: string, count = 4): AvatarBlob[] {
  const rand = mulberry32(hashStringToInt(seed));
  return Array.from({ length: count }, () => ({
    cx: 22 + rand() * 56,
    cy: 22 + rand() * 56,
    r: 16 + rand() * 24,
    opacity: 0.3 + rand() * 0.35,
  }));
}

export function randomAvatarSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Sinh seed từ gợi ý ngắn người dùng nhập (vd. "một con sóng nhỏ trong đêm")
 * — vẫn chỉ ra hình trừu tượng, KHÔNG cố gắng vẽ nghĩa đen của câu chữ, vì
 * đây chưa phải AI sinh ảnh thật (xem ghi chú đầu file). */
export function avatarSeedFromPrompt(prompt: string): string {
  const trimmed = prompt.trim().toLowerCase();
  if (!trimmed) return randomAvatarSeed();
  return `p${hashStringToInt(trimmed)}`;
}
