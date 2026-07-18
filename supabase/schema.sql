-- =====================================================================
-- Trạm Phát Sáng — Supabase schema (SCAFFOLDING cho Giai đoạn 2)
-- =====================================================================
-- File này CHƯA được kết nối vào ứng dụng — ứng dụng hiện tại vẫn chạy
-- hoàn toàn trên localStorage (xem tai-lieu-du-an mục 4.5). Đây là bước
-- chuẩn bị: khớp 1-1 với các kiểu dữ liệu TypeScript đã có trong
-- lib/mockSignals.ts, lib/identity.ts, context/AppStateContext.tsx,
-- context/NotificationContext.tsx — để khi có backend team, việc nối dữ
-- liệu thật không phải thiết kế lại từ đầu.
--
-- CÁCH DÙNG:
--   1. Tạo project mới tại supabase.com (miễn phí đủ dùng cho MVP).
--   2. Mở SQL Editor trong dashboard Supabase, dán toàn bộ file này, Run.
--   3. Xem supabase/BACKEND_INTEGRATION.md để biết chính xác cần sửa gì
--      trong code hiện tại (2 điểm nối quan trọng nhất: releaseDraft() và
--      sendReaction() trong context/AppStateContext.tsx).
--
-- LƯU Ý AN TOÀN: các RLS policy bên dưới là điểm KHỞI ĐẦU hợp lý, KHÔNG
-- phải cấu hình sẵn sàng production — cần backend dev + cố vấn bảo mật
-- review lại trước khi có người dùng thật ngoài đội nội bộ (tai-lieu-du-an
-- mục 5.2.5, 5.3).
-- =====================================================================

create extension if not exists "uuid-ossp";

-- =====================================================================
-- ANONYMOUS_USERS — ứng với UserProfile trong lib/identity.ts.
-- Guest KHÔNG có hàng ở đây (không đăng nhập, không cần persist đa thiết
-- bị) — chỉ Registered user mới có bản ghi, liên kết 1-1 với auth.users
-- của Supabase Auth (magic link email thật, thay AuthContext mô phỏng).
-- =====================================================================
create table if not exists public.anonymous_users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  vibe text not null default 'cozy' check (vibe in ('cozy','dreamy','cyber','lofi')),
  avatar_seed text not null,
  avatar_prompt text,
  profile_setup_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.anonymous_users is
  'Registered user profile — KHÔNG lưu tên thật/thông tin định danh ngoài email (đã có sẵn trong auth.users). Tuyệt đối không thêm cột lộ danh tính thật, đúng nguyên tắc "ẩn danh là mặc định" (mục 1.4).';

-- =====================================================================
-- STORIES — ứng với interface Story trong lib/mockSignals.ts
-- =====================================================================
create table if not exists public.stories (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.anonymous_users(id) on delete set null,
  -- Snapshot ẩn danh tại thời điểm thả (StoryAuthor trong mockSignals.ts)
  -- — KHÔNG suy ngược lại danh tính thật kể cả khi author đổi tên/vibe
  -- sau này, đúng nguyên tắc "author_identity là snapshot, không phải
  -- tham chiếu sống" (mục 2.1).
  author_name_snapshot text not null,
  author_vibe_snapshot text not null,
  author_icon_snapshot text,
  type text not null check (type in ('star','bubble')),
  content text not null check (char_length(content) <= 1000),
  x numeric not null,
  y numeric not null,
  size text not null default 'md' check (size in ('sm','md','lg')),
  reaction_count integer not null default 0,
  mood_at_release integer check (mood_at_release between 1 and 10),
  status text not null default 'pending_review' check (status in ('visible','pending_review','removed')),
  moderation_matched_terms text[],
  created_at timestamptz not null default now()
);

create index if not exists stories_status_idx on public.stories (status);
create index if not exists stories_type_idx on public.stories (type);
create index if not exists stories_created_at_idx on public.stories (created_at desc);

comment on column public.stories.reaction_count is
  'warmth (few/some/many) suy ra từ cột này ở tầng ứng dụng qua warmthFromCount() — KHÔNG hiển thị số thô cho người dùng (spec A8, mục 3.2).';

-- =====================================================================
-- REACTIONS — ứng với ReactionKind trong context/AppStateContext.tsx.
-- Một người dùng ĐƯỢC PHÉP gửi nhiều reaction tới cùng 1 story (đã bỏ
-- giới hạn "1 lần/story" — xem tai-lieu-du-an mục 8, "Thay đổi cơ chế
-- phản hồi"). Giới hạn an toàn duy nhất là tổng số lượt/ngày (xem view
-- reactions_today_count bên dưới).
-- =====================================================================
create table if not exists public.reactions (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references public.stories(id) on delete cascade,
  sender_id uuid references public.anonymous_users(id) on delete set null,
  kind text not null check (kind in ('emotion','sticker','hug','gift','message')),
  message text check (char_length(message) <= 300),
  moderation_matched_terms text[],
  created_at timestamptz not null default now()
);

