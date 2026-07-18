// Mô hình dữ liệu "Câu chuyện" (Story) — spec Module 2.1:
// "Mỗi ngôi sao / bong bóng = một câu chuyện", không còn gọi là
// "signal / thông điệp" ở tầng sản phẩm. File giữ tên cũ (mockSignals.ts)
// để tránh phải sửa đường dẫn import ở khắp nơi, nhưng toàn bộ kiểu dữ
// liệu export ra đều dùng ngôn ngữ "Story".
import { StoryStatus } from "./moderation";
import { IdentityIcon, IdentityVibe } from "./identity";

export type StoryType = "star" | "bubble";
export type WarmthLevel = "few" | "some" | "many";

/** Snapshot danh tính ẩn danh của người viết tại thời điểm thả câu chuyện.
 * KHÔNG hiển thị cho người khác xem trong /explore — chỉ là metadata nội
 * bộ (vd. để sau này người viết xem lại chính câu chuyện của mình ở
 * /history), giữ đúng nguyên tắc ẩn danh hoàn toàn khi duyệt không gian
 * chung (mục A6, A8). */
export interface StoryAuthor {
  name: string;
  vibe: IdentityVibe;
  icon?: IdentityIcon; // chỉ Guest mới có icon preset; Registered dùng avatar AI riêng
}

export interface Story {
  id: string;
  type: StoryType;
  content: string;
  x: number; // vị trí ngang, % trong không gian
  y: number; // vị trí dọc, % trong không gian
  size: "sm" | "md" | "lg";
  /** Nhãn định tính thay cho số lượt — spec A8 Bước 4: "không hiển thị số
   * lượt xem/số lượt gửi tia sáng dưới dạng con số lớn". Được suy ra từ
   * reactionCount qua warmthFromCount(), không set tay. */
  warmth: WarmthLevel;
  /** Số liệu thật, dùng NỘI BỘ để tính warmth — không hiển thị trực tiếp
   * cho người dùng (spec Module 2.1 "metadata story: reaction_count"). */
  reactionCount: number;
  /** Mức cảm xúc (1–10) lúc người viết thả câu chuyện — spec Module 2.1
   * "mood_at_release". null với vài câu chuyện mẫu không rõ mood gốc. */
  moodAtRelease: number | null;
  /** Epoch ms lúc thả — spec Module 2.1 "created_at". */
  createdAt: number;
  /** Nhãn hiển thị tương đối (vd. "2 giờ trước") dùng trong UI hiện tại. */
  createdAgo: string;
  status: StoryStatus;
  /** Ẩn danh — xem StoryAuthor. */
  author: StoryAuthor;
}

export function warmthFromCount(count: number): WarmthLevel {
  if (count >= 4) return "many";
  if (count >= 1) return "some";
  return "few";
}

