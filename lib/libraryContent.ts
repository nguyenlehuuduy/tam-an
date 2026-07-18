// =====================================================
// MODULE 5 — Thư viện kiến thức (Blog / Library)
// -----------------------------------------------------
// Toàn bộ nội dung dưới đây là DỮ LIỆU ẢO (mock), viết tay cho MVP front-end
// — chưa có CMS hay backend thật. Khi nối backend, đây sẽ là chỗ để thay
// bằng fetch từ bảng `library_articles` (Supabase) hoặc CMS ngoài.
// coverGradient đứng thế cho cover image thật (chưa có pipeline upload/CDN
// ảnh ở giai đoạn front-end-only này).
// =====================================================

export type ArticleCategory = "expert" | "tips" | "exercises" | "community";

export type MoodTag =
  | "anxiety"
  | "sadness"
  | "loneliness"
  | "self-care"
  | "sleep"
  | "stress"
  | "gratitude";

export const MOOD_TAG_LABELS: Record<MoodTag, { vi: string; en: string; emoji: string }> = {
  anxiety: { vi: "Lo âu", en: "Anxiety", emoji: "😮‍💨" },
  sadness: { vi: "Buồn bã", en: "Sadness", emoji: "😔" },
  loneliness: { vi: "Cô đơn", en: "Loneliness", emoji: "🌙" },
  "self-care": { vi: "Chăm sóc bản thân", en: "Self-care", emoji: "🕊️" },
  sleep: { vi: "Mất ngủ", en: "Sleep", emoji: "🌌" },
  stress: { vi: "Căng thẳng", en: "Stress", emoji: "⚡" },
  gratitude: { vi: "Biết ơn", en: "Gratitude", emoji: "🌸" },
};

export const CATEGORY_LABELS: Record<ArticleCategory, { vi: string; en: string; emoji: string }> = {
  expert: { vi: "Bài viết chuyên gia", en: "Expert articles", emoji: "📖" },
  tips: { vi: "Mẹo cải thiện tâm trạng", en: "Mood tips", emoji: "💡" },
  exercises: { vi: "Bài tập / Guided", en: "Guided exercises", emoji: "🧘" },
  community: { vi: "Chia sẻ cộng đồng", en: "Community shares", emoji: "🌱" },
};

export interface ArticleTranslation {
  title: string;
  excerpt: string;
  body: string[];
}

export interface LibraryArticle {
  slug: string;
  category: ArticleCategory;
  tags: string[];
  moodTags: MoodTag[];
  readingTimeMinutes: number;
  author: { name: string; credentials: string };
  coverGradient: string;
  coverEmoji: string;
  vi: ArticleTranslation;
  /** Không phải bài nào cũng có — minh hoạ đúng quy tắc fallback 8.2. */
  en?: ArticleTranslation;
}

