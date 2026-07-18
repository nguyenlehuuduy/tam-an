// Bộ lọc từ khoá nguy cơ cao — spec mục 6.3 (báo cáo gốc) và A14 (tài liệu
// bổ sung). Nâng cấp từ danh sách 6 từ khoá tối giản ban đầu lên một danh
// sách rộng hơn, có nhóm theo biến thể ngôn ngữ thật (có dấu/không dấu —
// nhiều người gõ không dấu trên mobile), NHƯNG vẫn CHỈ là giải pháp so
// khớp chuỗi cho MVP, KHÔNG phải AI phân loại ngữ nghĩa thật — dễ bị lách
// qua hoặc báo sai (ví dụ một câu chuyện nhắc tới từ khoá trong ngữ cảnh
// tích cực vẫn có thể bị gắn cờ). Xem tai-lieu-du-an mục 5.2.1 và 6.1.
//
// KHÔNG tự ý mở rộng danh sách này một mình khi triển khai thật — mọi
// quyết định về ngưỡng/từ khoá kiểm duyệt nội dung sức khoẻ tâm thần nên
// có ít nhất một người có chuyên môn tâm lý/tâm thần học ký duyệt (mục 7,
// "Ghi chú chung cho cả 3 sprint").
//
// ĐIỂM DUY NHẤT CẦN SỬA KHI CÓ BACKEND: thay phần thân hàm moderateContent()
// bên dưới bằng lệnh gọi dịch vụ phân loại chuyên dụng thật (OpenAI
// Moderation API, Perspective API...) — chữ ký hàm (input/output) giữ
// nguyên để mọi nơi đang gọi moderateContent() trong app (AppStateContext,
// SignalCard...) không cần đổi gì.

export type StoryStatus = "visible" | "pending_review";

export interface ModerationResult {
  status: StoryStatus;
  highRisk: boolean;
  /** Từ khoá thực sự khớp — chỉ dùng nội bộ (debug/audit sau này khi có
   * quy trình con người review pending_review), KHÔNG hiển thị trực tiếp
   * cho người dùng để tránh cảm giác bị "chấm điểm nội dung". */
  matchedTerms: string[];
}

/** Bỏ dấu tiếng Việt — so khớp thêm một lượt trên bản không dấu để không
 * bỏ sót nội dung nguy cơ cao khi người dùng gõ không dấu (phổ biến trên
 * bàn phím mobile, gõ vội, hoặc thiết bị không hỗ trợ gõ tiếng Việt). */
function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Nhóm theo chủ đề để dễ rà soát/bổ sung sau này cùng chuyên gia, bao gồm
// cả cách diễn đạt gián tiếp/uyển ngữ thường gặp, không chỉ từ khoá trực
// diện như bản gốc.
const SUICIDE_SELF_HARM_TERMS = [
  "tự tử",
  "tự sát",
  "tự hại",
  "tự làm đau bản thân",
  "tự làm hại chính mình",
  "kết liễu cuộc đời",
  "kết liễu đời mình",
  "kết liễu bản thân",
  "không muốn sống nữa",
  "không còn muốn sống",
  "chán sống",
  "muốn biến mất mãi mãi",
  "muốn chết đi",
  "ước gì mình chết",
  "muốn kết thúc tất cả",
  "kết thúc mọi thứ",
  "buông xuôi tất cả",
  "không còn lý do để sống",
  "sống không có ý nghĩa gì nữa",
  "cắt tay",
  "rạch tay",
  "treo cổ",
  "nhảy lầu",
  "uống thuốc quá liều",
];

const HIGH_RISK_KEYWORDS = SUICIDE_SELF_HARM_TERMS;

// Build bản không dấu một lần lúc module load, tránh tính lại mỗi lần gọi.
const HIGH_RISK_KEYWORDS_NO_DIACRITICS = HIGH_RISK_KEYWORDS.map(stripDiacritics);

export function moderateContent(text: string): ModerationResult {
  const normalized = text.toLowerCase();
  const normalizedNoDiacritics = stripDiacritics(normalized);

  const matchedTerms: string[] = [];
  HIGH_RISK_KEYWORDS.forEach((word, idx) => {
    const noDiacriticsWord = HIGH_RISK_KEYWORDS_NO_DIACRITICS[idx];
    if (normalized.includes(word) || normalizedNoDiacritics.includes(noDiacriticsWord)) {
      matchedTerms.push(word);
    }
  });

  const highRisk = matchedTerms.length > 0;

  return {
    // Nội dung có nguy cơ cao tạm ẩn khỏi không gian chung, chờ 1 trong 2
    // thành viên đội ngũ xem lại theo ca trực (spec mục 6.3 báo cáo gốc).
    status: highRisk ? "pending_review" : "visible",
    highRisk,
    matchedTerms,
  };
}
