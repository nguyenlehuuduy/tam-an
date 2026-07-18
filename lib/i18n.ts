// =====================================================
// MODULE 8 — Song ngữ Anh–Việt (bước khởi tạo hạ tầng i18n)
// -----------------------------------------------------
// Phạm vi đã chuyển sang dùng dict này ở lượt triển khai này: reaction
// presets/quick reactions, /library, /settings, /settings/feedback, và
// notification copy — tức đúng những khu vực spec 8.1 đánh dấu "⚠️ cần
// chuyển" hoặc "❌ cần tạo". Các màn hình lớn đã có từ trước (checkin,
// write, explore, ritual, dashboard) vẫn đang hardcode tiếng Việt — việc
// dịch lại toàn bộ những màn đó là một khối việc riêng, chưa nằm trong
// đợt này, xin để lại như một việc cần làm tiếp theo rõ ràng.
//
// Quy tắc (8.2): mặc định tiếng Việt. Nếu ngôn ngữ đang chọn là "en" mà
// key không có bản dịch, translate() tự rơi về bản tiếng Việt — không bao
// giờ trả về chuỗi rỗng.
// =====================================================

export type Language = "vi" | "en";

export const VI = {
  common: {
    back: "Quay lại",
    cancel: "Huỷ",
    save: "Lưu thay đổi",
    close: "Đóng",
    loading: "Đang tải...",
    comingSoon: "Sắp ra mắt",
  },
  reactions: {
    categories: {
      emotion: "Cảm xúc",
      sticker: "Sticker",
      hug: "Ôm",
      gift: "Món quà",
      message: "Lời nhắn",
    },
    presets: {
      notAlone: "Bạn không cô đơn đâu",
      iHearYou: "Mình đang lắng nghe bạn",
      letItDrift: "Mọi chuyện rồi sẽ qua",
      warmHug: "Gửi bạn một cái ôm ấm áp",
      lighterTomorrow: "Ngày mai trời lại sáng",
      brave: "Bạn đã rất can đảm rồi",
      imHere: "Dù thế nào, vẫn có mình ở đây",
      shiningStar: "Bạn xứng đáng được bình yên",
    },
    quickEmotions: {
      warm: "Ấm lòng",
      grow: "Cùng lớn lên",
      shine: "Toả sáng",
      hope: "Hy vọng",
    },
    stickers: {
      hugSticker: "Cái ôm",
      moon: "Ánh trăng",
      wave: "Con sóng",
      candle: "Ngọn nến",
      starSticker: "Ngôi sao",
      letter: "Lá thư",
      giftSticker: "Món quà",
    },
    gifts: {
      starMiniLabel: "Một ngôi sao nhỏ",
      starMiniDesc: "Thả thêm một chút ánh sáng cho câu chuyện này",
      lightBubbleLabel: "Bong bóng ánh sáng",
      lightBubbleDesc: "Giúp câu chuyện này nổi bật và ấm hơn",
      petalLabel: "Một cánh hoa",
      petalDesc: "Một lời an ủi dịu dàng, không cần nói ra",
    },
    hug: {
      caption: "Gửi một cái ôm thật chặt — không cần nói gì thêm cũng được",
    },
    done: {
      emotionTitle: "Cảm xúc của bạn đã được gửi đi 💙",
      emotionSubtitle: "Chỉ một chạm thôi, nhưng đủ để họ biết có người đang đồng cảm.",
      stickerTitle: "Sticker đã bay đến rồi ✨",
      stickerSubtitle: "Đôi khi một hình ảnh nhỏ cũng đủ làm ấm lòng ai đó.",
      hugTitle: "Một cái ôm đã được gửi đi 🫂",
      hugSubtitle: "Không cần lời nói — chỉ cần biết có người đang ở đây.",
      giftTitle: "Món quà nhỏ đã đến nơi 🎁",
    },
  },
  library: {
    title: "Thư viện kiến thức",
    subtitle: "Bài viết, mẹo nhỏ và bài tập được tuyển chọn để đồng hành cùng bạn.",
    searchPlaceholder: "Tìm theo từ khoá, cảm xúc...",
    categories: {
      all: "Tất cả",
      expert: "Bài viết chuyên gia",
      tips: "Mẹo cải thiện tâm trạng",
      exercises: "Bài tập / Guided",
      community: "Chia sẻ cộng đồng",
    },
    moodTagsLabel: "Phù hợp khi bạn đang thấy",
    readingTimeSuffix: "phút đọc",
    byAuthor: "bởi",
    relatedLabel: "Bài viết liên quan",
    fallbackNotice: "Bài viết này chưa có bản tiếng Anh — đang hiển thị bản tiếng Việt.",
    emptyState: "Không tìm thấy bài viết phù hợp.",
    suggestedForYou: "Gợi ý dành cho bạn",
    suggestedReason: "Dựa trên xu hướng cảm xúc gần đây của bạn",
    readMore: "Đọc tiếp",
  },
  notifications: {
    title: "Thông báo",
    empty: "Chưa có thông báo nào.",
    markAllRead: "Đánh dấu đã đọc tất cả",
    groups: {
      today: "Hôm nay",
      thisWeek: "Tuần này",
      earlier: "Trước đó",
    },
  },
  settings: {
    title: "Cài đặt",
    account: {
      title: "Tài khoản",
      displayName: "Tên hiển thị",
      avatar: "Avatar",
      regenerateAvatar: "Tạo avatar khác",
      email: "Email",
      accountType: "Loại tài khoản",
      guest: "Khách (Guest)",
      registered: "Đã đăng ký",
      loginCta: "Đăng nhập để đặt tên riêng & avatar AI",
    },
    notifications: {
      title: "Thông báo",
      inApp: "Trong ứng dụng",
      email: "Email",
      frequency: "Tần suất email",
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      off: "Tắt",
    },
    language: { title: "Ngôn ngữ" },
    sound: { title: "Âm thanh" },
    vibe: { title: "Vibe / Giao diện cảm xúc" },
    feedback: { title: "Góp ý", cta: "Gửi góp ý cho Solace" },
    about: {
      title: "Về Solace",
      mission: "Sứ mệnh",
      missionText:
        "Solace là không gian ẩn danh để mọi người viết ra điều đang nặng lòng, và nhận lại sự đồng cảm ấm áp từ cộng đồng — không phán xét, không cần danh tính.",
      privacy: "Chính sách riêng tư",
      terms: "Điều khoản sử dụng",
      hotline: "Đường dây hỗ trợ",
    },
    version: "Phiên bản",
    logout: "Đăng xuất",
    resetSession: "Đặt lại phiên Khách",
    resetSessionConfirm: "Thao tác này sẽ xoá toàn bộ dữ liệu cục bộ (danh tính, câu chuyện, cảm xúc...) trên thiết bị này. Bạn chắc chứ?",
  },
  feedback: {
    title: "Góp ý",
    subtitle: "Trạm luôn muốn nghe từ bạn — mọi góp ý đều được đọc.",
    category: "Loại góp ý",
    categories: {
      bug: "Lỗi (Bug)",
      feature: "Đề xuất tính năng",
      ux: "Trải nghiệm sử dụng",
      content: "Nội dung",
      other: "Khác",
    },
    rating: "Bạn đánh giá trải nghiệm này thế nào? (tuỳ chọn)",
    message: "Nội dung góp ý",
    messagePlaceholder: "Kể cho Trạm nghe điều bạn đang nghĩ...",
    attachScreenshot: "Đính kèm ảnh chụp màn hình (tuỳ chọn)",
    removeAttachment: "Xoá ảnh",
    submit: "Gửi góp ý",
    submitted: "Cảm ơn bạn đã dành thời gian góp ý! 💛",
    contextNote: "Trạm sẽ tự động đính kèm: trang hiện tại, mood gần nhất, phiên bản app và loại thiết bị — không kèm bất kỳ thông tin định danh nào khác.",
  },
} as const;