export const LIBRARY_ARTICLES: LibraryArticle[] = [
  {
    slug: "doi-dien-voi-lo-au",
    category: "expert",
    tags: ["lo âu", "ban đêm", "tâm lý học"],
    moodTags: ["anxiety", "stress", "sleep"],
    readingTimeMinutes: 6,
    author: { name: "ThS. Nguyễn Lan Anh", credentials: "Thạc sĩ Tâm lý lâm sàng, 8 năm tư vấn" },
    coverGradient: "linear-gradient(135deg, #1A0533 0%, #3A2E5C 60%, #7C9EFF 140%)",
    coverEmoji: "🌌",
    vi: {
      title: "Khi lo âu kéo đến vào ban đêm",
      excerpt: "Vì sao những suy nghĩ tiêu cực hay ập đến lúc bạn chuẩn bị ngủ, và vài cách nhẹ nhàng để làm dịu chúng.",
      body: [
        "Rất nhiều người nhận ra lo âu của mình trở nên rõ rệt nhất vào ban đêm — khi mọi thứ xung quanh đã yên tĩnh, không còn gì để phân tán sự chú ý, và não bộ bắt đầu \"dọn dẹp\" lại những điều chưa xử lý xong trong ngày.",
        "Đây không phải là dấu hiệu bạn yếu đuối. Đó là cách hệ thần kinh phản ứng khi cortisol (hormone căng thẳng) chưa kịp giảm xuống đúng nhịp sinh học, cộng với việc không còn các tín hiệu bên ngoài để \"neo\" sự chú ý.",
        "Một vài điều có thể giúp: viết ra 3 điều đang khiến bạn lo lắng trước khi lên giường (để não không phải giữ chúng), giữ ánh sáng dịu trong 30 phút cuối trước khi ngủ, và thử bài tập hít thở chậm (4 giây hít vào, 7 giây giữ, 8 giây thở ra).",
        "Nếu tình trạng này kéo dài nhiều tuần và ảnh hưởng rõ rệt đến cuộc sống hàng ngày, hãy cân nhắc trò chuyện với chuyên gia tâm lý — lo âu kéo dài là điều hoàn toàn có thể điều trị được.",
      ],
    },
    en: {
      title: "When anxiety creeps in at night",
      excerpt: "Why negative thoughts tend to surface right as you're trying to sleep, and a few gentle ways to ease them.",
      body: [
        "Many people notice their anxiety becomes most vivid at night — when everything around them goes quiet, there's nothing left to distract the mind, and the brain starts \"sorting through\" whatever was left unresolved during the day.",
        "This isn't a sign of weakness. It's how the nervous system responds when cortisol (the stress hormone) hasn't yet settled into its natural rhythm, combined with the loss of external cues that usually anchor your attention.",
        "A few things can help: write down 3 things worrying you before bed (so your brain doesn't have to hold onto them), keep the lighting soft for the last 30 minutes before sleep, and try slow breathing (4 seconds in, 7 seconds hold, 8 seconds out).",
        "If this persists for weeks and clearly affects your daily life, consider talking to a mental health professional — persistent anxiety is very treatable.",
      ],
    },
  },
  {
    slug: "5-meo-nho-giam-cang-thang",
    category: "tips",
    tags: ["căng thẳng", "mẹo nhanh"],
    moodTags: ["stress", "anxiety"],
    readingTimeMinutes: 3,
    author: { name: "Đội ngũ Solace", credentials: "Biên tập nội dung sức khoẻ tinh thần" },
    coverGradient: "linear-gradient(135deg, #072034 0%, #0E4D5C 60%, #4FD1C5 140%)",
    coverEmoji: "⚡",
    vi: {
      title: "5 mẹo nhỏ giúp bạn hạ nhiệt căng thẳng trong 5 phút",
      excerpt: "Không cần thay đổi cả ngày sống — chỉ vài phút cũng đủ để cơ thể bạn \"reset\" lại một chút.",
      body: [
        "1. Đặt hai bàn tay lên ngực và bụng, hít thở chậm trong 60 giây — cảm nhận nhịp thở thay vì cố kiểm soát nó.",
        "2. Uống một cốc nước thật chậm, tập trung hoàn toàn vào cảm giác — đây là một dạng thiền chánh niệm cực ngắn.",
        "3. Đứng dậy, vươn vai và siết chặt rồi thả lỏng từng nhóm cơ trong 10 giây — cơ thể căng thẳng thường \"khoá\" cảm xúc lại.",
        "4. Viết ra đúng 1 câu miêu tả điều bạn đang cảm thấy — không cần giải quyết, chỉ cần gọi tên nó.",
        "5. Ra ngoài (hoặc đến gần cửa sổ) nhìn xa ít nhất 20 giây — mắt cần được \"nghỉ ngơi\" khỏi khoảng cách gần liên tục.",
      ],
    },
  },
  {
    slug: "bai-tap-tho-4-7-8",
    category: "exercises",
    tags: ["hít thở", "giấc ngủ", "guided"],
    moodTags: ["anxiety", "sleep", "stress"],
    readingTimeMinutes: 4,
    author: { name: "ThS. Trần Minh Đức", credentials: "Chuyên viên trị liệu tâm lý, chứng chỉ Mindfulness-Based Therapy" },
    coverGradient: "linear-gradient(135deg, #0a1a2e 0%, #1e3a5f 60%, #7C9EFF 140%)",
    coverEmoji: "🧘",
    vi: {
      title: "Bài tập hít thở 4-7-8 giúp bạn ngủ ngon hơn",
      excerpt: "Một kỹ thuật thở đơn giản, được dùng phổ biến trong trị liệu để làm dịu hệ thần kinh trước khi ngủ.",
      body: [
        "Kỹ thuật 4-7-8 được phát triển dựa trên pranayama (thở yoga cổ điển): hít vào bằng mũi trong 4 giây, giữ hơi thở trong 7 giây, rồi thở ra bằng miệng thật chậm trong 8 giây.",
        "Nhịp thở dài hơn ở bước thở ra giúp kích hoạt hệ thần kinh phó giao cảm — hệ thống chịu trách nhiệm cho cảm giác \"nghỉ ngơi và tiêu hoá\", đối lập với phản ứng \"chiến hay chạy\" khi căng thẳng.",
        "Bạn có thể thử ngay trong ứng dụng này ở mục Dashboard cá nhân — có một hướng dẫn trực quan giúp bạn theo đúng nhịp mà không cần đếm nhẩm.",
        "Lời khuyên: đừng cố ép bản thân làm đúng ngay từ lần đầu. Chỉ cần lặp lại 4 chu kỳ mỗi tối, cơ thể sẽ dần quen với nhịp thở này.",
      ],
    },
    en: {
      title: "The 4-7-8 breathing exercise for better sleep",
      excerpt: "A simple breathing technique widely used in therapy to calm the nervous system before bed.",
      body: [
        "The 4-7-8 technique is based on pranayama (classical yogic breathing): inhale through the nose for 4 seconds, hold for 7 seconds, then exhale slowly through the mouth for 8 seconds.",
        "The longer exhale helps activate the parasympathetic nervous system — the system responsible for \"rest and digest\", the opposite of the \"fight or flight\" stress response.",
        "You can try this right inside the app, in your Personal Dashboard — there's a visual guide that paces the rhythm for you so you don't have to count in your head.",
        "A gentle note: don't push yourself to get it perfect the first time. Just 4 cycles each night is enough for your body to gradually adjust.",
      ],
    },
  },
  {
    slug: "cach-vuot-qua-co-don",
    category: "expert",
    tags: ["cô đơn", "kết nối"],
    moodTags: ["loneliness", "sadness"],
    readingTimeMinutes: 5,
    author: { name: "TS. Phạm Hải Yến", credentials: "Tiến sĩ Tâm lý học Xã hội" },
    coverGradient: "linear-gradient(135deg, #031020 0%, #041828 60%, #4FD1C5 140%)",
    coverEmoji: "🌙",
    vi: {
      title: "Cảm giác lạc lõng không có nghĩa là bạn cô đơn mãi mãi",
      excerpt: "Phân biệt giữa \"ở một mình\" và \"cô đơn\" — và vì sao việc thừa nhận cảm giác này lại là bước đầu quan trọng.",
      body: [
        "Cô đơn không phải lúc nào cũng đến từ việc thiếu người xung quanh. Nhiều người vẫn cảm thấy lạc lõng ngay giữa một nhóm bạn ồn ào — vì cô đơn thực chất là cảm giác thiếu kết nối có ý nghĩa, không phải thiếu số lượng tương tác.",
        "Nghiên cứu tâm lý học xã hội chỉ ra rằng việc chia sẻ một cảm xúc thật — dù ẩn danh, dù chỉ với một người lạ — vẫn có thể giảm đáng kể cảm giác cô đơn, vì não bộ ghi nhận đó là một kết nối thật.",
        "Đó cũng là lý do những không gian ẩn danh như Solace có giá trị: bạn không cần phải \"diễn\" để được chấp nhận, và điều đó tự nó đã là một hình thức kết nối chân thật.",
        "Nếu cảm giác lạc lõng kéo dài và đi kèm mất hứng thú với mọi thứ, đó có thể là dấu hiệu cần thêm sự hỗ trợ chuyên môn — không phải điều gì phải giấu diếm hay xấu hổ.",
      ],
    },
  },
  {
    slug: "nhat-ky-biet-on",
    category: "tips",
    tags: ["biết ơn", "thói quen", "nhật ký"],
    moodTags: ["gratitude", "self-care"],
    readingTimeMinutes: 3,
    author: { name: "Đội ngũ Solace", credentials: "Biên tập nội dung sức khoẻ tinh thần" },
    coverGradient: "linear-gradient(135deg, #3B1F0E 0%, #6B3F1F 60%, #F5D67D 140%)",
    coverEmoji: "🌸",
    vi: {
      title: "Viết nhật ký biết ơn mỗi tối — thử trong 7 ngày",
      excerpt: "Một thói quen nhỏ, tốn chưa đến 2 phút mỗi ngày, nhưng có thể thay đổi cách bạn nhìn lại một ngày đã qua.",
      body: [
        "Mỗi tối trước khi ngủ, viết ra đúng 3 điều — dù nhỏ đến đâu — khiến bạn thấy dễ chịu trong ngày hôm đó. Có thể chỉ là một tách trà ấm, một tin nhắn từ bạn cũ, hay việc bạn đã hoàn thành một việc khó.",
        "Việc này không phủ nhận những khó khăn bạn đang trải qua — nó chỉ giúp não bộ luyện tập việc nhận ra những điều tốt vẫn tồn tại song song, thay vì chỉ tập trung vào phần nặng nề.",
        "Bạn có thể dùng chính trang /write của Solace cho việc này — không nhất thiết phải thả lên bầu trời hay đại dương, chỉ cần viết ra cho chính mình cũng đã có giá trị rồi.",
      ],
    },
  },
  {
    slug: "giac-ngu-ngon-hon",
    category: "exercises",
    tags: ["giấc ngủ", "thói quen buổi tối"],
    moodTags: ["sleep", "stress"],
    readingTimeMinutes: 4,
    author: { name: "ThS. Đỗ Thu Hà", credentials: "Chuyên gia tư vấn Giấc ngủ & Nhịp sinh học" },
    coverGradient: "linear-gradient(135deg, #0a0e17 0%, #1A0533 60%, #C084FC 140%)",
    coverEmoji: "🌌",
    vi: {
      title: "Thói quen nhỏ giúp bạn ngủ ngon hơn mỗi đêm",
      excerpt: "Giấc ngủ không chỉ là chuyện của số giờ — mà còn là chất lượng của 30 phút trước khi bạn nhắm mắt.",
      body: [
        "Giảm ánh sáng xanh (điện thoại, laptop) ít nhất 30 phút trước khi ngủ — ánh sáng xanh ức chế melatonin, hormone giúp bạn buồn ngủ tự nhiên.",
        "Giữ giờ đi ngủ và thức dậy cố định, kể cả cuối tuần — nhịp sinh học thích sự đều đặn hơn là \"ngủ bù\".",
        "Nếu đầu óc cứ quay cuồng suy nghĩ, hãy thử viết chúng ra giấy (hoặc vào /write) thay vì cố \"không nghĩ về nó\" — não bộ thường buông bỏ dễ hơn khi đã được \"ghi lại\" ở đâu đó.",
        "Phòng ngủ mát, tối và yên tĩnh vẫn là ba yếu tố nền tảng — đơn giản nhưng thường bị bỏ qua.",
      ],
    },
  },
  {
    slug: "cham-soc-ban-than-that-su-la-gi",
    category: "expert",
    tags: ["chăm sóc bản thân", "ranh giới"],
    moodTags: ["self-care", "sadness"],
    readingTimeMinutes: 5,
    author: { name: "ThS. Nguyễn Lan Anh", credentials: "Thạc sĩ Tâm lý lâm sàng, 8 năm tư vấn" },
    coverGradient: "linear-gradient(135deg, #3B1F0E 0%, #8B6200 60%, #F5D67D 140%)",
    coverEmoji: "🕊️",
    vi: {
      title: "Chăm sóc bản thân không phải là ích kỷ",
      excerpt: "Vì sao việc nói \"không\" hoặc dành thời gian cho chính mình lại thường bị hiểu lầm — và không nên bị hiểu lầm.",
      body: [
        "Nhiều người lớn lên với niềm tin rằng đặt nhu cầu của mình lên trước là ích kỷ. Nhưng chăm sóc bản thân thực chất là điều kiện cần để bạn có thể tiếp tục quan tâm đến người khác một cách bền vững.",
        "Chăm sóc bản thân không nhất thiết là những điều lớn lao — đôi khi chỉ là cho phép mình nghỉ ngơi khi mệt, hoặc từ chối một việc mà bạn biết sẽ khiến mình kiệt sức.",
        "Ranh giới lành mạnh không đẩy người khác ra xa — chúng giúp mối quan hệ bền hơn, vì bạn tương tác từ một nơi đầy đủ, không phải từ sự cạn kiệt.",
      ],
    },
  },
  {
    slug: "chia-se-cong-dong-vuot-qua-ky-thi",
    category: "community",
    tags: ["kỳ thi", "áp lực học tập"],
    moodTags: ["anxiety", "stress"],
    readingTimeMinutes: 4,
    author: { name: "Một thành viên ẩn danh của Trạm", credentials: "Chia sẻ cộng đồng — đã được đội ngũ biên tập & kiểm duyệt" },
    coverGradient: "linear-gradient(135deg, #072034 0%, #3A2E5C 60%, #F5D67D 140%)",
    coverEmoji: "🌱",
    vi: {
      title: "Mình đã vượt qua kỳ thi tồi tệ nhất như thế nào",
      excerpt: "Một chia sẻ được tuyển chọn từ cộng đồng Solace — không phải nội dung tự do đăng tải, mà đã qua biên tập kỹ.",
      body: [
        "Mình từng nghĩ một kỳ thi trượt sẽ là dấu chấm hết. Nhưng nhìn lại, điều thực sự giúp mình vượt qua không phải là \"cố gắng hơn\" mà là cho phép bản thân buồn trong vài ngày trước khi đứng dậy.",
        "Mình bắt đầu viết ra cảm xúc mỗi tối — không phải để giải quyết vấn đề, chỉ để không phải mang nó một mình suốt cả ngày.",
        "Hoá ra, thất bại một lần không định nghĩa con người mình. Nó chỉ là một chương, không phải toàn bộ câu chuyện.",
      ],
    },
  },
  {
    slug: "chia-se-cong-dong-hoc-cach-noi-khong",
    category: "community",
    tags: ["ranh giới", "công việc"],
    moodTags: ["stress", "self-care"],
    readingTimeMinutes: 4,
    author: { name: "Một thành viên ẩn danh của Trạm", credentials: "Chia sẻ cộng đồng — đã được đội ngũ biên tập & kiểm duyệt" },
    coverGradient: "linear-gradient(135deg, #0E4D5C 0%, #072034 60%, #4FD1C5 140%)",
    coverEmoji: "🌱",
    vi: {
      title: "Học cách nói \"không\" đã thay đổi mình thế nào",
      excerpt: "Một chia sẻ được tuyển chọn từ cộng đồng — về hành trình học cách đặt ranh giới mà không thấy tội lỗi.",
      body: [
        "Suốt nhiều năm mình luôn là người nhận thêm việc, dù đã quá tải, vì sợ làm người khác thất vọng. Cho đến khi mình kiệt sức thật sự.",
        "Điều thay đổi mọi thứ là học cách nói \"để mình xem lại lịch rồi trả lời sau\" thay vì đồng ý ngay lập tức — nó cho mình không gian để quyết định thay vì phản xạ theo nỗi sợ.",
        "Nói không với một việc, đôi khi chính là nói có với sức khoẻ tinh thần của chính mình.",
      ],
    },
  },
  {
    slug: "meo-binh-tinh-truoc-phong-van",
    category: "tips",
    tags: ["phỏng vấn", "lo âu xã hội"],
    moodTags: ["anxiety", "stress"],
    readingTimeMinutes: 3,
    author: { name: "Đội ngũ Solace", credentials: "Biên tập nội dung sức khoẻ tinh thần" },
    coverGradient: "linear-gradient(135deg, #1A0533 0%, #072034 60%, #22D3EE 140%)",
    coverEmoji: "💡",
    vi: {
      title: "3 mẹo giữ bình tĩnh trước buổi phỏng vấn quan trọng",
      excerpt: "Vài điều đơn giản có thể làm trước và trong buổi phỏng vấn để hạ bớt hồi hộp.",
      body: [
        "1. Đến sớm 10-15 phút và dùng khoảng thời gian đó để hít thở chậm, thay vì ôn lại câu trả lời liên tục — não cần thời gian để bình tĩnh, không chỉ để chuẩn bị nội dung.",
        "2. Trước khi bắt đầu, tự nhắc bản thân: \"Đây là một cuộc trò chuyện hai chiều, không phải một bài kiểm tra một chiều\" — điều này giúp giảm áp lực phải \"hoàn hảo\".",
        "3. Nếu khựng lại giữa câu trả lời, một khoảng lặng ngắn hoàn toàn ổn — không cần lấp đầy im lặng bằng mọi giá.",
      ],
    },
  },
];

