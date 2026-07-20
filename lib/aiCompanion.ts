// =====================================================
// "SOLACE ĐỒNG HÀNH" — phản hồi cá nhân hoá tự động ngay lúc thả câu
// chuyện, dựa trên khớp từ khoá theo chủ đề + tầng cảm xúc (mood). Đây là
// MÔ PHỎNG rule-based, KHÔNG gọi bất kỳ mô hình ngôn ngữ/API AI thật nào —
// mục đích là kiểm chứng trước xem việc có một phản hồi "được lắng nghe
// đúng chỗ" ngay lúc thả có thực sự tạo cảm giác chạm hơn không, trước khi
// đầu tư một LLM thật ở Giai đoạn 2 (đề xuất kỹ thuật riêng, xem trong tài
// liệu dự án).
//
// NGUYÊN TẮC ĐẠO ĐỨC (bắt buộc khi hiển thị kết quả hàm này):
//   1. Luôn đi kèm dòng ghi chú "đây là phản hồi tự động" — không được để
//      người dùng lầm tưởng có một người thật vừa đọc và trả lời họ.
//   2. Ngôn ngữ luôn ở dạng phỏng đoán/gợi mở ("nghe như", "có vẻ") — không
//      khẳng định, không chẩn đoán, không phán xét.
//   3. Không đưa lời khuyên y tế/trị liệu — chỉ phản chiếu (reflect) và ghi
//      nhận cảm xúc.
// =====================================================

type MoodTier = "heavy" | "neutral" | "light";

interface ThemeBank {
  id: string;
  keywords: string[];
  heavy: string[];
  neutral: string[];
  light: string[];
}

function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function moodTier(mood: number | null): MoodTier {
  if (mood !== null && mood <= 3) return "heavy";
  if (mood !== null && mood >= 7) return "light";
  return "neutral";
}

/** Chọn ổn định theo id câu chuyện (không đổi giữa các lần render), nhưng
 * đa dạng giữa các câu chuyện khác nhau — không dùng Math.random() trực
 * tiếp để tránh hiện tượng "nhấp nháy" nội dung khi component re-render. */
function pickStable<T>(arr: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[hash % arr.length];
}

