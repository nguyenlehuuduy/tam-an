// Lớp trung gian giữa AppStateContext.tsx và Supabase — tách riêng để
// AppStateContext.tsx không phải biết chi tiết tên cột/bảng thật, và để
// dễ thay đổi sau này (vd. đổi sang REST API riêng) mà không đụng vào
// logic state ở AppStateContext.tsx. Mọi hàm ở đây đều "an toàn khi lỗi":
// nếu Supabase chưa cấu hình, bảng chưa tồn tại, RLS chặn, hay mất mạng —
// trả về null/false/[] và log cảnh báo, KHÔNG throw ra ngoài, để app luôn
// có đường lùi về localStorage (xem context/AppStateContext.tsx).
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { IdentityIcon, IdentityVibe } from "./identity";
import { Story, StoryAuthor, StoryType, ReactionKind, warmthFromCount } from "./mockSignals";
import { StoryStatus } from "./moderation";

interface StoryRow {
  id: string;
  author_id: string | null;
  author_name_snapshot: string;
  author_vibe_snapshot: string;
  author_icon_snapshot: string | null;
  type: StoryType;
  content: string;
  x: number | string;
  y: number | string;
  size: Story["size"];
  reaction_count: number;
  mood_at_release: number | null;
  status: StoryStatus;
  created_at: string;
}

function timeAgoLabel(createdAtMs: number): string {
  const hoursAgo = Math.max(0, Math.floor((Date.now() - createdAtMs) / (60 * 60 * 1000)));
  if (hoursAgo < 1) return "vừa xong";
  if (hoursAgo < 24) return `${hoursAgo} giờ trước`;
  return `${Math.floor(hoursAgo / 24)} ngày trước`;
}

function mapRowToStory(row: StoryRow): Story {
  const createdAtMs = new Date(row.created_at).getTime();
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    x: Number(row.x),
    y: Number(row.y),
    size: row.size,
    warmth: warmthFromCount(row.reaction_count),
    reactionCount: row.reaction_count,
    moodAtRelease: row.mood_at_release,
    createdAt: createdAtMs,
    createdAgo: timeAgoLabel(createdAtMs),
    status: row.status,
    author: {
      name: row.author_name_snapshot,
      vibe: row.author_vibe_snapshot as IdentityVibe,
      icon: (row.author_icon_snapshot as IdentityIcon) || undefined,
    },
  };
}

/** Lấy toàn bộ câu chuyện đang "visible" từ Supabase — dùng để BỔ SUNG
 * (không thay thế) dữ liệu mẫu sẵn có trong lib/mockSignals.ts, để không
 * gian vẫn cảm thấy sống động ngay cả khi chưa có nhiều người dùng thật. */
export async function fetchVisibleStories(): Promise<Story[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error || !data) {
      console.warn("[supabase] Không tải được câu chuyện thật, dùng dữ liệu mẫu:", error?.message);
      return [];
    }
    return (data as StoryRow[]).map(mapRowToStory);
  } catch (err) {
    console.warn("[supabase] fetchVisibleStories lỗi:", err);
    return [];
  }
}

export interface InsertStoryInput {
  authorId: string | null;
  author: StoryAuthor;
  type: StoryType;
  content: string;
  x: number;
  y: number;
  moodAtRelease: number | null;
  status: StoryStatus;
  matchedTerms: string[];
}

/** Lưu một câu chuyện mới lên Supabase. Trả về null nếu thất bại (chưa
 * cấu hình, chưa chạy schema.sql, RLS chặn, mất mạng...) — người gọi nên
 * giữ nguyên bản lưu cục bộ trong trường hợp này, không chặn UI chờ. */
export async function insertStory(input: InsertStoryInput): Promise<Story | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from("stories")
      .insert({
        author_id: input.authorId,
        author_name_snapshot: input.author.name,
        author_vibe_snapshot: input.author.vibe,
        author_icon_snapshot: input.author.icon ?? null,
        type: input.type,
        content: input.content,
        x: input.x,
        y: input.y,
        mood_at_release: input.moodAtRelease,
        status: input.status,
        moderation_matched_terms: input.matchedTerms,
      })
      .select()
      .single();
    if (error || !data) {
      console.warn("[supabase] Không lưu được câu chuyện lên server, chỉ lưu tạm cục bộ:", error?.message);
      return null;
    }
    return mapRowToStory(data as StoryRow);
  } catch (err) {
    console.warn("[supabase] insertStory lỗi:", err);
    return null;
  }
}

export interface InsertReactionInput {
  storyId: string;
  senderId: string | null;
  kind: ReactionKind;
  message?: string;
}

/** Lưu một lượt phản hồi lên Supabase. Trả về false nếu thất bại — người
 * gọi vẫn nên cập nhật reactionCount cục bộ ngay lập tức để UI phản hồi
 * tức thì (optimistic), không chờ mạng. */
export async function insertReaction(input: InsertReactionInput): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from("reactions").insert({
      story_id: input.storyId,
      sender_id: input.senderId,
      kind: input.kind,
      message: input.message ?? null,
    });
    if (error) {
      console.warn("[supabase] Không lưu được reaction lên server:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[supabase] insertReaction lỗi:", err);
    return false;
  }
}