// EN — cố ý chưa dịch đầy đủ phần "library" (chỉ 1 vài bài mẫu có bản
// dịch riêng ở lib/libraryContent.ts) để minh hoạ đúng quy tắc fallback
// 8.2: phần nào chưa dịch thì translate() tự rơi về tiếng Việt.
export const EN: DeepPartial<typeof VI> = {
  common: {
    back: "Back",
    cancel: "Cancel",
    save: "Save changes",
    close: "Close",
    loading: "Loading...",
    comingSoon: "Coming soon",
  },
  reactions: {
    categories: {
      emotion: "Emotion",
      sticker: "Sticker",
      hug: "Hug",
      gift: "Gift",
      message: "Message",
    },
    presets: {
      notAlone: "You're not alone",
      iHearYou: "I'm listening to you",
      letItDrift: "This will pass",
      warmHug: "Sending you a warm hug",
      lighterTomorrow: "Tomorrow will be brighter",
      brave: "You were so brave",
      imHere: "Whatever happens, I'm here",
      shiningStar: "You deserve peace",
    },
    quickEmotions: {
      warm: "Warmth",
      grow: "Growing together",
      shine: "Shine on",
      hope: "Hope",
    },
    stickers: {
      hugSticker: "Hug",
      moon: "Moonlight",
      wave: "Wave",
      candle: "Candle",
      starSticker: "Star",
      letter: "Letter",
      giftSticker: "Gift",
    },
    gifts: {
      starMiniLabel: "A little star",
      starMiniDesc: "Add a bit more light to this story",
      lightBubbleLabel: "Bubble of light",
      lightBubbleDesc: "Make this story glow a little brighter",
      petalLabel: "A single petal",
      petalDesc: "A gentle comfort, no words needed",
    },
    hug: {
      caption: "Send a tight hug — no words needed",
    },
    done: {
      emotionTitle: "Your feeling was sent 💙",
      emotionSubtitle: "Just one tap, but enough for them to know someone understands.",
      stickerTitle: "Your sticker flew over ✨",
      stickerSubtitle: "Sometimes a small image is enough to warm someone's heart.",
      hugTitle: "A hug was sent 🫂",
      hugSubtitle: "No words needed — just knowing someone is here.",
      giftTitle: "A small gift has arrived 🎁",
    },
  },
  notifications: {
    title: "Notifications",
    empty: "No notifications yet.",
    markAllRead: "Mark all as read",
    groups: {
      today: "Today",
      thisWeek: "This week",
      earlier: "Earlier",
    },
  },
  settings: {
    title: "Settings",
    account: {
      title: "Account",
      displayName: "Display name",
      avatar: "Avatar",
      regenerateAvatar: "Regenerate avatar",
      email: "Email",
      accountType: "Account type",
      guest: "Guest",
      registered: "Registered",
      loginCta: "Sign in to set a custom name & AI avatar",
    },
    notifications: {
      title: "Notifications",
      inApp: "In-app",
      email: "Email",
      frequency: "Email frequency",
      daily: "Daily",
      weekly: "Weekly",
      off: "Off",
    },
    language: { title: "Language" },
    sound: { title: "Sound" },
    vibe: { title: "Vibe / Emotional theme" },
    feedback: { title: "Feedback", cta: "Send feedback to Solace" },
    about: {
      title: "About Solace",
      mission: "Mission",
      missionText:
        "Solace is an anonymous space to write down what's weighing on your heart, and receive warm empathy from the community — no judgment, no identity required.",
      privacy: "Privacy policy",
      terms: "Terms of use",
      hotline: "Support hotline",
    },
    version: "Version",
    logout: "Log out",
    resetSession: "Reset guest session",
    resetSessionConfirm: "This will erase all local data (identity, stories, mood history...) on this device. Are you sure?",
  },
  feedback: {
    title: "Feedback",
    subtitle: "We'd love to hear from you — every note is read.",
    category: "Feedback type",
    categories: {
      bug: "Bug",
      feature: "Feature request",
      ux: "User experience",
      content: "Content",
      other: "Other",
    },
    rating: "How was your experience? (optional)",
    message: "Your feedback",
    messagePlaceholder: "Tell us what's on your mind...",
    attachScreenshot: "Attach a screenshot (optional)",
    removeAttachment: "Remove image",
    submit: "Send feedback",
    submitted: "Thanks for taking the time to share! 💛",
    contextNote: "We'll automatically attach: current page, latest mood, app version and device type — no other identifying info.",
  },
};

// Với leaf là string literal (do VI khai báo `as const`), ánh xạ về kiểu
// `string` chung để EN có thể chứa bản dịch khác nội dung mà vẫn hợp lệ
// kiểu — chỉ giữ ràng buộc object ở các cấp lồng nhau.
type DeepPartial<T> = T extends string
  ? string
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/** Tra cứu chuỗi theo ngôn ngữ, tự rơi về tiếng Việt nếu chưa có bản dịch
 * (spec 8.2). Không bao giờ trả về rỗng — nếu cả 2 đều thiếu thì trả lại
 * chính key (dễ phát hiện thiếu dịch khi rà soát UI). */
export function translate(lang: Language, path: string): string {
  if (lang === "en") {
    const enVal = getPath(EN, path);
    if (typeof enVal === "string") return enVal;
  }
  const viVal = getPath(VI, path);
  return typeof viVal === "string" ? viVal : path;
}
