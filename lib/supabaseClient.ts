// Kết nối Supabase thật (Giai đoạn 2) — xem supabase/BACKEND_INTEGRATION.md.
//
// Cố tình cho phép `supabase` là null khi thiếu biến môi trường (thay vì
// throw ngay lúc import) — để dự án vẫn chạy được bình thường trên
// localStorage nếu ai đó clone code này về mà chưa có file `.env.local`
// riêng, đúng tinh thần "an toàn trước, mượt mà sau" (mục 1.4). Mọi nơi
// gọi tới Supabase (xem lib/storiesApi.ts) đều tự kiểm tra
// `isSupabaseConfigured` trước, và luôn có đường lùi về localStorage nếu
// gọi thất bại vì bất kỳ lý do gì (thiếu bảng, sai RLS, mất mạng...).
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