create index if not exists reactions_story_id_idx on public.reactions (story_id);
create index if not exists reactions_sender_created_idx on public.reactions (sender_id, created_at);

-- Tự động tăng reaction_count trên stories mỗi khi có reaction mới, để
-- app không phải tự tính lại (và không thể bị client thao túng con số).
create or replace function public.increment_story_reaction_count()
returns trigger as $$
begin
  update public.stories set reaction_count = reaction_count + 1 where id = new.story_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_increment_reaction_count on public.reactions;
create trigger trg_increment_reaction_count
  after insert on public.reactions
  for each row execute function public.increment_story_reaction_count();

-- Đếm số reaction 1 người gửi "hôm nay" — chống spam ở tầng SERVER thay
-- vì chỉ ở client/localStorage như bản hiện tại (dễ bypass bằng cách sửa
-- localStorage hoặc dùng nhiều tab/thiết bị — xem mục 5.2.2).
create or replace view public.reactions_today_count as
select sender_id, count(*) as count
from public.reactions
where created_at >= date_trunc('day', now())
group by sender_id;

-- =====================================================================
-- MOOD_HISTORY — ứng với MoodHistoryEntry trong context/AppStateContext.tsx
-- =====================================================================
create table if not exists public.mood_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.anonymous_users(id) on delete cascade,
  value integer not null check (value between 1 and 10),
  created_at timestamptz not null default now()
);

create index if not exists mood_history_user_created_idx on public.mood_history (user_id, created_at);

-- =====================================================================
-- NOTIFICATIONS — ứng với NotificationType trong context/NotificationContext.tsx
-- =====================================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.anonymous_users(id) on delete cascade,
  type text not null check (type in ('reaction','milestone','checkin-reminder','article-suggestion','hotline','product-update')),
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx on public.notifications (user_id, read);

-- =====================================================================
-- FEEDBACK — ứng với Module 7 (/settings/feedback)
-- =====================================================================
create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.anonymous_users(id) on delete set null,
  category text not null,
  rating integer check (rating between 1 and 5),
  content text not null,
  -- Ảnh chụp màn hình lưu trong Supabase Storage, chỉ giữ URL ở đây —
  -- KHÔNG base64 trực tiếp trong cột như bản MVP localStorage hiện tại
  -- (dễ chạm giới hạn dung lượng, xem mục 5.2.2).
  screenshot_url text,
  context jsonb not null default '{}'::jsonb, -- { page, moodAtSubmit, appVersion, deviceType }
  created_at timestamptz not null default now()
);

-- =====================================================================
-- LIBRARY_ARTICLES — ứng với LibraryArticle trong lib/libraryContent.ts.
-- Khi nội dung thật đã qua chuyên gia tâm lý thẩm định (mục 5.2.1, Sprint
-- 3), migrate dữ liệu sang đây thay vì tiếp tục hardcode trong file .ts.
-- =====================================================================
create table if not exists public.library_articles (
  slug text primary key,
  category text not null check (category in ('article','tip','exercise','community')),
  tags text[] not null default '{}',
  mood_tags text[] not null default '{}',
  reading_time_minutes integer not null default 3,
  author_name text not null,
  author_credentials text not null,
  cover_gradient text,
  cover_emoji text,
  content_vi jsonb not null, -- { title, excerpt, body }
  content_en jsonb,          -- optional — fallback về vi nếu null (Module 8)
  -- Tên/chức danh chuyên gia đã thẩm định nội dung — BẮT BUỘC có giá trị
  -- trước khi bài viết được dùng thật (mục 5.2.1: "chưa qua thẩm định
  -- chuyên môn — không nên dùng làm nội dung thật khi ra mắt").
  reviewed_by text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY — điểm KHỞI ĐẦU, cần review kỹ trước production.
-- Nguyên tắc chung: stories 'visible' đọc công khai kể cả người chưa
-- đăng nhập (đúng tinh thần "chỉ lắng nghe thôi" — Module 2.2); mood
-- history/notifications riêng tư tuyệt đối theo user_id.
-- =====================================================================
alter table public.anonymous_users enable row level security;
alter table public.stories enable row level security;
alter table public.reactions enable row level security;
alter table public.mood_history enable row level security;
alter table public.notifications enable row level security;
alter table public.feedback enable row level security;
alter table public.library_articles enable row level security;

create policy "anonymous_users: self read/write" on public.anonymous_users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "stories: public read visible" on public.stories
  for select using (status = 'visible');

create policy "stories: owner read own (incl. pending_review)" on public.stories
  for select using (auth.uid() = author_id);

create policy "stories: owner insert" on public.stories
  for insert with check (auth.uid() = author_id or author_id is null);

create policy "reactions: public read" on public.reactions
  for select using (true);

create policy "reactions: signed-in insert" on public.reactions
  for insert with check (true);

create policy "mood_history: owner only" on public.mood_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications: owner only" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "feedback: insert only, no public read" on public.feedback
  for insert with check (true);

create policy "library_articles: public read" on public.library_articles
  for select using (true);