export function warmthLabel(level: WarmthLevel): string {
  switch (level) {
    case "many":
      return "Đã có nhiều tia sáng gửi đến";
    case "some":
      return "Đã có vài tia sáng gửi đến";
    default:
      return "Vừa được thả lên, chưa ai chạm vào";
  }
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const agoMs = (ms: number) => Date.now() - ms;
const MOCK_AUTHOR: StoryAuthor = { name: "Người Ẩn Danh", vibe: "cozy", icon: "soft-spark" };

// =====================================================
// Sinh dữ liệu mẫu THẬT NHIỀU và trải THẬT RỘNG khắp không gian ảo, thay
// vì một nhúm nhỏ vài câu chuyện — đúng tinh thần "một không gian ảo để
// tìm thấy điều bí ẩn". Dùng công thức giả-ngẫu-nhiên có seed cố định
// (KHÔNG dùng Math.random()) để toạ độ luôn giống nhau giữa server và
// client — tránh lỗi hydration mismatch của Next.js.
// =====================================================

/** Giả-ngẫu-nhiên xác định (deterministic) trong khoảng [0, 1), seed cố định. */
function seeded(seed: number): number {
  const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Chia không gian 4–94% thành lưới ô đều nhau rồi jitter nhẹ trong từng ô
 * — đảm bảo phủ khắp mọi góc (không co cụm) nhưng vẫn có vẻ tự nhiên,
 * không thẳng hàng máy móc. */
function buildSpread(count: number, seedBase: number): { x: number; y: number }[] {
  const cols = Math.ceil(Math.sqrt(count * 1.4)); // hơi rộng hơn hình vuông để đỡ chật theo chiều ngang
  const rows = Math.ceil(count / cols);
  const span = 90; // 4..94
  const cellW = span / cols;
  const cellH = span / rows;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jx = (seeded(seedBase + i * 2.13 + 1) - 0.5) * cellW * 0.8;
    const jy = (seeded(seedBase + i * 3.71 + 2) - 0.5) * cellH * 0.8;
    points.push({
      x: Math.min(95, Math.max(3, 4 + col * cellW + cellW / 2 + jx)),
      y: Math.min(95, Math.max(3, 4 + row * cellH + cellH / 2 + jy)),
    });
  }
  return points;
}

const SIZE_CYCLE: Story["size"][] = ["sm", "md", "lg", "sm", "md"];

function buildMockStories(type: StoryType, content: string[], count: number, seedBase: number): Story[] {
  const points = buildSpread(count, seedBase);
  const prefix = type === "star" ? "s" : "o";
  return points.map((p, i) => {
    // reactionCount lệch phân phối: phần lớn thấp (0-3), một số ít rất cao
    // (8-14) để tạo ra vài "ngôi sao sáng nhất" nổi bật thật sự trên bản đồ.
    const roll = seeded(seedBase + i * 5.09 + 11);
    const reactionCount =
      roll > 0.88 ? 9 + Math.floor(seeded(seedBase + i * 7.31 + 13) * 6) : Math.floor(roll * 4.2);
    const hoursAgo = 1 + Math.floor(seeded(seedBase + i * 4.47 + 17) * 120);
    const moodAtRelease = 2 + Math.floor(seeded(seedBase + i * 6.61 + 19) * 8);
    return {
      id: `${prefix}${i + 1}`,
      type,
      content: content[i % content.length],
      x: Number(p.x.toFixed(1)),
      y: Number(p.y.toFixed(1)),
      size: SIZE_CYCLE[i % SIZE_CYCLE.length],
      warmth: warmthFromCount(reactionCount),
      reactionCount,
      moodAtRelease,
      createdAt: agoMs(hoursAgo * HOUR),
      createdAgo: hoursAgo < 24 ? `${hoursAgo} giờ trước` : `${Math.floor(hoursAgo / 24)} ngày trước`,
      status: "visible",
      author: MOCK_AUTHOR,
    };
  });
}

const SKY_CONTENT = [
  "Dạo này mình thấy áp lực thi cử đè nặng quá, không dám nói với ai vì sợ bị so sánh.",
  "Mình mệt vì cứ phải tỏ ra ổn trước mặt mọi người, dù bên trong không hề ổn.",
  "Hôm nay mình với bố mẹ lại cãi nhau vì điểm số. Chỉ ước một lần được lắng nghe thôi.",
  "Cảm giác lạc lõng giữa một nhóm bạn ồn ào, không biết mình thuộc về đâu.",
  "Mình vừa chia tay một tình bạn thân thiết. Nhẹ nhõm một chút, nhưng cũng buồn nhiều.",
  "Có những đêm mình cứ nằm nhìn trần nhà, đầu óc quay cuồng những điều chưa làm được.",
  "Có một ước mơ mình chưa dám kể với ai vì sợ bị cười.",
  "Mình nhớ nhà quá, dù chỉ mới xa nhà có một tuần.",
  "Không biết từ khi nào mình bắt đầu so sánh bản thân với tất cả mọi người trên mạng.",
  "Mình sợ lớn lên sẽ trở thành người mà chính mình từng ghét.",
  "Có lẽ mình chỉ cần ai đó hỏi 'hôm nay cậu ổn không' là đủ rồi.",
  "Đôi khi mình cười rất nhiều nhưng chẳng nhớ lần cuối vui thật là khi nào.",
  "Mình đang cố học cách tha thứ cho những sai lầm của tuổi mới lớn.",
  "Ước gì có ai đó nói với mình rằng chậm một nhịp cũng không sao.",
  "Tối nay bầu trời đẹp quá, ước gì có người để cùng ngắm.",
  "Mình sợ nói ra sẽ làm phiền người khác, nên cứ giữ mãi trong lòng.",
  "Có những ngày mình chỉ muốn biến mất một lúc, không phải mãi mãi, chỉ một lúc thôi.",
  "Mình ghen tị với những người có vẻ biết chính xác họ muốn gì trong đời.",
  "Đêm nay mình lại thức để nghĩ về những điều đã lỡ nói ra.",
  "Có lẽ ai cũng đang gồng lên một chút, chỉ là không ai nói ra thôi.",
];

const OCEAN_CONTENT = [
  "Mình vừa nộp hồ sơ xin việc lần thứ 12. Bắt đầu nghi ngờ năng lực của bản thân.",
  "Cảm ơn vì đã đọc đến đây — mình chỉ cần một nơi để thở ra thôi.",
  "Mình sợ làm ba mẹ thất vọng nếu chọn ngành học mình thực sự thích.",
  "Tối nay mất ngủ lần thứ ba trong tuần. Đầu cứ nghĩ về mọi thứ chưa hoàn thành.",
  "Mình đang học cách tha thứ cho bản thân vì đã không mạnh mẽ mỗi ngày.",
  "Có lẽ mình chỉ cần ai đó nói rằng chậm một chút cũng không sao.",
  "Có những ngày mình chỉ muốn được ai đó ôm một cái thật chặt, không cần nói gì.",
  "Mình đang cố học cách ở một mình mà không thấy cô đơn.",
  "Đôi khi mình ước mình có thể tạm dừng thời gian một chút, chỉ để thở.",
  "Mình vừa khóc trong nhà vệ sinh công ty. Không ai biết cả.",
  "Có những lời mình ước gì đã nói trước khi quá muộn.",
  "Mình mệt vì phải luôn là người mạnh mẽ trong mắt mọi người.",
  "Không biết từ bao giờ, mình quên mất cảm giác thật sự vui vẻ là gì.",
  "Mình sợ nếu dừng lại nghỉ ngơi, mình sẽ bị bỏ lại phía sau.",
  "Đại dương ơi, giữ giúp mình bí mật này một chút được không?",
  "Có những ngày chỉ cần trôi qua bình yên là đã đủ mừng rồi.",
  "Mình chưa từng nói với ai rằng mình cũng sợ hãi nhiều lắm.",
  "Có lẽ mình cần học cách xin lỗi bản thân trước khi xin lỗi người khác.",
  "Áp lực phải trưởng thành nhanh khiến mình quên mất cách làm trẻ con.",
  "Ước gì có ai đó nhắc mình rằng nghỉ ngơi không phải là yếu đuối.",
];

export const MOCK_SKY_STORIES: Story[] = buildMockStories("star", SKY_CONTENT, 34, 101.7);
export const MOCK_OCEAN_STORIES: Story[] = buildMockStories("bubble", OCEAN_CONTENT, 34, 211.3);