export function getArticleBySlug(slug: string): LibraryArticle | undefined {
  return LIBRARY_ARTICLES.find((a) => a.slug === slug);
}

export function getArticleTranslation(article: LibraryArticle, lang: "vi" | "en") {
  if (lang === "en" && article.en) {
    return { ...article.en, isFallback: false };
  }
  return { ...article.vi, isFallback: lang === "en" };
}

/** Gợi ý bài viết theo mood — spec 5.3 "Dashboard gợi ý bài theo mood
 * pattern" + "sau khi release story mood thấp → gợi ý 1-2 bài liên quan".
 * Heuristic đơn giản, chạy hoàn toàn client-side trên dữ liệu mock. */
export function suggestArticlesForMood(avgMood: number | null, limit = 2): LibraryArticle[] {
  let targetTags: MoodTag[];
  if (avgMood === null) {
    targetTags = ["self-care"];
  } else if (avgMood <= 3.5) {
    targetTags = ["sadness", "anxiety", "loneliness"];
  } else if (avgMood <= 6.5) {
    targetTags = ["stress", "self-care", "sleep"];
  } else {
    targetTags = ["gratitude", "self-care"];
  }
  const matches = LIBRARY_ARTICLES.filter((a) => a.moodTags.some((t) => targetTags.includes(t)));
  return (matches.length > 0 ? matches : LIBRARY_ARTICLES).slice(0, limit);
}
