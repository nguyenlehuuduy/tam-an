// Bộ preset "tia sáng ấm áp" — spec mục A13.1
// Đây là phản hồi DUY NHẤT được phép: không có ô nhập văn bản tự do,
// để loại bỏ hoàn toàn rủi ro bạo lực mạng ngay từ thiết kế.

export interface ReactionPreset {
  key: string;
  label: string;
}

export const REACTION_PRESETS: ReactionPreset[] = [
  { key: "not-alone", label: "Bạn không một mình" },
  { key: "i-hear-you", label: "Mình nghe thấy bạn rồi" },
  { key: "let-it-drift", label: "Cứ để nó trôi đi nhé" },
  { key: "warm-hug", label: "Gửi bạn một cái ôm thật ấm" },
  { key: "lighter-tomorrow", label: "Ngày mai sẽ nhẹ hơn hôm nay" },
  { key: "brave", label: "Bạn đã rất can đảm khi viết ra điều này" },
  { key: "im-here", label: "Có mình ở đây" },
  { key: "shining-star", label: "Một ngôi sao nhỏ đang toả sáng vì bạn" },
];
