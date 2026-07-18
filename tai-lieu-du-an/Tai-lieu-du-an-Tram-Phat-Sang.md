# Tài liệu dự án — Trạm Phát Sáng

*Tài liệu tổng hợp toàn bộ hiểu biết về dự án tính đến thời điểm hiện tại, biên soạn dựa trên toàn bộ mã nguồn và lịch sử phát triển thực tế. Trước đây được chia thành 8 file riêng biệt (README + 7 phần); nay đã gộp lại thành **một file duy nhất** để dễ đọc, dễ tìm kiếm và chia sẻ.*

**Trạng thái dự án tại thời điểm biên soạn: MVP front-end hoàn chỉnh cho cả 9 module, chưa nối backend thật.**

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Tiến độ & tính năng đã triển khai](#2-tiến-độ--tính-năng-đã-triển-khai)
3. [Design System](#3-design-system)
4. [Kiến trúc kỹ thuật](#4-kiến-trúc-kỹ-thuật)
5. [Đánh giá hiện trạng & khoảng trống](#5-đánh-giá-hiện-trạng--khoảng-trống)
6. [Định hướng sản phẩm & Roadmap](#6-định-hướng-sản-phẩm--roadmap)
7. [Kế hoạch sprint tiếp theo](#7-kế-hoạch-sprint-tiếp-theo)
8. [Nhật ký cập nhật gần đây](#8-nhật-ký-cập-nhật-gần-đây)

### Bối cảnh quan trọng cần biết trước khi đọc

Toàn bộ 9 module hiện có (Xác thực & tài khoản, Onboarding & chia sẻ câu chuyện, Khám phá & tương tác, Dashboard cá nhân, Thư viện kiến thức, Thông báo, Feedback, Song ngữ, Settings) đều được xây dựng **chỉ ở tầng front-end**, chạy hoàn toàn trên trình duyệt của người dùng với dữ liệu lưu tại `localStorage`. Chưa có server, chưa có database thật, chưa có gửi email thật, chưa có AI thật cho avatar hay kiểm duyệt nội dung. Đây là quyết định có chủ đích trong giai đoạn hiện tại để đi nhanh và chốt trải nghiệm trước khi đầu tư vào hạ tầng backend — nhưng đồng nghĩa với việc **không có dữ liệu nào persist qua nhiều thiết bị, không có multi-user thật, và một số tính năng (ví dụ nhận thông báo khi người khác reaction) hiện đang được mô phỏng bằng chính hành vi của người dùng trên máy của họ**. Chi tiết đầy đủ ở mục 4 và 5.

---

## 1. Tổng quan dự án

### 1.1 Sản phẩm là gì

**Trạm Phát Sáng** là một không gian ảo ẩn danh, nơi người dùng viết ra một mảnh cảm xúc hoặc khoảnh khắc đang đè nặng trong lòng, rồi "thả" nó đi — dưới hình thức một **ngôi sao** bay lên **bầu trời**, hoặc một **bong bóng** chìm xuống **đại dương**. Những người dùng khác đi ngang qua không gian đó có thể chạm vào, đọc, và gửi lại một tia sáng ấm áp: một emoji, một cái ôm ảo, một món quà ẩn dụ, hoặc một lời động viên ngắn. Không ai biết danh tính thật của ai.

Nói ngắn gọn: đây là một **mạng xã hội ẩn danh dành cho cảm xúc**, được thiết kế có chủ đích để giảm áp lực phải "diễn" hay giữ hình ảnh — điều mà các mạng xã hội truyền thống (Facebook, Instagram, TikTok) vô tình khuếch đại.

### 1.2 Vấn đề đang giải quyết

Thế hệ Gen Z tại Việt Nam (và nhiều nơi khác) đang đối mặt với:

- Tỷ lệ lo âu, căng thẳng, cô đơn gia tăng, đặc biệt quanh áp lực học tập, thi cử, kỳ vọng gia đình, mạng xã hội.
- Rào cản tâm lý lớn khi tìm đến hỗ trợ chuyên môn (sợ bị đánh giá, sợ lộ danh tính, chi phí, định kiến xã hội về "đi khám tâm lý").
- Thiếu một không gian **trung gian, nhẹ nhàng** giữa "im lặng chịu đựng một mình" và "gặp chuyên gia tâm lý" — nơi họ có thể thử nói ra điều đang nghĩ, ở mức độ rủi ro thấp nhất (ẩn danh hoàn toàn, không ai trong đời thực biết).
- Các nền tảng ẩn danh hiện có (confession page, group kín...) thường thiếu cơ chế an toàn: dễ trở thành nơi bully, thiếu kiểm duyệt, không có hướng dẫn đến hỗ trợ chuyên môn khi cần.

Trạm Phát Sáng định vị mình vào đúng khoảng trống đó: **ẩn danh nhưng an toàn, nhẹ nhàng nhưng có trách nhiệm**.

### 1.3 Đối tượng người dùng mục tiêu

- **Chính**: Gen Z Việt Nam (khoảng 16–26 tuổi), đặc biệt học sinh cấp 3, sinh viên, người mới đi làm — nhóm chịu áp lực học tập/thi cử/định hướng nghề nghiệp và có xu hướng dùng ngôn ngữ, thẩm mỹ số hiện đại (dark mode, hiệu ứng chuyển động mượt, ngôn ngữ gần gũi).
- **Phụ**: bất kỳ ai cần một nơi giải toả cảm xúc ẩn danh, không giới hạn độ tuổi, nhưng trải nghiệm và ngôn ngữ sản phẩm hiện đang tối ưu cho nhóm chính ở trên.

### 1.4 Nguyên tắc thiết kế cốt lõi (không thương lượng)

1. **Ẩn danh là mặc định, không phải tuỳ chọn.** Ngay cả người dùng "Guest" (bỏ qua đăng nhập) cũng có một danh tính ẩn danh tự sinh (tên + icon trừu tượng), không bao giờ để trống hay lộ thông tin thật.
2. **Không có khuôn mặt người.** Avatar — kể cả avatar do AI tạo cho người dùng đã đăng ký — luôn là hình trừu tượng (quầng sáng, hoạ tiết), không bao giờ là gương mặt, để không ai có thể bị nhận diện qua avatar.
3. **Mỗi câu chuyện là một mảnh đời, không phải một "bài đăng".** Ngôn ngữ sản phẩm cố tình dùng từ "câu chuyện" thay vì "tin nhắn" hay "bài viết", để nhắc nhở người đọc rằng phía sau là một cảm xúc thật.
4. **An toàn trước, mượt mà sau.** Mọi nội dung có dấu hiệu nguy cơ cao (từ khoá liên quan tự hại/tự tử) đều được gắn cờ và hiển thị banner hotline ngay lập tức — không chặn người dùng, nhưng không im lặng bỏ qua.
5. **Không cho phản hồi bằng text tự do làm mặc định.** Để giảm nguy cơ bắt nạt/quấy rối, phản hồi mặc định luôn là các hình thức đã được kiểm soát trước (emoji, sticker, cái ôm ảo, món quà ẩn dụ, preset lời nhắn) — text tự do chỉ là lựa chọn phụ và luôn qua kiểm duyệt.
6. **Không ép người dùng phải chia sẻ mới được dùng app.** Người chưa sẵn sàng viết có thể chọn "chỉ lắng nghe thôi" và vẫn được trải nghiệm trọn vẹn không gian khám phá.

### 1.5 Mô hình sản phẩm

**Hai loại danh tính**
- **Guest** — bỏ qua đăng nhập, hệ thống tự sinh tên ẩn danh (ghép tính từ + danh từ liên quan sky/ocean) và icon trừu tượng ngẫu nhiên, không chỉnh sửa được tên.
- **Registered** — đăng nhập qua magic link (email), được tự đặt tên hiển thị và tuỳ chỉnh avatar AI trừu tượng theo "vibe" cảm xúc mình chọn.

**Hai không gian ẩn dụ**
- **Bầu trời (Sky)** — nơi thả **ngôi sao** (star), gắn với cảm giác "để ai đó ngước lên và thấy".
- **Đại dương (Ocean)** — nơi thả **bong bóng** (bubble), gắn với cảm giác "để nó trôi đi nhẹ nhàng".

**Bốn "vibe" cảm xúc (theme cá nhân hoá)**
Người dùng chọn một trong 4 vibe — **Ấm Áp (cozy)**, **Mơ Mộng (dreamy)**, **Công Nghệ (cyber)**, **Hoài Niệm (lofi)** — mỗi vibe đổi màu accent, hiệu ứng phát sáng và không khí thị giác xuyên suốt toàn app (badge, bầu trời, ánh sáng nền...). Đây vừa là công cụ cá nhân hoá, vừa là cách gợi ý viết theo đúng "tâm trạng thẩm mỹ" của người dùng.

**Vòng đời một câu chuyện**
```
Check-in cảm xúc → Viết (hoặc chọn "chỉ lắng nghe") → Chọn đích (sao/bong bóng, có thể đổi ý ngay lúc thả)
→ Nghi thức thả (vuốt lên = sao/bầu trời, vuốt xuống = bong bóng/đại dương — hướng kéo quyết định đích đến thật sự)
→ Xuất hiện trong không gian khám phá chung (sau kiểm duyệt cơ bản)
→ Người khác đọc, gửi tia sáng ấm áp (5 hình thức, có thể gửi nhiều lần) → warmth của câu chuyện tăng dần
```

**Hành trình người dùng end-to-end (trạng thái hiện tại)**
```
/ (redirect thông minh theo trạng thái)
 └─ /auth — đăng nhập magic link hoặc bỏ qua (Guest)
     └─ /profile-setup — chỉ Registered, tuỳ chỉnh tên + vibe + avatar AI
         └─ /checkin — chọn mood hiện tại (thang 1–10, 5 mốc cảm xúc), lời chào đổi theo thời điểm trong ngày
             └─ /write — hero cảm xúc theo mood, 2 lựa chọn:
                 ├─ "Mình muốn chia sẻ" → viết + chọn sao/bong bóng (gợi ý ban đầu) → /ritual → /explore
                 └─ "Chỉ lắng nghe thôi" → /explore (chế độ browse-only)
                     └─ /explore — không gian khám phá rộng (Sky/Ocean), có bản đồ thu nhỏ ở góc trái, đọc & phản hồi câu chuyện
                         ├─ /dashboard — Emotion Calendar + Insights cá nhân
                         ├─ /library — Thư viện kiến thức (bài viết, mẹo, bài tập, chia sẻ cộng đồng)
                         └─ /settings — tài khoản, thông báo, ngôn ngữ, âm thanh, vibe, feedback, giới thiệu
                             └─ /settings/feedback — form góp ý
```

### 1.6 Trạng thái hiện tại (tóm tắt 1 dòng)

**MVP front-end đầy đủ cho cả 9 module đã được lên kế hoạch, chạy được end-to-end trên trình duyệt với dữ liệu mock/localStorage; chưa có backend, chưa có real-time đa người dùng, chưa có AI thật.** Xem chi tiết đầy đủ ở mục 2.

---

## 2. Tiến độ & tính năng đã triển khai

### Bảng tổng hợp 9 module

| # | Module | Trạng thái Front-end | Cần Backend để hoàn thiện |
|---|--------|----------------------|---------------------------|
| 1 | Xác thực & tài khoản người dùng | ✅ Hoàn chỉnh | Có — Supabase Auth thật, bảng `anonymous_users` |
| 2 | Onboarding & chia sẻ câu chuyện | ✅ Hoàn chỉnh | Có — lưu story vào DB thay vì localStorage |
| 3 | Khám phá & tương tác | ✅ Hoàn chỉnh, đã redesign nhiều vòng | Có — multi-user thật, real-time reaction |
| 4 | Dashboard cá nhân | ✅ Hoàn chỉnh | Nhẹ — chỉ cần sync dữ liệu lên server |
| 5 | Thư viện kiến thức | ✅ Hoàn chỉnh (nội dung mock) | Có — CMS thật, nội dung do chuyên gia duyệt |
| 6 | Thông báo | ✅ UI + logic mô phỏng hoàn chỉnh | Có — real-time + email service thật |
| 7 | Feedback người dùng | ✅ Hoàn chỉnh (lưu local) | Có — bảng `feedback` + admin dashboard |
| 8 | Song ngữ Anh–Việt | 🟡 Một phần (hạ tầng xong, chưa phủ hết UI) | Không cần backend, cần thêm công sức dịch thuật |
| 9 | Settings & hệ thống | ✅ Hoàn chỉnh | Nhẹ — đồng bộ preference lên profile server |

Chú thích: "✅ Hoàn chỉnh" nghĩa là toàn bộ luồng UI/UX và logic tương tác đã hoạt động đầy đủ trên front-end với dữ liệu mock — không có nghĩa là sẵn sàng chịu tải nhiều người dùng thật hay đã qua kiểm thử bảo mật.

### Module 1 — Xác thực & tài khoản người dùng

**Đã làm:**
- Hai loại danh tính tách biệt rõ ràng trong hệ thống kiểu dữ liệu: `GuestIdentity` (tên tự sinh, không sửa được) và `UserProfile` (tên tuỳ chỉnh, gắn `userId`, có avatar AI).
- Đăng nhập bằng magic link mô phỏng (nhập email → giả lập gửi link → xác nhận → tạo phiên đăng nhập), email được che một phần khi hiển thị (`ngu***@gmail.com`).
- Màn `/profile-setup`: sau khi đăng nhập lần đầu, hướng dẫn chọn vibe, nhập gợi ý ngắn (tối đa 60 ký tự) để "AI" sinh avatar trừu tượng không khuôn mặt.
- Avatar AI hiện tại là **thuật toán sinh hình thủ tục** (procedural, dùng PRNG có seed từ chuỗi văn bản) — không gọi API AI thật, nhưng đã tách lớp rõ ràng (`lib/avatar.ts`) để sau này thay bằng API AI thật mà không cần đổi giao diện.
- Đồng bộ danh tính hai chiều với trạng thái đăng nhập: đăng xuất tự quay về Guest, đăng nhập tự tạo `UserProfile` mới (giữ lại vibe đang dùng).

**Giới hạn hiện tại:** hoàn toàn không có backend — "gửi magic link" chỉ là mô phỏng bằng `setTimeout`, không có email thật nào được gửi đi; phiên đăng nhập chỉ tồn tại trong `localStorage` của trình duyệt đó.

### Module 2 — Onboarding & chia sẻ câu chuyện

**Đã làm:**
- Đổi toàn bộ ngôn ngữ sản phẩm từ "signal/thông điệp" sang "câu chuyện" (Story), với metadata đầy đủ: `id, type, content, moodAtRelease, warmth, reactionCount, createdAt, author (ẩn danh)`.
- Thiết kế lại `/write` thành 2 pha để giảm áp lực phải viết ngay:
  - **Pha Hero cảm xúc** — minh hoạ + lời mời thay đổi theo mood vừa check-in (3 tầng: nặng/trung tính/nhẹ), cùng 2 lựa chọn rõ ràng: "Mình muốn chia sẻ" hoặc "Hôm nay mình chỉ muốn lắng nghe".
  - **Pha viết** — chỉ mở ra khi chọn chia sẻ: gợi ý viết xoay vòng theo mood, không hiển thị counter ký tự quá to (chỉ hiện khi gần hết chữ), có hiệu ứng "ăn mừng nhỏ" (micro-celebration) khi bắt đầu gõ chữ đầu tiên để khích lệ hành vi chia sẻ.
- **Chế độ "chỉ lắng nghe" (browse-only)**: chọn lắng nghe sẽ đưa thẳng vào `/explore?from=listen`, hiển thị badge nhỏ báo đang ở chế độ này; nút "Chia sẻ tâm sự" ở explore sẽ đưa quay lại `/write` để hoàn tất chia sẻ khi họ đổi ý.
- **Nghi thức thả (`/ritual`) — đã nâng cấp thành cử chỉ HAI CHIỀU**: ban đầu chọn sao/bong bóng ở `/write` chỉ còn là "gợi ý mặc định"; tại `/ritual`, hướng vuốt tay thật sự lúc buông tay mới quyết định kết quả cuối — **vuốt lên luôn hoá thành sao bay lên bầu trời, vuốt xuống luôn hoá thành bong bóng chìm xuống đại dương**, bất kể lựa chọn ban đầu. Màu quả cầu đổi màu ngay theo hướng đang kéo (phản hồi trực quan trước khi buông tay), nền cảnh cũng chuyển đúng không gian sau khi thả xong. Kèm hiệu ứng particle bay, âm thanh hợp âm trị liệu tổng hợp bằng Web Audio API (đổi giai điệu theo mood).
- Kiểm duyệt cơ bản: bộ lọc từ khoá nguy cơ cao (liên quan tự hại/tự tử) — nội dung bị gắn cờ sẽ chuyển trạng thái `pending_review` (tạm ẩn khỏi không gian chung) và hiển thị banner hotline ngay tại chỗ, không chặn thao tác của người dùng.

**Giới hạn hiện tại:** kiểm duyệt chỉ là so khớp từ khoá tiếng Việt rất ngắn — không phải AI phân loại ngữ nghĩa, dễ bị lách qua hoặc báo sai (false positive/negative).

### Module 3 — Khám phá & tương tác (`/explore`)

**Đã làm:**
- Đọc câu chuyện qua bottom sheet "Story Detail": nội dung, thời gian tương đối, nhãn "warmth" định tính (không hiện số thô để tránh áp lực so sánh), và **badge danh tính ẩn danh của tác giả**.
- **5 hình thức phản hồi**: Cảm xúc nhanh (💙🌱✨🌈, gửi ngay không cần xác nhận), Sticker (7 mẫu, hiệu ứng bay lên), Ôm ảo (virtual hug, hiệu ứng vòng sóng lan toả), Món quà ẩn dụ (tăng warmth), Lời nhắn (8 preset + tuỳ chọn viết thêm tối đa 300 ký tự, qua kiểm duyệt).
- **Một người dùng có thể gửi NHIỀU tia sáng/lời nhắn tới cùng một câu chuyện** — đã bỏ giới hạn "chỉ gửi được 1 lần/story" trước đây; màn "đã gửi" có nút "Gửi thêm một tia sáng nữa" để gửi tiếp ngay. Giới hạn an toàn duy nhất còn lại là **tổng số lượt gửi trong một ngày** (chống spam trên diện rộng, không phải theo từng story riêng lẻ).
- 4/5 hình thức phản hồi **không có ô nhập text tự do**; text tự chọn ở "Lời nhắn" luôn chạy qua bộ kiểm duyệt.
- **Gợi ý phản hồi theo mood**: nếu câu chuyện có mood thấp lúc thả, hệ thống gợi ý nhẹ "một cái ôm có thể ấm hơn lời khuyên".
- **Chỉ số "mood cộng đồng" tổng hợp ẩn danh**: hiển thị biểu tượng ☁️/⛅/☀️ phản ánh mood trung bình của các câu chuyện đang hiện trong không gian.
- **Không gian khám phá đã được redesign toàn diện** (xem chi tiết mục 8 — Nhật ký cập nhật):
  - Không gian ảo rộng gấp nhiều lần khung nhìn (700%, trước là 300%), với **34 ngôi sao + 34 bong bóng** mock trải đều khắp mọi góc (trước chỉ có 8 mỗi loại, dễ tạo cảm giác trống trải).
  - Sửa lỗi hiệu năng/lag nghiêm trọng: bỏ ~90 phép biến đổi (transform) gắn riêng lẻ theo từng hạt bụi/từng câu chuyện (nguyên nhân gây giật và hiện tượng orb "tự xoay"), thay bằng 2 lớp parallax dùng chung transform.
  - Thêm lại **bản đồ thu nhỏ (SpaceMap)** ở góc trái màn hình, luôn hiển thị: hiện đúng vị trí mọi câu chuyện thật đang có, khung camera cho biết đang xem vùng nào, bấm vào bất kỳ đâu trên bản đồ (một chấm hay một vùng trống) đều lướt camera chính xác tới đúng nơi đó trong không gian thật. Câu chuyện càng nhận nhiều tia sáng/khích lệ thì chấm trên bản đồ càng to, càng sáng, có quầng nhấp nháy riêng.
  - Thêm vignette làm tối nhẹ các góc để tăng cảm giác bí ẩn, mời gọi khám phá.

**Chưa làm (có chủ đích, để Phase 2+):** ghép cặp "mood buddy" ẩn danh giữa 2 người có pattern cảm xúc tương đồng — cần nghiên cứu đạo đức & consent trước khi triển khai.

### Module 4 — Dashboard cá nhân (`/dashboard`, thay thế `/history` cũ)

**Đã làm:**
- **Emotion Calendar 3 chế độ xem**: Tuần (heatmap 7 cột + mood trung bình/ngày), Tháng (lưới lịch tô màu theo thang mood 1–10, chấm nhỏ báo ngày có câu chuyện), Năm (12 tháng + đường xu hướng).
- **Insights cá nhân hoá**: chuỗi check-in trong tuần, so sánh mood trung bình tháng này với tháng trước (diễn giải bằng lời).
- **Gợi ý hành động nhẹ**: bài tập hít thở 4-7-8 có animation dẫn nhịp thật, gợi ý viết nhật ký, gợi ý ghé thăm không gian khám phá.
- **Tích hợp Thư viện (Module 5)**: gợi ý 1–2 bài viết theo mood pattern gần đây.
- Giữ lại danh sách đầy đủ các câu chuyện đã thả ở cuối trang; `/history` cũ redirect tự động sang `/dashboard`.

### Module 5 — Thư viện kiến thức (`/library`)

**Đã làm:**
- Cấu trúc 4 nhóm nội dung: 📖 Bài viết chuyên gia, 💡 Mẹo cải thiện tâm trạng, 🧘 Bài tập/guided exercises, 🌱 Chia sẻ cộng đồng (đã qua biên tập/kiểm duyệt, không phải đăng tải tự do).
- 10 bài viết mock đầy đủ metadata: title, excerpt, cover, category, tags, mood tags, reading time, tác giả kèm học hàm/chứng chỉ giả định.
- Song ngữ có cơ chế fallback: bài chưa có bản Anh tự động hiển thị bản Việt kèm ghi chú.
- Trang danh sách có filter theo category/mood tag/từ khoá; trang chi tiết gợi ý bài liên quan.
- Tích hợp 2 chiều với Dashboard và luồng thả câu chuyện (gợi ý bài sau khi thả story mood thấp).

**Giới hạn hiện tại:** toàn bộ nội dung là văn bản mẫu minh hoạ cấu trúc — **chưa được chuyên gia tâm lý thật review**, không nên dùng làm nội dung thật khi ra mắt sản phẩm.

### Module 6 — Thông báo (Notifications)

**Đã làm:**
- Bell icon + notification center dạng dropdown, nhóm theo Hôm nay/Tuần này/Trước đó, badge đếm số chưa đọc.
- Đủ 6 loại thông báo: reaction/ôm/quà nhận được, story đạt warmth milestone, gợi ý check-in hàng ngày, bài viết mới phù hợp mood, cảnh báo hotline hệ thống, cập nhật sản phẩm.
- **Cầu nối sự kiện thật** (`NotificationEventsBridge`): thông báo reaction được kích hoạt trung thực khi chính câu chuyện của người dùng nhận thêm reaction trong phiên hiện tại — không giả lập số liệu tuỳ tiện.
- Settings cho phép bật/tắt từng loại thông báo (in-app/email riêng) + chọn tần suất email.

**Giới hạn hiện tại:** không có real-time thật, không có email thật — mọi thứ chạy trong phiên trình duyệt hiện tại.

### Module 7 — Feedback từ người dùng

**Đã làm:**
- Form góp ý tại `/settings/feedback`: category, đánh giá sao 1–5, nội dung text, đính kèm ảnh chụp màn hình, tự động gắn context (trang trước đó, mood gần nhất, phiên bản app, loại thiết bị).
- Gentle prompt sau milestone: banner nhỏ ở Dashboard sau khi thả câu chuyện đầu tiên hoặc sau 7 ngày dùng app.

**Giới hạn hiện tại:** dữ liệu feedback lưu trong `localStorage` — chưa có bảng `feedback` thật, chưa có admin dashboard.

### Module 8 — Song ngữ Anh–Việt

**Đã làm:** hạ tầng i18n thật (`LanguageContext` + `lib/i18n.ts` với fallback tự động về tiếng Việt), áp dụng đầy đủ cho Thư viện, Thông báo, Settings, Feedback, và preset phản hồi/reaction nhanh.

**Chưa làm:** các màn hình lớn có từ trước (Check-in, Write, Explore, Ritual, Dashboard) vẫn hoàn toàn hardcode tiếng Việt, chưa vào hệ thống i18n — cần một sprint riêng để dịch và refactor.

### Module 9 — Settings & hệ thống (`/settings`)

**Đã làm:** đầy đủ Account, Notifications, Language, Sound, Vibe/Theme, Feedback, About (Mission, Privacy Policy, Terms, Hotline), Version, Logout/Reset session.

**Chưa làm:** bottom navigation Explore | Dashboard | Library | Settings (optional Phase 2 theo spec gốc).

---

## 3. Design System

### 3.1 Triết lý thiết kế

Ngôn ngữ thị giác của Trạm Phát Sáng xoay quanh 3 ý niệm: **vũ trụ ban đêm**, **đại dương sâu**, và **ánh sáng ấm**. Toàn bộ giao diện dùng nền tối (dark mode mặc định và duy nhất hiện tại) để tạo cảm giác riêng tư, an toàn, giảm cảm giác "phơi bày".

### 3.2 Bảng màu

**Hệ Bầu trời (Sky)**

| Token | Hex | Vai trò |
|---|---|---|
| `sky-navy` | `#0B1026` | Nền tối nhất |
| `sky-indigo` | `#1B2A4A` | Nền phụ |
| `sky-violet` | `#3A2E5C` | Gradient, nút active |
| `sky-aurora` | `#7C9EFF` | Accent chính |
| `sky-gold` | `#F5D67D` | Accent cho "sao" |
| `sky-glow` | `#FFF3D0` | Điểm sáng, highlight |

**Hệ Đại dương (Ocean)**

| Token | Hex | Vai trò |
|---|---|---|
| `ocean-deep` | `#072034` | Nền tối nhất |
| `ocean-teal` | `#0E4D5C` | Nền phụ |
| `ocean-aqua` | `#4FD1C5` | Accent chính |
| `ocean-bubble` | `#E8FBFF` | Điểm sáng bong bóng |
| `ocean-foam` | `#B8E9E0` | Chi tiết bọt biển |

**Bốn Vibe cá nhân hoá**

| Vibe | Accent | Cảm giác |
|---|---|---|
| Ấm Áp (`cozy`) | `#E8A47A` / `#FFB4A2` | Góc cafe khuya, cam ấm dịu |
| Mơ Mộng (`dreamy`) | `#C084FC` / `#B388FF` | Đêm trăng tím, ngân hà |
| Công Nghệ (`cyber`) | `#22D3EE` / `#00E5FF` | Neon cyan sắc bén |
| Hoài Niệm (`lofi`) | `#FBBF24` / `#FF8A80` | Amber hoài cổ, cassette cũ |

Vibe đang chọn được set qua thuộc tính `data-vibe` trên `<html>` (đồng bộ bởi `VibeSync`), điều khiển CSS custom property `--vibe-accent`, `--vibe-glow`, `--vibe-glow-subtle`, `--vibe-sky-tint`, `--vibe-badge-border` — đổi vibe không cần đổi component nào.

**Neutral / nền UI**: `base-bg #060A13` · `base-surface #101626` · `base-text-primary #F5F6FA` · `base-text-secondary #A8B0C3` · `base-divider #1E2638`

**Semantic**: `warm #FFB4A2` · `success #8FD8B8` · `caution #E8C468` (banner hotline) · `critical #E76F6F`

**Neon accents**: `neon-pink #FF6EFF` · `neon-blue #4FC3F7` · `neon-green #69FF97` · `neon-purple #B388FF` · `neon-gold #FFD700` — dùng tiết chế cho hiệu ứng đặc biệt.

### 3.3 Typography

| Vai trò | Font | Dùng cho |
|---|---|---|
| Display | Plus Jakarta Sans (600–800) | Tiêu đề, hero copy |
| Body | Nunito (400–700) | Nội dung, đoạn văn |
| Caption | Nunito | Metadata, nhãn phụ |

Font load qua Google Fonts link trực tiếp trong `<head>` (không dùng `next/font/google`) — **cần chuyển sang `next/font` khi có điều kiện mạng ổn định**, vì cách hiện tại không tối ưu performance/CLS.

### 3.4 Bo góc & khoảng cách

`rounded-card: 20px` · `rounded-sheet: 28px` · khoảng cách tuỳ biến thêm `4.5 = 18px`.

### 3.5 Chuyển động (Animation)

Framer Motion là thư viện chính, kết hợp keyframes CSS tuỳ biến trong Tailwind config cho hiệu ứng lặp (ambient):

- **Ambient/nền**: `twinkle`, `float`, `drift-x`, `rise-fade`, `breathe`, `shooting-star`, `nebula-drift`, `orb-float`, `pulse-ring`.
- **Tương tác/feedback**: `slide-up`, `slide-up-sm`, `fade-in-blur`, `fade-in`, `scale-in`, `bounce-soft`, `ripple`, `count-up`, `star-burst`, `letter-pop`, `glow-pulse`.
- **Shimmer**: hiệu ứng ánh sáng lướt qua nút CTA chính.
- **Timing tuỳ biến**: `gentle-float`, `sheet`, `spring`.

Nguyên tắc: **không có hiệu ứng nào mang tính thúc giục hay tạo áp lực thời gian**. Riêng khu vực kéo-thả không gian khám phá (`/explore`) đã được tối ưu để tránh dùng quá nhiều transform riêng lẻ cùng lúc — xem mục 8 để biết chi tiết bản sửa lỗi hiệu năng.

### 3.6 Thư viện Component đã xây dựng

| Component | Vị trí | Vai trò |
|---|---|---|
| `Button` | `components/ui/Button.tsx` | Nút CTA dùng chung |
| `BottomSheet` | `components/ui/BottomSheet.tsx` | Sheet trượt lên, dùng cho Story Detail |
| `HotlineBanner` | `components/ui/HotlineBanner.tsx` | Banner cảnh báo/hotline dùng chung |
| `ToastGentle` | `components/ui/ToastGentle.tsx` | Thông báo nhỏ, tự biến mất |
| `AIAvatarOrb` | `components/onboarding/AIAvatarOrb.tsx` | Avatar trừu tượng SVG theo seed + vibe |
| `AnonymousIdentityBadge` | `components/onboarding/AnonymousIdentityBadge.tsx` | Badge danh tính + panel chọn vibe |
| `MoodSlider` | `components/onboarding/MoodSlider.tsx` | Chọn mức cảm xúc 1–10 (5 mốc) |
| `VibeSync` | `components/onboarding/VibeSync.tsx` | Đồng bộ `data-vibe` lên `<html>` |
| `SkyCanvas` / `OceanCanvas` | `components/canvas/` | Nền không gian 2 hệ, hiệu ứng ambient |
| `SignalOrb` | `components/canvas/SignalOrb.tsx` | Hình đại diện 1 câu chuyện trong không gian |
| `SpaceMap` | `components/explore/SpaceMap.tsx` | **Mới** — bản đồ thu nhỏ góc trái `/explore`, đồng bộ vị trí thật, bấm để lướt camera |
| `ReleaseGesture` | `components/release/ReleaseGesture.tsx` | Nghi thức vuốt để thả (hai chiều), vẽ particle bằng Canvas API |
| `ReactionPicker` | `components/explore/ReactionPicker.tsx` | 8 preset lời nhắn |
| `SignalCard` | `components/explore/SignalCard.tsx` | Story Detail: nội dung + 5 hình thức phản hồi, có thể gửi nhiều lần |
| `NotificationBell` | `components/notifications/NotificationBell.tsx` | Bell icon + notification center |
| `NotificationEventsBridge` | `components/notifications/NotificationEventsBridge.tsx` | Cầu nối sự kiện thật → thông báo |
| `FeedbackNudge` | `components/feedback/FeedbackNudge.tsx` | Banner gợi ý feedback sau milestone |

### 3.7 Iconography

Toàn bộ icon dùng bộ **lucide-react** (outline, bo tròn, nhất quán độ dày nét). Kích thước phổ biến: 11–16px cho label/metadata, 18–24px cho icon chính trong nút/card.

### 3.8 Giọng văn & tông sản phẩm (Tone of Voice)

- Xưng hô: "mình – cậu/bạn", thân mật nhưng không suồng sã.
- Không bao giờ dùng ngôn ngữ mệnh lệnh hoặc phán xét. Luôn ưu tiên câu gợi mở, đồng cảm.
- Placeholder và microcopy luôn "ấm" thay vì khô khan mang tính hệ thống.
- Emoji dùng có chủ đích và tiết chế.
- Từ vựng đặc trưng cần giữ nhất quán: **câu chuyện** (không phải "bài đăng"), **thả** (không phải "đăng"), **tia sáng ấm áp** (không phải "like"), **không gian** (không phải "kênh"), **warmth** (không phải "lượt tương tác").

### 3.9 Khoảng trống về Design System cần lưu ý

- Chưa có **light mode**.
- Chưa có tài liệu Figma/design token chính thức tách biệt khỏi code — toàn bộ token hiện "sống" trong `tailwind.config.ts` và `globals.css`.
- Chưa có bộ quy tắc accessibility chính thức — nền tối + chữ nhỏ (10–11px nhiều nơi) có rủi ro về khả năng đọc, cần audit riêng (xem mục 5).

---

## 4. Kiến trúc kỹ thuật

### 4.1 Tech stack

| Lớp | Công nghệ | Phiên bản |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.35 |
| UI Library | React | 18.3.1 |
| Ngôn ngữ | TypeScript | 5.5.4 |
| Styling | Tailwind CSS | 3.4.7 |
| Animation | Framer Motion | 11.3.19 |
| Icon | lucide-react | 0.417.0 |
| Utility class | clsx | 2.1.1 |
| Âm thanh | Web Audio API (native) | — |

**Chưa có:** backend framework, database, ORM, service kiểm duyệt AI, dịch vụ email, hệ thống test tự động, CI/CD pipeline.

### 4.2 Cấu trúc thư mục

```
app/                        # Next.js App Router — mỗi thư mục con = 1 route
  page.tsx                  # Root — điều hướng thông minh theo trạng thái
  auth/                     # Đăng nhập magic link / Guest
  profile-setup/            # Tuỳ chỉnh hồ sơ sau đăng nhập (Module 1.2)
  checkin/                  # Chọn mood — có lời chào theo thời điểm trong ngày
  write/                    # Viết câu chuyện (dual CTA — Module 2.2)
  ritual/                   # Nghi thức thả câu chuyện — cử chỉ 2 chiều
  explore/                  # Không gian khám phá (Module 3) — có SpaceMap
  dashboard/                # Personal dashboard (Module 4)
  history/                  # Redirect tương thích ngược → /dashboard
  library/                  # Thư viện kiến thức (Module 5)
    [slug]/                 # Trang chi tiết bài viết
  settings/                 # Cài đặt (Module 9)
    feedback/                # Form góp ý (Module 7)
  globals.css               # Design tokens dạng CSS variable + utility class
  layout.tsx                # Bọc toàn bộ Context Provider

components/
  canvas/                   # SkyCanvas, OceanCanvas, SignalOrb — không gian ảo
  release/                  # ReleaseGesture — nghi thức thả (2 chiều)
  explore/                  # ReactionPicker, SignalCard, SpaceMap — đọc & phản hồi & bản đồ
  onboarding/               # Badge danh tính, avatar, mood slider, vibe sync
  notifications/            # NotificationBell, NotificationEventsBridge
  feedback/                 # FeedbackNudge
  ui/                       # Button, BottomSheet, HotlineBanner, ToastGentle

context/                    # State toàn cục, mỗi Context = 1 React Provider
  AuthContext.tsx            # Phiên đăng nhập (mô phỏng)
  AppStateContext.tsx         # Identity, mood, story, reaction — "trái tim" state
  LanguageContext.tsx          # Ngôn ngữ vi/en
  NotificationContext.tsx      # Thông báo + cài đặt thông báo

lib/                        # Logic thuần, không phụ thuộc React
  identity.ts                # Sinh danh tính Guest/User, màu vibe
  avatar.ts                  # Sinh avatar trừu tượng thủ tục (procedural)
  mockSignals.ts              # Định nghĩa Story + dữ liệu mẫu (34 sao + 34 bong bóng, sinh có seed cố định)
  moderation.ts               # Kiểm duyệt từ khoá cơ bản
  libraryContent.ts            # Nội dung Thư viện kiến thức
  i18n.ts                     # Từ điển song ngữ + hàm translate()
  sound.ts                    # Tổng hợp âm thanh trị liệu (Web Audio API)
  version.ts                  # Hằng số version app
  presets.ts                  # ⚠️ File cũ, không còn dùng (xem mục 5)
```

### 4.3 Quản lý State — 4 React Context

Ứng dụng **không dùng Redux/Zustand** — toàn bộ state toàn cục nằm trong 4 Context lồng nhau tại `app/layout.tsx`:

```
<LanguageProvider>
  <AuthProvider>
    <AppStateProvider>
      <NotificationProvider>
        <VibeSync />
        <NotificationEventsBridge />
        {children}
      </NotificationProvider>
    </AppStateProvider>
  </AuthProvider>
</LanguageProvider>
```

| Context | Chịu trách nhiệm | Key localStorage |
|---|---|---|
| `AuthContext` | Phiên đăng nhập mô phỏng (email, masked email, pending magic link) | `tram-phat-sang:auth` |
| `AppStateContext` | Identity, vibe, mood/mood history, draft đang viết, toàn bộ story, reaction, giới hạn reaction/ngày, mốc thời gian mở app lần đầu | `tram-phat-sang:v2` + `tram-phat-sang:all-signals` |
| `LanguageContext` | Ngôn ngữ hiện tại + hàm `t()` tra cứu từ điển | `tram-phat-sang:lang` |
| `NotificationContext` | Danh sách thông báo + cài đặt bật/tắt theo loại | `tram-phat-sang:notifications` |

Ngoài ra: `tram-phat-sang:feedback-nudge-dismissed`, `tram-phat-sang:feedback-submissions`.

**Nguyên tắc migration dữ liệu cũ**: mỗi khi cấu trúc dữ liệu đổi, code đều có hàm `migrateXxx()` đọc dữ liệu `localStorage` cũ dưới dạng `unknown`, tự bổ sung field còn thiếu với giá trị mặc định an toàn.

**Ghi chú kỹ thuật quan trọng — `releaseDraft(overrideType?)`**: từ khi `/ritual` chuyển sang cử chỉ 2 chiều, hàm `releaseDraft` trong `AppStateContext` nhận thêm tham số `overrideType` tuỳ chọn — cho phép hướng kéo thật sự lúc thả (star/bubble) ghi đè lựa chọn ban đầu ở draft, đảm bảo câu chuyện được lưu đúng loại mà người dùng thực sự chọn ở bước cuối cùng.

### 4.4 Các mô hình dữ liệu chính (rút gọn)

```ts
// Danh tính
type Identity = GuestIdentity | UserProfile;
interface GuestIdentity { kind: "guest"; name: string; icon: IdentityIcon; vibe: IdentityVibe }
interface UserProfile { kind: "user"; userId: string; displayName: string; avatarSeed: string; avatarPrompt?: string; vibe: IdentityVibe }

// Câu chuyện
interface Story {
  id: string; type: "star" | "bubble"; content: string;
  x: number; y: number; size: "sm" | "md" | "lg";
  warmth: "few" | "some" | "many"; reactionCount: number;
  moodAtRelease: number | null; createdAt: number; createdAgo: string;
  status: "visible" | "pending_review";
  author: { name: string; vibe: IdentityVibe; icon?: IdentityIcon };
}

// Phản hồi — không còn giới hạn 1 lần/story, chỉ còn trần tổng số/ngày
type ReactionKind = "emotion" | "sticker" | "hug" | "gift" | "message";

// Thông báo
type NotificationType = "reaction" | "milestone" | "checkin-reminder"
  | "article-suggestion" | "hotline" | "product-update";

// Bài viết Thư viện
interface LibraryArticle {
  slug: string; category: ArticleCategory; tags: string[]; moodTags: MoodTag[];
  readingTimeMinutes: number; author: { name: string; credentials: string };
  coverGradient: string; coverEmoji: string;
  vi: ArticleTranslation; en?: ArticleTranslation; // en optional — fallback về vi
}
```

### 4.5 Đặc điểm kiến trúc quan trọng cần backend team lưu ý

1. **100% client-side, không SSR data thật.** Mọi trang đều là Client Component (`"use client"`).
2. **Không có real-time đa người dùng.** "Reaction" hiển thị trong thông báo hiện được kích hoạt bởi chính hành vi của người dùng trên máy của họ — mô phỏng có chủ đích, cần thay bằng WebSocket/Supabase Realtime khi có backend.
3. **`releaseDraft()` và `sendReaction()` trong `AppStateContext` chính là 2 điểm nối quan trọng nhất** khi tích hợp API thật.
4. **Namespace localStorage đã tính trước migration** (`STORAGE_KEY = "tram-phat-sang:v2"`), nhưng chưa có cơ chế đồng bộ lên server có consent người dùng.
5. **Giới hạn build trong môi trường phát triển hiện tại**: `next build` từng bị treo do xung đột file lock với `next dev` chạy song song — công cụ xác minh đang dùng chủ yếu là `tsc --noEmit`/kiểm tra cú pháp trực tiếp qua TypeScript compiler API. **Cần chạy `next build` đầy đủ một lần trên môi trường CI sạch trước khi triển khai thật.**

### 4.6 Kiểm duyệt & an toàn nội dung (chi tiết kỹ thuật)

`lib/moderation.ts` hiện là danh sách khoảng 6 từ khoá tiếng Việt liên quan tự hại/tự tử, so khớp bằng `includes()` sau khi hạ thường. Đây là **giải pháp minh hoạ cho MVP**, cần thay bằng dịch vụ phân loại chuyên dụng (xem mục 5).

### 4.7 Âm thanh trị liệu

`lib/sound.ts` tổng hợp âm thanh hoàn toàn bằng Web Audio API (oscillator + lowpass filter + envelope gain) — không cần file âm thanh nào, giai điệu chọn theo giá trị mood hiện tại.

### 4.8 Kiến trúc không gian khám phá (`/explore`) — chi tiết bổ sung

Vì đây là phần phức tạp và đã trải qua nhiều vòng chỉnh sửa, ghi chú riêng để dev sau dễ tra cứu:

- **Toạ độ câu chuyện** (`Story.x`, `Story.y`) là phần trăm (0–100) tuyệt đối trong "thế giới ảo" — container có kích thước `700%` khung nhìn (`WORLD_SCALE = 7`), không đổi theo màn hình.
- **Vị trí camera** được điều khiển bởi 2 motion value `dragX`/`dragY` (Framer Motion), gắn trực tiếp vào container kéo-thả — không dùng spring cho chính khung kéo (để bám tay 1:1, tránh lag), chỉ dùng spring riêng, nhẹ cho 2 lớp bụi nền trang trí.
- **Công thức camera ⇄ world** (quan trọng, từng có bug): vì thế giới lớn hơn khung nhìn nhiều lần, không thể coi `dragX=0` là "đang ở giữa thế giới". Công thức đúng: điểm đang ở giữa khung nhìn (tính theo % thế giới) = `(viewportPx/2 − dragX) / worldPx × 100`. Phép nghịch đảo của công thức này được dùng để "lướt tới" (`panTo`) khi bấm vào bản đồ. Toàn bộ logic này nằm trong `components/explore/SpaceMap.tsx`.
- **Căn giữa lúc mở app**: ngay lần đo kích thước khung nhìn đầu tiên (qua `ResizeObserver`), `dragX`/`dragY` được set về đúng giá trị giúp world hiển thị đúng điểm 50% (giữa không gian) tại khung nhìn — chỉ làm một lần duy nhất (`hasCenteredRef`), không ghi đè vị trí người dùng đang xem khi resize sau đó.
- **Hiệu năng**: bụi nền trang trí chỉ dùng 2 lớp (xa/gần), mỗi lớp 1 phép biến đổi transform dùng chung cho toàn lớp — thay vì tính riêng cho từng hạt/từng câu chuyện như bản đầu (nguyên nhân từng gây lag nặng và hiện tượng orb tự xoay).

---

## 5. Đánh giá hiện trạng & khoảng trống

### 5.1 Điểm mạnh hiện tại

- **Tầm nhìn sản phẩm rõ ràng và nhất quán** — mọi tính năng đều bắt nguồn từ một triết lý an toàn/ẩn danh xuyên suốt.
- **Trải nghiệm người dùng đã được nghĩ kỹ ở các điểm ma sát quan trọng**: không ép viết ngay, không hiện số liệu thô gây áp lực so sánh, banner hotline không chặn thao tác.
- **Kiến trúc code sạch, có kỷ luật migration** — mỗi lần đổi cấu trúc dữ liệu đều có hàm chuyển đổi tương thích ngược.
- **Toàn bộ 9 module đã có luồng UI hoàn chỉnh, chạy được thật** — MVP click-through đầy đủ, có thể dùng để test người dùng thật ngay cả khi chưa có backend.
- **Không gian khám phá đã qua nhiều vòng tinh chỉnh dựa trên phản hồi thực tế** (hiệu năng, bản đồ, độ rộng không gian, độ chính xác điều hướng) — cho thấy quy trình lặp nhanh theo phản hồi người dùng đang hoạt động tốt.

### 5.2 Rủi ro & khoảng trống cần giải quyết trước khi ra mắt thật

#### 5.2.1 Rủi ro an toàn nội dung (mức độ: **cao**, vì đây là app sức khoẻ tinh thần)

- **Kiểm duyệt hiện tại chỉ là 6 từ khoá tiếng Việt so khớp chuỗi.** Dễ bị lách và cũng dễ báo sai (ví dụ một câu chuyện nhắc "tự tử" trong ngữ cảnh tích cực vẫn bị gắn cờ). Cần thay bằng dịch vụ phân loại AI chuyên dụng hoặc tối thiểu một danh sách từ khoá được chuyên gia tâm lý xây dựng.
- **Chưa có con người thật đứng sau nút "gọi hotline".** Banner hotline hiện dẫn tới số 111 (Tổng đài Quốc gia Bảo vệ Trẻ em) — số thật nhưng **chưa được xác nhận lại với đơn vị vận hành**, và có thể không phù hợp với mọi độ tuổi người dùng mục tiêu (16–26).
- **Nội dung Thư viện kiến thức (Module 5) chưa qua thẩm định chuyên môn** — không nên dùng làm nội dung thật khi ra mắt.
- **Chưa có quy trình con người (moderation team workflow) cho nội dung `pending_review`.**

#### 5.2.2 Rủi ro kỹ thuật & hạ tầng

- **Không có backend đồng nghĩa không có dữ liệu nào an toàn trước việc xoá cache/đổi thiết bị.**
- **Giới hạn chống spam (trần lượt gửi/ngày) chỉ thực thi ở client** — ai chỉnh sửa localStorage hoặc dùng nhiều tab/thiết bị đều bypass được.
- **Chưa có test tự động (unit/integration/e2e).** Xác minh hiện tại chủ yếu dựa vào kiểm tra kiểu dữ liệu TypeScript — không phát hiện được lỗi logic runtime, lỗi UI, hay regression khi refactor.
- **Chưa từng chạy `next build` thành công trong môi trường phát triển hiện tại** — rủi ro có lỗi ẩn chỉ lộ ra lúc build production. **Cần chạy build đầy đủ trên máy/CI sạch trước khi deploy lần đầu.**
- **Không có CI/CD, không có staging environment.**
- **`lib/presets.ts` là file cũ còn sót lại, không còn được import ở đâu** — nên xoá để tránh nhầm lẫn.
- **Ảnh cover bài viết Thư viện hiện là CSS gradient placeholder, chưa có ảnh thật.**
- **Feedback đính kèm ảnh chụp màn hình được lưu dạng base64 thẳng trong `localStorage`** — dễ chạm giới hạn dung lượng localStorage.

#### 5.2.3 Rủi ro trải nghiệm & khả năng tiếp cận (accessibility)

- Nhiều chữ trong UI có kích thước rất nhỏ (10–11px) — chưa kiểm tra theo tiêu chuẩn WCAG.
- Chưa kiểm thử với screen reader — nhiều tương tác quan trọng (vuốt để thả, kéo-thả không gian khám phá) có thể khó dùng với công nghệ hỗ trợ.
- Chưa có chế độ giảm chuyển động (`prefers-reduced-motion`) — app có rất nhiều animation.
- Chưa test trên thiết bị thật đa dạng (màn hình nhỏ, Android cũ, kết nối mạng chậm).

#### 5.2.4 Khoảng trống tính năng theo đúng spec gốc

- **Song ngữ (Module 8) chỉ phủ được các màn hình mới** — Check-in, Write, Explore, Ritual, Dashboard vẫn hoàn toàn tiếng Việt.
- **Mood buddy ghép cặp ẩn danh** (Phase 2+) — chưa nghiên cứu đạo đức/consent.
- **Admin dashboard cho feedback & moderation** (Phase 2) — chưa có.
- **Bottom navigation** (optional Phase 2) — chưa có.
- **Email service thật** — chưa tích hợp, toàn bộ email hiện chỉ là mô phỏng.

#### 5.2.5 Rủi ro pháp lý & đạo đức cần founder/lãnh đạo quyết định sớm

- Cần xác định rõ **ứng dụng có được xem là dịch vụ y tế/tư vấn tâm lý hay không** dưới góc độ pháp lý Việt Nam.
- Cần **chính sách bảo mật dữ liệu rõ ràng** trước khi thu thập bất kỳ dữ liệu thật nào — đặc biệt vì nhóm người dùng mục tiêu có thể bao gồm người dưới 18 tuổi.
- Cần **quy trình escalation thật** khi phát hiện nội dung nguy cơ cao.

### 5.3 Tổng kết ưu tiên xử lý (theo mức độ khẩn cấp, không theo sprint)

1. 🔴 **Khẩn cấp trước khi có người dùng thật ngoài đội nội bộ**: nâng cấp kiểm duyệt nội dung, xác nhận pháp lý số hotline, thiết lập chính sách dữ liệu/quyền riêng tư.
2. 🟠 **Quan trọng trước khi gọi vốn/demo rộng rãi**: chạy `next build` sạch trên CI, viết ít nhất test cho luồng chính, thẩm định nội dung Thư viện bởi chuyên gia thật.
3. 🟡 **Nên làm sớm nhưng không chặn demo**: hoàn thiện i18n cho các màn cũ, audit accessibility, dọn file thừa (`lib/presets.ts`).
4. 🟢 **Có thể để Phase 2 theo đúng định hướng ban đầu**: mood buddy, admin dashboard, bottom nav, email service thật.

---

## 6. Định hướng sản phẩm & Roadmap

### 6.1 Roadmap 3 giai đoạn

**Giai đoạn 1 — MVP Front-end (✅ Đã hoàn thành tới thời điểm hiện tại)**
Toàn bộ 9 module chạy được end-to-end trên trình duyệt, dữ liệu mock/localStorage, đủ để test trải nghiệm người dùng và trình bày sản phẩm.

**Giai đoạn 2 — Nền tảng thật (đề xuất 3–4 tháng tiếp theo)**
Mục tiêu: biến MVP thành sản phẩm dùng được với nhiều người dùng thật, an toàn, có dữ liệu bền vững.

- **Backend & dữ liệu**: dựng Supabase (Postgres + Auth + Realtime + Storage) — bảng `anonymous_users`, `stories`, `reactions`, `mood_history`, `notifications`, `feedback`, `library_articles`.
- **Xác thực thật**: magic link qua Supabase Auth hoặc Resend.
- **Kiểm duyệt nội dung nâng cấp**: chuyển từ so khớp từ khoá sang dịch vụ phân loại (OpenAI Moderation API, Perspective API...) — có quy trình con người review `pending_review`.
- **Nội dung Thư viện kiến thức thật**: hợp tác chuyên gia tâm lý/tổ chức sức khoẻ tâm thần.
- **Real-time thật**: reaction, thông báo cập nhật tức thời qua Supabase Realtime.
- **Avatar AI thật**: thay thuật toán procedural bằng API sinh ảnh thật (giữ ràng buộc "không khuôn mặt người").
- **Hoàn thiện song ngữ**: phủ i18n cho toàn bộ màn hình còn lại.
- **Kiểm thử & chất lượng**: test tự động cho luồng chính, audit accessibility, CI/CD.

**Giai đoạn 3 — Tăng trưởng & mở rộng (sau khi có nền tảng ổn định)**
- **Admin dashboard**: xem feedback, quản lý nội dung Thư viện, review moderation queue, thống kê tổng hợp ẩn danh.
- **Mood buddy (ghép cặp ẩn danh)**: nghiên cứu đạo đức & consent kỹ lưỡng — tính năng nhạy cảm nhất về an toàn.
- **Bottom navigation & PWA**: cân nhắc đóng gói PWA hoặc app di động thật nếu tăng trưởng mobile.
- **Gamification tiết chế**: rất thận trọng — tránh mọi cơ chế tạo áp lực/nghiện (không điểm số công khai, không bảng xếp hạng, không "phạt" khi bỏ lỡ check-in).
- **Đối tác tổ chức tâm lý chính thức**: tích hợp đặt lịch tư vấn, liên kết hotline chính thức có xác nhận pháp lý.

### 6.2 Câu hỏi chiến lược cần founder/đội ngũ quyết định sớm

1. **Mô hình vận hành**: phi lợi nhuận hay có mô hình kinh doanh? Ảnh hưởng trực tiếp đến việc thu thập dữ liệu và mức độ minh bạch cần có.
2. **Ai chịu trách nhiệm nội dung Thư viện & moderation?**
3. **Ngưỡng tuổi người dùng**: có giới hạn độ tuổi tối thiểu chính thức không?
4. **Mức độ ẩn danh khi mở rộng**: giữ tuyệt đối "không thể truy vết" hay cho phép truy vết nội bộ trong trường hợp khẩn cấp?

### 6.3 Định hướng dài hạn (tầm nhìn 1–2 năm)

Từ một "nơi giải toả cảm xúc ẩn danh", Trạm Phát Sáng có tiềm năng phát triển thành **một hệ sinh thái chăm sóc sức khoẻ tinh thần nhẹ nhàng cho Gen Z Việt Nam**, gồm 3 lớp:

1. **Lớp cộng đồng ẩn danh** (đã có — Explore, reaction, warmth).
2. **Lớp tự chăm sóc có hướng dẫn** (đã có nền — Dashboard, Thư viện, bài tập thở).
3. **Lớp kết nối chuyên môn** (chưa có — Giai đoạn 3) — dẫn dắt nhẹ nhàng, có consent, tới chuyên gia/tổ chức thật.

Giữ đúng thứ tự ưu tiên **an toàn và đạo đức luôn đi trước tốc độ tăng trưởng** chính là lợi thế cạnh tranh dài hạn của sản phẩm.

---

## 7. Kế hoạch sprint tiếp theo

Giả định mỗi sprint dài 2 tuần, đội gồm tối thiểu 1 backend dev, 1 frontend dev, 1 người phụ trách nội dung/chuyên môn tâm lý (part-time/cố vấn).

### Sprint 1 — Nền tảng Backend & An toàn nội dung

**Mục tiêu:** đưa dữ liệu ra khỏi localStorage, có xác thực thật, và nâng cấp điểm rủi ro cao nhất (kiểm duyệt nội dung) trước bất kỳ bước mở rộng nào khác.

**Deliverables:**
- Thiết lập Supabase project: bảng `anonymous_users`, `stories`, `reactions`, `mood_history`.
- Thay `AuthContext` mô phỏng bằng Supabase Auth (magic link email thật).
- Thay `AppStateContext.releaseDraft()` / `sendReaction()` để gọi API thật thay vì chỉ set state + localStorage (giữ localStorage làm cache/offline fallback).
- Viết script migration: đọc dữ liệu `localStorage` hiện có của người dùng thử nghiệm nội bộ, đẩy lên Supabase có consent rõ ràng.
- Tích hợp dịch vụ kiểm duyệt nội dung thật (OpenAI Moderation API hoặc tương đương) — **có tư vấn của chuyên gia tâm lý về ngưỡng gắn cờ**.
- Thiết lập quy trình con người review nội dung `pending_review`.
- Xác nhận lại tính hợp pháp/phù hợp của số hotline đang hiển thị với đơn vị vận hành thật.

**Rủi ro cần theo dõi:** thời gian tích hợp Supabase Auth + migrate dữ liệu có thể phát sinh nhiều hơn dự kiến nếu cần hỗ trợ đăng nhập từ nhiều thiết bị cho cùng một người dùng ẩn danh.

**Definition of Done:**
- [ ] Người dùng mới đăng ký nhận được email magic link thật và đăng nhập thành công.
- [ ] Câu chuyện được thả lưu vào Postgres, đọc lại được sau khi xoá cache trình duyệt (khi đã đăng nhập).
- [ ] Một câu chuyện test chứa nội dung nhạy cảm được kiểm duyệt thật gắn cờ đúng như kỳ vọng, và có người thật nhận được cảnh báo để review.
- [ ] `next build` chạy thành công không lỗi trên môi trường CI sạch.

### Sprint 2 — Real-time, Email thật & Hoàn thiện song ngữ

**Mục tiêu:** làm cho các tính năng hiện đang "mô phỏng" (thông báo, email) trở thành thật, đồng thời lấp khoảng trống lớn nhất còn lại của Module 8.

**Deliverables:**
- Tích hợp Supabase Realtime (hoặc WebSocket riêng): thông báo "có người reaction cho story của bạn" cập nhật tức thời, thay cho `NotificationEventsBridge` (chỉ mô phỏng trên cùng một phiên).
- Tích hợp dịch vụ email thật (Resend/SendGrid) cho: email chào mừng, email khi nhận reaction (tuỳ chọn), digest hàng tuần.
- Soạn template email song ngữ (vi/en) theo đúng `lib/i18n.ts` đã có.
- **Hoàn thiện i18n cho các màn hình lớn còn thiếu**: Check-in, Write, Explore, Ritual, Dashboard — refactor toàn bộ chuỗi hardcode tiếng Việt sang dùng `useLanguage().t()`, bổ sung bản dịch tiếng Anh tương ứng.
- Đưa avatar AI từ thuật toán thủ tục sang gọi API sinh ảnh thật (giữ nguyên ràng buộc không khuôn mặt người trong prompt).

**Rủi ro cần theo dõi:** khối lượng dịch thuật cho các màn lớn khá nhiều — nên cân nhắc có người bản ngữ tiếng Anh review, không chỉ dịch kỹ thuật.

**Definition of Done:**
- [ ] Hai tài khoản thật thấy thông báo reaction của nhau theo thời gian thực, không cần reload trang.
- [ ] Email chào mừng và digest hàng tuần gửi thành công tới hộp thư thật.
- [ ] Chuyển toàn app sang tiếng Anh ở Settings, không còn màn hình nào lộ chuỗi tiếng Việt hardcode xen giữa tiếng Anh.

### Sprint 3 — Chất lượng, Nội dung thật & Chuẩn bị ra mắt

**Mục tiêu:** đưa sản phẩm từ "chạy được" sang "sẵn sàng cho người dùng thật ngoài phạm vi nội bộ".

**Deliverables:**
- Thay toàn bộ 10 bài viết mock trong Thư viện bằng nội dung đã qua chuyên gia tâm lý thật thẩm định và ký tên chịu trách nhiệm.
- Viết bộ test tự động tối thiểu cho các luồng rủi ro cao: release story → moderation → hiển thị/pending_review, gửi reaction (đủ 5 loại + giới hạn/ngày), đăng nhập/đăng xuất.
- Audit accessibility cơ bản: contrast ratio, `prefers-reduced-motion`, điều hướng bằng bàn phím.
- Thiết lập CI/CD và ít nhất một môi trường staging tách biệt production.
- Soạn Chính sách quyền riêng tư & Điều khoản sử dụng thật (phối hợp cố vấn pháp lý).
- Dọn dẹp nợ kỹ thuật nhỏ: xoá `lib/presets.ts`, rà soát lại toàn bộ TODO/ghi chú "MVP-only" còn sót trong code.
- Xây dựng admin dashboard tối giản để đội ngũ xem feedback và hàng chờ moderation.

**Rủi ro cần theo dõi:** việc chờ chuyên gia tâm lý thẩm định nội dung có thể là nút thắt về thời gian — nên bắt đầu tìm kiếm/ký hợp tác song song từ Sprint 1.

**Definition of Done:**
- [ ] 100% bài viết trong Thư viện có tên chuyên gia thật chịu trách nhiệm nội dung.
- [ ] CI chạy test tự động thành công trên mọi pull request trước khi merge.
- [ ] Trang Chính sách quyền riêng tư & Điều khoản sử dụng được cố vấn pháp lý duyệt.
- [ ] Đội ngũ có thể xử lý một feedback/report nội dung thật từ đầu đến cuối chỉ qua admin dashboard.

### Ghi chú chung cho cả 3 sprint

- Ưu tiên xuyên suốt vẫn là **an toàn người dùng trước tốc độ tính năng**.
- Nên có một buổi "red team" nội bộ cuối mỗi sprint: cố tình thử các hành vi xấu (spam, viết nội dung nhạy cảm dưới nhiều biến thể, cố gắng bypass giới hạn reaction/ngày).
- Mọi quyết định liên quan tới nội dung sức khoẻ tâm thần và ngưỡng kiểm duyệt nên có ít nhất một người có chuyên môn tâm lý/tâm thần học tham gia ký duyệt.

---

## 8. Nhật ký cập nhật gần đây

*Mục này ghi lại các thay đổi lớn được thực hiện SAU khi bộ tài liệu gốc (7 file) được biên soạn lần đầu — giữ lại để hiểu vì sao một số chi tiết ở các mục trên khác với phiên bản đầu tiên.*

**Redesign `/explore` (không gian khám phá):**
- Sửa lỗi hiệu năng nghiêm trọng: bỏ ~90 phép biến đổi Framer Motion gắn riêng lẻ theo từng hạt bụi/từng câu chuyện (gây giật/lag khi kéo và hiện tượng orb "tự xoay" ngoài ý muốn), thay bằng 2 lớp parallax dùng chung transform — đúng theo mẫu hình đã áp dụng ổn định ở `SkyCanvas`/`OceanCanvas`.
- Thêm lại **bản đồ thu nhỏ (SpaceMap)** ở góc trái màn hình — đúng vị trí quen thuộc người dùng mong đợi — luôn hiển thị thường trực (không cần bấm mở).
- Mở rộng không gian ảo từ 300% lên **700%** khung nhìn, tăng số lượng câu chuyện mẫu từ 8 lên **34 mỗi loại** (sao/bong bóng), sinh toạ độ bằng công thức giả-ngẫu-nhiên có seed cố định (không dùng `Math.random()` để tránh lỗi hydration mismatch giữa server/client) để trải đều khắp mọi góc thay vì co cụm giữa màn hình.
- Phát hiện và sửa một lỗi toán học quan trọng: công thức chuyển đổi giữa vị trí camera thật và toạ độ hiển thị trên bản đồ từng giả định sai rằng "thế giới ảo có cùng kích thước với khung nhìn" — khiến khung camera trên bản đồ hiển thị sai vị trí và bấm vào bản đồ để lướt tới sai chỗ. Đã viết lại công thức đúng có tính đến tỉ lệ khung nhìn/thế giới, kiểm chứng lại bằng tính toán số học cụ thể.
- Thêm khả năng bấm vào bất kỳ đâu trên bản đồ (kể cả vùng trống) để lướt camera chính xác tới đó, không chỉ giới hạn ở việc bấm vào từng chấm câu chuyện.
- Câu chuyện nhận càng nhiều tia sáng/khích lệ thì chấm đại diện trên bản đồ càng to, càng sáng, có quầng nhấp nháy riêng — giúp "độ ấm" của cộng đồng cảm nhận được ngay trên bản đồ.
- Thêm vignette làm tối nhẹ các góc màn hình để tăng cảm giác bí ẩn, mời gọi khám phá thay vì cảm giác trống trải.

**Redesign `/checkin`:**
- Thêm lời chào thay đổi theo thời điểm trong ngày (khuya/sáng/trưa/chiều/tối) thay cho dòng chữ tĩnh cố định.
- Các mảnh tâm sự trôi nổi (trước đây chỉ hiện trên desktop) nay hiển thị dạng thẻ xoay vòng cả trên mobile.
- Thêm một câu hồi đáp đồng cảm xuất hiện ngay sau khi người dùng chọn mức mood, tuỳ theo mức độ cảm xúc họ chọn.

**Cử chỉ thả tại `/ritual` — chuyển từ một chiều sang hai chiều:**
- Trước đây: loại câu chuyện (sao hay bong bóng) được khoá cứng theo lựa chọn ban đầu ở `/write`, chỉ chấp nhận vuốt đúng một hướng tương ứng.
- Nay: hướng vuốt thật sự lúc buông tay mới quyết định kết quả cuối cùng — vuốt lên luôn ra sao/bầu trời, vuốt xuống luôn ra bong bóng/đại dương, bất kể đã chọn gì trước đó. Màu sắc quả cầu đổi ngay theo hướng đang kéo để phản hồi trực quan, nền cảnh chuyển đúng không gian sau khi thả xong. `AppStateContext.releaseDraft()` được thêm tham số `overrideType` tuỳ chọn để hỗ trợ việc này mà không phá vỡ luồng dữ liệu cũ.

**Thay đổi cơ chế phản hồi (reaction):**
- Bỏ giới hạn "mỗi câu chuyện chỉ nhận 1 phản hồi/người dùng" — một người giờ có thể gửi nhiều tia sáng/lời nhắn tới cùng một câu chuyện, kể cả khi đã từng gửi trước đó. Màn "đã gửi" có thêm nút gửi tiếp ngay.
- Giới hạn an toàn chống spam/bully duy nhất còn lại là **tổng số lượt gửi trong một ngày** (không đổi), áp dụng trên toàn bộ hoạt động gửi phản hồi thay vì theo từng câu chuyện riêng lẻ.