const THEMES: ThemeBank[] = [
  {
    id: "loneliness",
    keywords: ["co don", "mot minh", "khong ai hieu", "lac long", "khong ai o ben", "khong co ai"],
    heavy: [
      "Nghe như bạn đang cảm thấy rất một mình lúc này. Cảm giác đó không dễ chịu chút nào — nhưng câu chuyện này giờ đã có người đọc, dù bạn không thấy họ.",
      "Cô đơn giữa đám đông là một trong những cảm giác nặng nề nhất. Bạn không cần phải mang nó một mình — cứ để nó ở đây một lúc.",
    ],
    neutral: [
      "Có vẻ gần đây bạn đang thấy hơi lạc lõng. Điều đó bình thường hơn bạn nghĩ — rất nhiều người ở đây cũng từng cảm thấy y như vậy.",
      "Cảm giác một mình đôi khi chỉ là một đám mây trôi qua, không phải mãi mãi. Cảm ơn bạn đã kể ra thay vì giữ trong lòng.",
    ],
    light: [
      "Dù đôi lúc thấy một mình, có vẻ bạn vẫn đang giữ được sự nhẹ nhàng cho riêng mình — điều đó không hề nhỏ đâu.",
      "Ngay cả khi nhắc đến sự cô đơn, giọng văn của bạn vẫn còn chút hy vọng — cứ giữ lấy nó nhé.",
    ],
  },
  {
    id: "pressure",
    keywords: ["ap luc", "met moi", "qua tai", "kiet suc", "duoi suc", "stress"],
    heavy: [
      "Nghe như bạn đang mang trên vai nhiều hơn mức một người nên gánh. Bạn được phép dừng lại, dù chỉ một chút, ngay bây giờ.",
      "Kiệt sức không phải là yếu đuối — đó là dấu hiệu bạn đã cố gắng rất nhiều rồi. Hãy nhẹ nhàng với bản thân hơn một chút tối nay.",
    ],
    neutral: [
      "Có vẻ dạo này có khá nhiều thứ dồn lại. Đôi khi việc viết ra như thế này đã là một cách để nhẹ bớt một phần rồi.",
      "Áp lực không tự nhiên biến mất, nhưng ít nhất giờ nó không còn nằm im một mình trong đầu bạn nữa.",
    ],
    light: [
      "Dù có nhắc đến mệt mỏi, có vẻ bạn vẫn đang tìm được cách cân bằng — cứ tiếp tục lắng nghe cơ thể mình nhé.",
      "Biết mình đang quá tải ở đâu đã là một bước quan trọng để chăm sóc bản thân tốt hơn rồi.",
    ],
  },
  {
    id: "family",
    keywords: ["gia dinh", "bo me", "cha me", "ba me", "bo minh", "me minh"],
    heavy: [
      "Chuyện gia đình thường chạm vào những phần sâu và nhạy cảm nhất trong mình. Không dễ để nói ra điều này, cảm ơn bạn đã tin tưởng chia sẻ.",
      "Nghe như những gì đang xảy ra trong gia đình khiến lòng bạn rất nặng. Bạn không cần phải giải quyết hết mọi thứ một mình ngay bây giờ.",
    ],
    neutral: [
      "Gia đình luôn là một mối quan hệ phức tạp, kể cả khi mọi thứ 'ổn'. Cảm ơn bạn đã cho một phần câu chuyện đó được lắng nghe.",
      "Đôi khi những điều khó nói nhất với người thân lại dễ viết ra hơn ở một nơi ẩn danh như thế này.",
    ],
    light: [
      "Có vẻ dù còn những điều chưa hoàn hảo, bạn vẫn đang trân trọng những khoảnh khắc ấm áp trong gia đình mình.",
      "Nhắc đến gia đình với một sự nhẹ nhàng như vậy cũng là một điều đáng quý.",
    ],
  },
  {
    id: "love",
    keywords: ["chia tay", "nguoi yeu", "tinh yeu", "yeu don phuong", "that tinh", "crush"],
    heavy: [
      "Chia tay hay tan vỡ một mối quan hệ thường để lại một khoảng trống không dễ lấp đầy ngay. Cứ để bản thân buồn một chút, không cần vội ổn lại.",
      "Nghe như trái tim bạn đang khá đau lúc này. Điều đó có nghĩa là bạn đã yêu thật lòng — và điều đó không hề sai.",
    ],
    neutral: [
      "Chuyện tình cảm luôn phức tạp hơn những gì người ngoài nhìn thấy. Cảm ơn bạn đã để một phần của nó được nói ra.",
      "Dù mọi chuyện chưa rõ ràng, việc viết ra cảm xúc của mình cũng là một cách để hiểu bản thân hơn.",
    ],
    light: [
      "Nghe như có điều gì đó ấm áp trong câu chuyện tình cảm của bạn lúc này — thật vui khi biết điều đó.",
      "Một chút ngọt ngào giữa những ngày bận rộn cũng đáng được trân trọng.",
    ],
  },
  {
    id: "gratitude",
    keywords: ["biet on", "hanh phuc", "vui ve", "tich cuc", "may man", "tu hao"],
    heavy: [
      "Dù lòng đang có phần nặng, việc bạn vẫn tìm thấy điều để biết ơn thật sự rất đáng quý.",
    ],
    neutral: [
      "Thật ấm lòng khi đọc được điều này. Những khoảnh khắc nhỏ như vậy thường là thứ giữ chúng ta đi tiếp.",
    ],
    light: [
      "Cảm ơn bạn đã chia sẻ điều tích cực này — nó chắc chắn sẽ khiến ai đó đọc được cũng thấy nhẹ nhõm hơn.",
      "Niềm vui của bạn hôm nay cũng là một tia sáng cho không gian chung này.",
    ],
  },
];

const GENERIC: Record<MoodTier, string[]> = {
  heavy: [
    "Cảm ơn bạn đã tin tưởng để lại một phần lòng mình ở đây, ngay cả khi mọi thứ đang không dễ dàng.",
    "Điều bạn vừa viết ra là thật, và nó xứng đáng được tồn tại — dù nặng nề đến đâu.",
  ],
  neutral: [
    "Cảm ơn bạn đã dành một chút thời gian để lắng nghe chính mình hôm nay.",
    "Mỗi câu chuyện được thả ra đều làm không gian này ấm hơn một chút — kể cả câu chuyện của bạn.",
  ],
  light: [
    "Cảm ơn bạn đã mang một chút ánh sáng đến không gian này hôm nay.",
    "Thật vui khi biết hôm nay bạn đang cảm thấy nhẹ nhàng — cứ giữ lấy cảm giác này.",
  ],
};

export interface CompanionInput {
  id: string;
  content: string;
  moodAtRelease: number | null;
}

export function generateCompanionReflection(input: CompanionInput): string {
  const normalized = stripDiacritics(input.content.toLowerCase());
  const tier = moodTier(input.moodAtRelease);
  const matchedTheme = THEMES.find((t) => t.keywords.some((k) => normalized.includes(k)));
  const bank = matchedTheme ? matchedTheme[tier] : GENERIC[tier];
  return pickStable(bank, input.id);
}
