# Trạm Phát Sáng — MVP prototype

Web app Next.js (App Router + TypeScript + Tailwind) triển khai đúng luồng 5 bước
và hệ thống thiết kế mô tả trong "Đặc tả thiết kế & triển khai sản phẩm chi tiết".
Chạy được ngay với **dữ liệu mẫu lưu trong bộ nhớ/localStorage** — chưa nối backend thật.

## Chạy thử

```bash
npm install
npm run dev
```

Mở http://localhost:3000 — sẽ tự chuyển vào Bước 1 (Check-in).

`npm run build && npm run start` để chạy bản production.

## Đã triển khai (bám theo tài liệu đặc tả)

- **Bước 1–5** đầy đủ: Check-in ẩn danh → Viết & chọn nơi thả → Nghi thức thả (kéo-thả
  bằng framer-motion, hoạt ảnh hero theo đúng easing/timing ở mục A9.3) → Khám phá
  không gian (tab Bầu trời/Đại dương) → Gửi tia sáng ấm áp (chỉ preset, không có ô
  nhập text tự do).
- **Hệ thống màu sắc & typography** đúng mã hex/tên ở mục A4–A5 (`tailwind.config.ts`).
- **Danh tính ẩn danh** ngẫu nhiên (tên + icon trừu tượng, không khuôn mặt) — mục A6.
- **Hiệu ứng nền** Sky (sao lấp lánh, sao băng thỉnh thoảng, dải aurora mờ) và Ocean
  (sóng SVG 2 lớp, bong bóng trang trí nổi lên) — mục A9.1/A9.2, CSS/SVG thuần, không
  WebGL.
- **Âm thanh** tổng hợp bằng Web Audio API (không cần file mp3 ngoài) — mục A10. Tắt
  theo mặc định, bật ở nút loa trên màn hình Khám phá.
- **Kiểm duyệt cơ bản** (`lib/moderation.ts`): lọc từ khoá rất ngắn mang tính minh hoạ,
  gắn cờ nội dung nguy cơ cao → tạm ẩn khỏi không gian chung + hiện banner hotline
  ngay lập tức, không chặn thao tác — mục A14. **Cần thay bằng API kiểm duyệt thật
  trước khi ra mắt** (xem mục 6.1, 6.3 của báo cáo MVP gốc).
- **Lịch sử cá nhân** (mục MoSCoW "Nên có") ở `/history`.
- Tôn trọng `prefers-reduced-motion`, cỡ chạm tối thiểu 44px, giữ layout dạng khung
  điện thoại kể cả trên desktop — mục A15.

## Chưa làm / đơn giản hoá có chủ đích (đúng phạm vi MVP)

- **Chưa nối Supabase** — toàn bộ dữ liệu là mock (`lib/mockSignals.ts`) + những gì
  bạn tự thả trong phiên hiện tại (lưu tạm ở `localStorage`, mất khi xoá trình duyệt).
  Xem phần "Nối Supabase thật" bên dưới.
- Cử chỉ pan/pinch để "khám phá không gian" ở Bước 4 chưa làm — hiện tại là một
  không gian tĩnh với các lớp nền trôi nhẹ (parallax nền), người dùng chạm trực tiếp
  vào từng sao/bong bóng. Có thể bổ sung sau bằng `framer-motion`'s `drag` trên toàn
  canvas nếu cần đúng 100% đặc tả.
- Biểu đồ cảm xúc theo thời gian ("Nên có" trong báo cáo gốc) chưa làm — hiện chỉ
  lưu mức cảm xúc của phiên hiện tại, chưa vẽ biểu đồ.
- Cảnh báo "Failed to minify the stylesheet ... fonts.googleapis.com" khi build là do
  sandbox không có mạng ra ngoài — vô hại, chỉ là Next.js bỏ qua bước tối ưu font,
  chữ Be Vietnam Pro vẫn tải bình thường khi bạn build ở máy có Internet.

## Nối Supabase thật

1. Tạo project Supabase, lấy `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Tạo bảng theo mô hình dữ liệu ở mục A17 (`anonymous_users`, `signals`, `reactions`,
   `moderation_flags`, `hotline_events`).
3. Thêm `lib/supabase/client.ts` (dùng `@supabase/supabase-js`), thay các hàm trong
   `context/AppStateContext.tsx` (`releaseDraft`, `sendReaction`, danh sách `signals`)
   bằng query/insert Supabase thay vì mảng mock + localStorage.
4. Thay `lib/moderation.ts` bằng gọi API kiểm duyệt thật (bộ lọc từ khoá + API mô hình
   ngôn ngữ, theo mục 6.1 báo cáo gốc), chạy phía server (route handler) thay vì client.

## Cấu trúc thư mục

Bám theo mục A16 của tài liệu đặc tả: `app/` (5 màn hình + history), `components/ui`,
`components/canvas`, `components/onboarding`, `components/release`,
`components/explore`, `lib/`, `context/`.
