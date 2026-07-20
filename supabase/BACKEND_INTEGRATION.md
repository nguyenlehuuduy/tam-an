# Hướng dẫn nối backend thật (Giai đoạn 2)

*File này mô tả CHÍNH XÁC cần làm gì để chuyển ứng dụng từ localStorage sang Supabase thật. Chưa có bước nào trong này được thực hiện — code hiện tại vẫn chạy 100% trên localStorage. Lý do: việc này cần tài khoản Supabase, API key kiểm duyệt nội dung, và API key dịch vụ email thật của chính bạn — đây là những thứ chỉ bạn mới cấp được, không thể tự tạo thay bạn.*

## 1. Việc bạn cần chuẩn bị trước

| Việc | Ở đâu | Dùng để làm gì |
|---|---|---|
| Tạo project Supabase (miễn phí) | [supabase.com](https://supabase.com) | Database + Auth + Realtime + Storage |
| Lấy `Project URL` + `anon public key` | Supabase Dashboard → Settings → API | Client-side, an toàn để lộ trong code frontend |
| Lấy `service_role key` | Supabase Dashboard → Settings → API | CHỈ dùng ở server (route handler/edge function), KHÔNG bao giờ đưa vào code client |
| Tài khoản OpenAI (hoặc Perspective API của Google) | platform.openai.com | Thay bộ lọc từ khoá trong `lib/moderation.ts` bằng phân loại AI thật |
| Tài khoản Resend hoặc SendGrid | resend.com / sendgrid.com | Gửi email magic link + thông báo thật |

## 2. Chạy schema

Dán toàn bộ nội dung `supabase/schema.sql` vào SQL Editor của Supabase Dashboard và bấm Run. File đã khớp 1-1 với các kiểu dữ liệu TypeScript đang có trong `lib/mockSignals.ts`, `lib/identity.ts`, `context/AppStateContext.tsx`, `context/NotificationContext.tsx`.

## 3. Cài đặt thư viện & biến môi trường

```bash
npm install @supabase/supabase-js
```

Tạo file `.env.local` (không commit lên git):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # chỉ dùng server-side
OPENAI_API_KEY=sk-...              # cho moderation thật (bước 5)
RESEND_API_KEY=re_...              # cho email thật (bước 6)
```

Sau đó tạo `lib/supabaseClient.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

*(File này chưa được tạo sẵn trong dự án — vì import một package chưa cài đặt sẽ làm `next build` báo lỗi ngay lập tức. Chỉ tạo file này SAU KHI đã chạy `npm install @supabase/supabase-js` ở bước trên.)*

## 4. Hai điểm nối quan trọng nhất — `context/AppStateContext.tsx`

Đây là "trái tim" state của app — mọi nơi khác trong UI (`/write`, `/ritual`, `/explore`, `SignalCard`...) đều gọi qua `useAppState()`, không cần đổi gì ở các file đó.

### `releaseDraft()`

Hiện tại (dòng ~395): chỉ tạo object `Story`, set state + để `useEffect` khác ghi vào `localStorage`. Cần đổi thành:

```ts
const releaseDraft = useCallback(async (overrideType?: StoryType) => {
  const finalType = overrideType ?? draft.type;
  if (!finalType || draft.content.trim().length === 0) return null;

  const { status, highRisk, matchedTerms } = moderateContent(draft.content);
  // ... giữ nguyên phần tạo author snapshot như code hiện tại ...

  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: identity.kind === "user" ? identity.userId : null,
      author_name_snapshot: author.name,
      author_vibe_snapshot: author.vibe,
      author_icon_snapshot: author.icon ?? null,
      type: finalType,
      content: draft.content.trim(),
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      mood_at_release: mood,
      status,
      moderation_matched_terms: matchedTerms,
    })
    .select()
    .single();

  if (error || !data) return null;
  // map `data` (snake_case từ Postgres) sang Story (camelCase) — viết một
  // hàm mapRowToStory() dùng chung, tương tự migrateStory() đã có sẵn.
  // ...
  return { story: mappedStory, highRisk };
}, [draft, mood, identity]);
```

Giữ nguyên `localStorage` làm cache/offline fallback (đọc trước khi có mạng, đồng bộ lại khi có mạng) thay vì xoá hẳn — đúng khuyến nghị ở tai-lieu-du-an mục 4.5.

### `sendReaction()`

Hiện tại (dòng ~456): chặn theo `DAILY_REACTION_LIMIT` đọc từ state client. Cần đổi thành: insert vào bảng `reactions`, và kiểm tra giới hạn/ngày bằng cách query view `reactions_today_count` đã tạo sẵn trong `schema.sql` — đây mới là giới hạn THẬT không thể bypass bằng cách sửa localStorage (khác bản hiện tại, xem mục 5.2.2 tai-lieu-du-an).

## 5. Nâng cấp kiểm duyệt nội dung — `lib/moderation.ts`

Hàm `moderateContent(text)` đã được thiết kế để đây là **điểm duy nhất cần sửa** — chữ ký hàm (nhận `string`, trả `{status, highRisk, matchedTerms}`) giữ nguyên, mọi nơi gọi nó trong app không cần đổi gì. Thay phần thân hàm bằng gọi API thật, ví dụ OpenAI Moderation API:

```ts
export async function moderateContent(text: string): Promise<ModerationResult> {
  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text }),
  });
  const json = await res.json();
  const flagged = json.results?.[0]?.flagged ?? false;
  // Quan trọng: NGƯỠNG gắn cờ nên được quyết định cùng chuyên gia tâm lý,
  // không tự ý chọn một mình (xem tai-lieu-du-an mục 7, ghi chú chung).
  return { status: flagged ? "pending_review" : "visible", highRisk: flagged, matchedTerms: [] };
}
```

Vì hàm sẽ trở thành `async`, mọi nơi gọi `moderateContent()` (trong `AppStateContext.tsx` và `SignalCard.tsx`) cần thêm `await` — đây là thay đổi duy nhất lan ra ngoài file `moderation.ts`.

## 6. Xác thực thật — `context/AuthContext.tsx`

Thay hàm gửi magic link mô phỏng (`setTimeout`) bằng:

```ts
await supabase.auth.signInWithOtp({ email });
```

Và lắng nghe `supabase.auth.onAuthStateChange(...)` thay vì tự quản lý session trong localStorage.

## 7. Real-time — thay `NotificationEventsBridge`

```ts
supabase
  .channel("reactions-for-me")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "reactions", filter: `story_id=in.(${myStoryIds.join(",")})` }, (payload) => {
    // tạo notification "reaction" mới trong NotificationContext
  })
  .subscribe();
```

## 9. Email thật khi có phản hồi — hoàn thành lời hứa của gate đăng nhập ở `/ritual`

*Lưu ý: mục 2–4 ở trên mô tả trạng thái TRƯỚC KHI Supabase được nối — thực
tế `lib/supabaseClient.ts` và `lib/storiesApi.ts` đã được tạo và
`releaseDraft()`/`sendReaction()` trong `context/AppStateContext.tsx` ĐÃ lưu
thật lên Supabase (tự lùi về localStorage nếu lỗi). Mục này chỉ nói riêng
về phần EMAIL — phần duy nhất còn là mô phỏng.*

Từ khi `/ritual` yêu cầu đăng nhập để thả câu chuyện (lý do: "để bạn nhận
được thông báo khi có người phản hồi"), lời hứa đó cần có thứ gì đứng sau
nó. Scaffolding đã có sẵn ở `supabase/functions/notify-reaction/index.ts`
— một Supabase Edge Function (Deno), CHƯA deploy/kích hoạt. Các bước để
nối thật:

1. Tạo tài khoản [resend.com](https://resend.com) (có gói miễn phí), xác
   minh một domain gửi (hoặc dùng domain test của Resend khi phát triển).
2. Lấy API key từ Resend Dashboard.
3. Deploy function: `supabase functions deploy notify-reaction`.
4. Set secrets: `supabase secrets set RESEND_API_KEY=re_... RESEND_FROM_EMAIL="Solace <hello@your-domain.com>"`.
5. Trong Supabase Dashboard → Database → Webhooks → tạo webhook mới:
   bảng `reactions`, sự kiện `INSERT`, loại `HTTP Request`, URL trỏ tới
   endpoint của function vừa deploy.
6. Test: gửi một reaction thật tới một story có `author_id` (tức là do
   Registered user thả) — kiểm tra email có tới hộp thư không.

An toàn: function dùng `service_role key` (không bao giờ lộ ra client) để
tra cứu email tác giả qua `supabase.auth.admin.getUserById()` — bỏ qua
hoàn toàn các story do Guest thả (`author_id` null), đúng với việc chỉ
Registered user mới có thể thả câu chuyện từ giờ.

## 10. Thứ tự khuyến nghị

Theo đúng ưu tiên đã ghi trong tai-lieu-du-an mục 5.3 và Sprint 1-3: chạy schema + xác thực thật + kiểm duyệt thật trước (rủi ro cao nhất vì đây là app sức khoẻ tinh thần), rồi mới tới real-time/email, cuối cùng là nội dung Thư viện được chuyên gia thẩm định.
