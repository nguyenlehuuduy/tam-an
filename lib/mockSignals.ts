import { SignalStatus } from "./moderation";

export type SignalType = "star" | "bubble";
export type WarmthLevel = "few" | "some" | "many";

export interface Signal {
  id: string;
  type: SignalType;
  content: string;
  x: number; // vị trí ngang, % trong không gian
  y: number; // vị trí dọc, % trong không gian
  size: "sm" | "md" | "lg";
  warmth: WarmthLevel; // định tính — KHÔNG hiển thị số đếm cụ thể (A8 Bước 4)
  createdAgo: string;
  status: SignalStatus;
}

// Nhãn định tính thay cho số lượt — spec A8 Bước 4: "không hiển thị số lượt
// xem/số lượt gửi tia sáng dưới dạng con số lớn".
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

export const MOCK_SKY_SIGNALS: Signal[] = [
  { id: "s1", type: "star", content: "Dạo này mình thấy áp lực thi cử đè nặng quá, không dám nói với ai vì sợ bị so sánh.", x: 18, y: 22, size: "md", warmth: "some", createdAgo: "2 giờ trước", status: "visible" },
  { id: "s2", type: "star", content: "Mình mệt vì cứ phải tỏ ra ổn trước mặt mọi người, dù bên trong không hề ổn.", x: 62, y: 15, size: "sm", warmth: "many", createdAgo: "hôm qua", status: "visible" },
  { id: "s3", type: "star", content: "Hôm nay mình với bố mẹ lại cãi nhau vì điểm số. Chỉ ước một lần được lắng nghe thôi.", x: 40, y: 46, size: "lg", warmth: "few", createdAgo: "5 giờ trước", status: "visible" },
  { id: "s4", type: "star", content: "Cảm giác lạc lõng giữa một nhóm bạn ồn ào, không biết mình thuộc về đâu.", x: 78, y: 55, size: "md", warmth: "some", createdAgo: "3 ngày trước", status: "visible" },
  { id: "s5", type: "star", content: "Mình vừa chia tay một tình bạn thân thiết. Nhẹ nhõm một chút, nhưng cũng buồn nhiều.", x: 25, y: 70, size: "sm", warmth: "some", createdAgo: "1 ngày trước", status: "visible" },
  { id: "s6", type: "star", content: "Có những đêm mình cứ nằm nhìn trần nhà, đầu óc quay cuồng những điều chưa làm được.", x: 55, y: 80, size: "md", warmth: "few", createdAgo: "6 giờ trước", status: "visible" },
];

export const MOCK_OCEAN_SIGNALS: Signal[] = [
  { id: "o1", type: "bubble", content: "Mình vừa nộp hồ sơ xin việc lần thứ 12. Bắt đầu nghi ngờ năng lực của bản thân.", x: 22, y: 30, size: "md", warmth: "some", createdAgo: "4 giờ trước", status: "visible" },
  { id: "o2", type: "bubble", content: "Cảm ơn vì đã đọc đến đây — mình chỉ cần một nơi để thở ra thôi.", x: 68, y: 20, size: "sm", warmth: "many", createdAgo: "hôm qua", status: "visible" },
  { id: "o3", type: "bubble", content: "Mình sợ làm ba mẹ thất vọng nếu chọn ngành học mình thực sự thích.", x: 45, y: 50, size: "lg", warmth: "some", createdAgo: "2 ngày trước", status: "visible" },
  { id: "o4", type: "bubble", content: "Tối nay mất ngủ lần thứ ba trong tuần. Đầu cứ nghĩ về mọi thứ chưa hoàn thành.", x: 78, y: 62, size: "md", warmth: "few", createdAgo: "8 giờ trước", status: "visible" },
  { id: "o5", type: "bubble", content: "Mình đang học cách tha thứ cho bản thân vì đã không mạnh mẽ mỗi ngày.", x: 30, y: 75, size: "sm", warmth: "some", createdAgo: "3 giờ trước", status: "visible" },
  { id: "o6", type: "bubble", content: "Có lẽ mình chỉ cần ai đó nói rằng chậm một chút cũng không sao.", x: 55, y: 85, size: "md", warmth: "many", createdAgo: "1 ngày trước", status: "visible" },
];
