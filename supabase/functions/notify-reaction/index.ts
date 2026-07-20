// =====================================================
// Supabase Edge Function: notify-reaction (Deno runtime)
// -----------------------------------------------------
// CHƯA ĐƯỢC DEPLOY/KÍCH HOẠT — đây là SCAFFOLDING, giống cách
// supabase/schema.sql từng được chuẩn bị trước khi Supabase thật được nối
// (xem BACKEND_INTEGRATION.md mục 9 để biết từng bước triển khai thật).
//
// MỤC ĐÍCH: hoàn thành lời hứa của gate đăng nhập ở /ritual ("đăng nhập để
// nhận thông báo khi có người phản hồi") — hiện tại lời hứa đó CHƯA có gì
// đứng sau nó (chỉ có thông báo trong app, mô phỏng). Function này gửi một
// email thật qua Resend mỗi khi có reaction mới trên một câu chuyện có
// tác giả là Registered user (author_id khác null).
//
// TRIGGER: Supabase Database Webhook trên bảng `reactions`, sự kiện INSERT
// (không phải gọi trực tiếp từ client — cố ý, vì để client tự gọi hàm gửi
// email tới người khác là một lỗ hổng bảo mật/spam rõ ràng).
//
// CÁCH DEPLOY (xem chi tiết đầy đủ ở BACKEND_INTEGRATION.md mục 9):
//   1. supabase functions deploy notify-reaction
//   2. supabase secrets set RESEND_API_KEY=... RESEND_FROM_EMAIL="Solace <...>"
//   3. Supabase Dashboard → Database → Webhooks → tạo webhook INSERT trên
//      bảng `reactions`, trỏ tới URL của function này.
// =====================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "Solace <hello@your-domain.example>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// service_role key — LUÔN chỉ tồn tại ở phía server/edge function, KHÔNG
// bao giờ đưa vào bất kỳ biến NEXT_PUBLIC_* hay code client nào.
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REACTION_LABELS: Record<string, string> = {
  emotion: "một cảm xúc đồng cảm",
  sticker: "một sticker ấm áp",
  hug: "một cái ôm",
  gift: "một món quà nhỏ",
  message: "một lời nhắn",
};

interface ReactionRow {
  story_id: string;
  kind: string;
}

interface WebhookPayload {
  type: "INSERT";
  table: "reactions";
  record: ReactionRow;
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const reaction = payload.record;
    if (!reaction?.story_id) {
      return new Response("missing story_id", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("author_id, content")
      .eq("id", reaction.story_id)
      .single();

    if (storyError || !story) {
      console.error("story lookup failed", storyError);
      return new Response("story not found", { status: 404 });
    }

    // Story được thả bởi Guest (author_id null) — không có tài khoản/email
    // nào để gửi tới, đúng như thiết kế (chỉ Registered user mới cần và có
    // thể nhận email, xem gate đăng nhập ở app/ritual/page.tsx).
    if (!story.author_id) {
      return new Response("guest-authored story, skip", { status: 200 });
    }

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY chưa được cấu hình — bỏ qua gửi email (chế độ dev)");
      return new Response("email not configured, skip", { status: 200 });
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(story.author_id);
    const email = authUser?.user?.email;
    if (authError || !email) {
      console.error("author email lookup failed", authError);
      return new Response("author email not found", { status: 404 });
    }

    const excerpt = story.content.length > 80 ? `${story.content.slice(0, 80)}…` : story.content;
    const reactionLabel = REACTION_LABELS[reaction.kind] ?? "một phản hồi";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject: "Có người vừa gửi tia sáng cho bạn ✦",
        html: `<p>Câu chuyện của bạn — "<em>${excerpt}</em>" — vừa nhận được ${reactionLabel} từ ai đó.</p><p>Ghé Solace để xem nhé.</p>`,
      }),
    });

    if (!emailRes.ok) {
      console.error("Resend API error", await emailRes.text());
      return new Response("email send failed", { status: 502 });
    }

    return new Response("sent", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("internal error", { status: 500 });
  }
});
