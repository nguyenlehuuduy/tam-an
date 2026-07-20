// =====================================================
// NGUỒN HỖ TRỢ KHỦNG HOẢNG — dùng chung cho HotlineBanner (xuất hiện khi
// nội dung bị gắn cờ highRisk) và SupportButton (luôn có thể bấm vào bất
// cứ lúc nào, không cần chờ bị gắn cờ — góc nhìn chuyên gia tâm lý: một
// người đang cần giúp đỡ không nên phải "viết ra điều gì đó nguy hiểm"
// trước thì app mới chỉ đường cho họ).
//
// Thông tin số 096 306 1414 (Ngày Mai) đã được xác minh trực tiếp từ
// duongdaynongngaymai.vn — dự án phi lợi nhuận do tác giả Đặng Hoàng Giang
// và chuyên gia tâm lý Nguyễn Hà Thành khởi xướng, chuyên hỗ trợ người trẻ
// trầm cảm/khủng hoảng tâm lý. LƯU Ý: KHÔNG hoạt động 24/7 — chỉ 13h00–
// 20h30, Thứ 4 → Chủ Nhật (nghỉ Thứ 2, Thứ 3). Số 111 (Tổng đài Quốc gia
// Bảo vệ Trẻ em) và 115 (Cấp cứu y tế) là các số công khai, phổ biến rộng
// rãi. Trước khi ra mắt thật, đội ngũ nên xác nhận lại định kỳ (số điện
// thoại/giờ hoạt động của các tổ chức cộng đồng có thể thay đổi).
// =====================================================

export interface SupportResource {
  id: string;
  name: string;
  phone: string;
  hours: string;
  description: string;
  /** true = luôn sẵn sàng 24/7, hiện nổi bật hơn khi ngoài giờ của các số khác */
  available247: boolean;
}

export const SUPPORT_RESOURCES: SupportResource[] = [
  {
    id: "ngaymai",
    name: "Đường dây nóng Ngày Mai",
    phone: "096 306 1414",
    hours: "13h00–20h30 · Thứ 4 → Chủ Nhật",
    description:
      "Sơ cứu tâm lý miễn phí qua điện thoại, dành cho người trẻ đang trầm cảm hoặc khủng hoảng tâm lý — lắng nghe không phán xét, bảo mật tuyệt đối.",
    available247: false,
  },
  {
    id: "111",
    name: "Tổng đài Quốc gia Bảo vệ Trẻ em",
    phone: "111",
    hours: "24/7 · Miễn phí",
    description: "Tư vấn tâm lý cho lo âu, trầm cảm, stress, ý nghĩ tự tử — luôn trực, kể cả ngoài giờ của các số khác.",
    available247: true,
  },
  {
    id: "115",
    name: "Cấp cứu y tế",
    phone: "115",
    hours: "24/7",
    description: "Gọi ngay nếu tính mạng đang bị đe doạ trực tiếp, cần hỗ trợ y tế khẩn cấp.",
    available247: true,
  },
];

export const SUPPORT_DISCLAIMER =
  "Solace là không gian để lắng nghe và đồng hành, không thay thế chẩn đoán hay điều trị y tế/tâm lý chuyên nghiệp.";
