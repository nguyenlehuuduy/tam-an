// Bộ lọc từ khoá cơ bản — spec mục 6.3 (báo cáo gốc) và A14 (tài liệu bổ sung).
//
// Đây CHỈ là bản minh hoạ cho MVP: một danh sách từ khoá rất ngắn, tổng quát,
// đủ để trình diễn luồng "gắn cờ nội dung nguy cơ cao → hiện banner hotline
// ngay lập tức, không chặn thao tác của người dùng". Khi triển khai thật,
// nên thay bằng dịch vụ kiểm duyệt/API phân loại chuyên dụng (xem mục 6.1
// của báo cáo gốc), không mở rộng danh sách từ khoá này thủ công.

const HIGH_RISK_KEYWORDS = [
  "tự tử",
  "tự sát",
  "kết liễu",
  "không muốn sống",
  "muốn biến mất mãi mãi",
  "tự hại",
];

export type SignalStatus = "visible" | "pending_review";

export interface ModerationResult {
  status: SignalStatus;
  highRisk: boolean;
}

export function moderateContent(text: string): ModerationResult {
  const normalized = text.toLowerCase();
  const highRisk = HIGH_RISK_KEYWORDS.some((word) => normalized.includes(word));

  return {
    // Nội dung có nguy cơ cao tạm ẩn khỏi không gian chung, chờ 1 trong 2
    // thành viên đội ngũ xem lại theo ca trực (spec mục 6.3 báo cáo gốc).
    status: highRisk ? "pending_review" : "visible",
    highRisk,
  };
}
