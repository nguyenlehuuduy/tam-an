"use client";

import Link from "next/link";
import { ArrowLeft, Star, Waves, Calendar, Sparkles, TrendingUp } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { useMemo, useState } from "react";
import clsx from "clsx";

export default function HistoryPage() {
  const { userSignals, moodHistory } = useAppState();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Sắp xếp lịch sử cảm xúc theo thời gian tăng dần
  const sortedHistory = useMemo(() => {
    return [...moodHistory].sort((a, b) => a.timestamp - b.timestamp);
  }, [moodHistory]);

  // Tính mức cảm xúc trung bình
  const avgMood = useMemo(() => {
    if (moodHistory.length === 0) return 5;
    const sum = moodHistory.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round((sum / moodHistory.length) * 10) / 10;
  }, [moodHistory]);

  // Lời nhắn hỗ trợ từ trạm dựa trên cảm xúc trung bình
  const supportMessage = useMemo(() => {
    if (avgMood <= 4.5) {
      return "Dạo này bầu trời tâm hồn bạn hơi nhiều mây và trĩu nặng. Hãy cho phép bản thân được chậm lại, uống một tách trà ấm, và nhớ rằng luôn có người sẵn sàng lắng nghe bạn ở Tổng đài 111.";
    }
    if (avgMood <= 7.5) {
      return "Cảm xúc của bạn đang duy trì ở mức cân bằng dễ chịu. Cứ tiếp tục bước đi chậm rãi và bao dung với chính mình nhé, bạn đang làm rất tốt.";
    }
    return "Năng lượng của bạn đang rất nhẹ nhàng và tỏa sáng! Những tia sáng ấm áp từ bạn chắc chắn sẽ là nguồn động viên lớn cho những người xung quanh.";
  }, [avgMood]);

  // Vẽ biểu đồ SVG tùy biến
  const chartWidth = 600;
  const chartHeight = 240;
  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const points = useMemo(() => {
    if (sortedHistory.length === 0) return [];
    
    return sortedHistory.map((entry, index) => {
      const x =
        paddingLeft +
        (index / Math.max(1, sortedHistory.length - 1)) *
          (chartWidth - paddingLeft - paddingRight);
      // Đảo ngược trục Y: 10 nằm trên cùng, 1 nằm dưới cùng
      const y =
        chartHeight -
        paddingBottom -
        ((entry.value - 1) / 9) * (chartHeight - paddingTop - paddingBottom);
      
      const dateLabel = new Date(entry.timestamp).toLocaleDateString("vi-VN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return { x, y, value: entry.value, label: dateLabel };
    });
  }, [sortedHistory]);

  // Chuỗi Path cho đường kẻ và vùng phủ bóng
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    
    // Tạo đường gấp khúc nối các điểm
    const line = `M ${points[0].x} ${points[0].y} ` + 
      points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
      
    // Khép kín vùng để tô gradient
    const area = 
      line +
      ` L ${points[points.length - 1].x} ${chartHeight - paddingBottom}` +
      ` L ${points[0].x} ${chartHeight - paddingBottom} Z`;

    return { linePath: line, areaPath: area };
  }, [points]);

  return (
    <div className="min-h-dvh bg-base-gradient px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Navigation header */}
        <Link
          href="/explore"
          className="mb-6 inline-flex items-center gap-2 text-sm text-base-text-secondary hover:text-base-text-primary transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại không gian khám phá
        </Link>

        <header className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-base-text-primary">
            Nhật Ký Cảm Xúc & Lịch Sử
          </h1>
          <p className="mt-2 text-sm text-base-text-secondary">
            Nơi nhìn lại chặng đường cảm xúc của bạn. Chỉ duy nhất thiết bị của bạn lưu giữ những dữ liệu này.
          </p>
        </header>

        {/* RESPONSIVE GRID LAYOUT: side-by-side on large screens, stacked on small */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Mood Trends & Statistics (lg:col-span-7) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Statistics and Interactive SVG Chart */}
            <div className="rounded-card border border-base-divider bg-base-surface/40 p-5 backdrop-blur shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold tracking-wider uppercase text-base-text-secondary flex items-center gap-2">
                  <TrendingUp size={16} className="text-sky-aurora" /> Xu hướng cảm xúc
                </h2>
                <div className="rounded-full bg-sky-aurora/10 px-3 py-1 text-xs font-semibold text-sky-aurora">
                  Chỉ số TB: {avgMood} / 10
                </div>
              </div>

              {/* Chart visualization */}
              {points.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-base-text-secondary italic">
                  Chưa có đủ dữ liệu tâm trạng để vẽ biểu đồ.
                </div>
              ) : (
                <div className="relative w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full min-w-[500px] h-auto overflow-visible"
                  >
                    <defs>
                      {/* Gradient tô vùng bên dưới đồ thị */}
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C9EFF" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#7C9EFF" stopOpacity="0.0" />
                      </linearGradient>
                      
                      {/* Bộ lọc phát sáng neon cho đường vẽ */}
                      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Các đường kẻ phụ trục ngang (Y-axis gridlines) */}
                    {[1, 5, 10].map((val) => {
                      const y =
                        chartHeight -
                        paddingBottom -
                        ((val - 1) / 9) * (chartHeight - paddingTop - paddingBottom);
                      return (
                        <g key={val} className="opacity-15">
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={chartWidth - paddingRight}
                            y2={y}
                            stroke="#A8B0C3"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            fill="#A8B0C3"
                            className="text-[10px] font-semibold"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Vùng bóng mờ gradient bên dưới biểu đồ */}
                    {areaPath && (
                      <path d={areaPath} fill="url(#areaGradient)" />
                    )}

                    {/* Đường gấp khúc biểu diễn cảm xúc */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#7C9EFF"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#neonGlow)"
                      />
                    )}

                    {/* Các điểm mốc chấm tròn tương tác */}
                    {points.map((p, idx) => {
                      const active = hoveredPoint === idx;
                      return (
                        <g key={idx}>
                          {/* Chấm phát sáng hover */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={active ? 10 : 7}
                            className="fill-base-surface stroke-sky-aurora cursor-pointer transition-all duration-200"
                            strokeWidth={active ? 3 : 2}
                            onMouseEnter={() => setHoveredPoint(idx)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                          {/* Chấm lõi */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="3"
                            className="fill-sky-glow pointer-events-none"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              {/* Tooltip động hiển thị khi rê chuột vào điểm mốc */}
              {hoveredPoint !== null && points[hoveredPoint] && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-4 rounded-xl bg-base-surface border border-sky-aurora/40 px-3.5 py-1.5 shadow-2xl text-center z-20">
                  <p className="text-xs text-base-text-secondary">{points[hoveredPoint].label}</p>
                  <p className="text-sm font-bold text-sky-gold mt-0.5">
                    Mức cảm xúc: {points[hoveredPoint].value} / 10
                  </p>
                </div>
              )}
            </div>

            {/* Supportive feedback card */}
            <div className="rounded-card border border-white/5 bg-white/5 p-5 backdrop-blur flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warm/20 text-warm">
                <Sparkles size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-base-text-primary">Lời khuyên của Trạm</h3>
                <p className="mt-1 text-sm leading-relaxed text-base-text-secondary">
                  {supportMessage}
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE: Personal Journal list of signals (lg:col-span-5) */}
          <section className="lg:col-span-5">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-base-text-secondary mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-ocean-aqua" /> Các nỗi lòng đã thả đi
            </h2>

            {userSignals.length === 0 ? (
              <div className="rounded-card border border-base-divider bg-base-surface/20 p-8 text-center backdrop-blur">
                <p className="text-sm text-base-text-secondary italic">
                  Bạn chưa thả tâm tư nào xuống biển hay lên bầu trời cả.
                </p>
                <Link
                  href="/write"
                  className="mt-4 inline-block text-xs font-bold text-sky-aurora underline underline-offset-4 hover:text-sky-glow"
                >
                  Bắt đầu chia sẻ nỗi lòng ngay
                </Link>
              </div>
            ) : (
              <ul className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {userSignals.map((s) => (
                  <li
                    key={s.id}
                    className="group rounded-card border border-base-divider bg-base-surface/50 p-4 transition-all duration-300 hover:border-white/10 hover:bg-base-surface/80"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-base-text-secondary font-medium">
                      {s.type === "star" ? (
                        <span className="flex items-center gap-1 text-sky-gold">
                          <Star size={12} fill="currentColor" /> Bầu trời
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-ocean-aqua">
                          <Waves size={12} /> Đại dương
                        </span>
                      )}
                      <span>·</span>
                      <span>{s.createdAgo}</span>

                      {s.status === "pending_review" && (
                        <span className="ml-auto rounded-full bg-caution/10 px-2 py-0.5 text-[10px] font-semibold text-caution border border-caution/25">
                          Đang được kiểm duyệt nhẹ nhàng
                        </span>
                      )}
                    </div>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-base-text-primary group-hover:text-white transition-colors">
                      {s.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
