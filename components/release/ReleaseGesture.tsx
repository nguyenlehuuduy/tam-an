"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { SignalType } from "@/lib/mockSignals";
import { playReleaseBubble, playReleaseStar } from "@/lib/sound";
import { useAppState } from "@/context/AppStateContext";

interface ReleaseGestureProps {
  type: SignalType;
  onReleased: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  isBubble: boolean;
}

// Ngưỡng vuốt để kích hoạt nghi thức thả (px)
const THRESHOLD = 90;

export function ReleaseGesture({ type, onReleased }: ReleaseGestureProps) {
  const [releasing, setReleasing] = useState(false);
  const { soundEnabled, mood } = useAppState();
  const isStar = type === "star";
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  function handleDragEnd(_: unknown, info: { offset: { y: number } }) {
    if (releasing) return;
    const triggered = isStar ? info.offset.y < -THRESHOLD : info.offset.y > THRESHOLD;
    if (!triggered) return;

    setReleasing(true);
    
    // Kích hoạt âm thanh hợp âm trị liệu dựa trên mood của người dùng
    if (soundEnabled) {
      isStar ? playReleaseStar(mood) : playReleaseBubble(mood);
    }

    // Kích hoạt vụ nổ bụi sáng
    createExplosion();
  }

  // Khởi tạo các hạt bụi sáng/bong bóng nổ
  function createExplosion() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const count = 40; // Số lượng hạt nổ
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      
      // Hướng bắn của hạt: sao bắn lên trên, bong bóng tỏa ngang và chìm xuống
      const vx = Math.cos(angle) * speed;
      const vy = isStar 
        ? Math.sin(angle) * speed - 1.5 // lực đẩy lên trên
        : Math.sin(angle) * speed + 1.5; // lực kéo xuống dưới

      particles.push({
        x: centerX,
        y: centerY,
        vx,
        vy,
        radius: isStar ? 1.5 + Math.random() * 3.5 : 3 + Math.random() * 5,
        color: isStar ? "#F5D67D" : "#4FD1C5",
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        isBubble: !isStar
      });
    }

    particlesRef.current = particles;
    animateParticles();
  }

  // Vòng lặp vẽ hạt trên Canvas
  function animateParticles() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      // Thêm lực cản và lực nổi tự nhiên
      if (isStar) {
        p.vy -= 0.04; // bay lên tiếp
      } else {
        p.vy += 0.03; // rơi xuống sâu hơn
      }

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      
      if (p.isBubble) {
        // Vẽ bong bóng rỗng ruột cho Ocean
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.stroke();
        // Điểm sáng nhẹ bên trong bong bóng
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, 1, 0, Math.PI * 2);
        ctx.fillStyle = "#FFF";
        ctx.fill();
      } else {
        // Vẽ sao đặc ruột phát sáng cho Sky
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      
      ctx.restore();
    }

    if (particles.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animateParticles);
    }
  }

  // Đảm bảo canvas co giãn khớp kích thước vùng chứa
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 288;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex h-72 w-full max-w-sm items-center justify-center">
      {/* Canvas phụ trách vẽ vụ nổ hạt sáng */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      <p className="pointer-events-none absolute top-0 w-full text-center text-[15px] font-medium text-base-text-secondary">
        {isStar ? "Vuốt lên để thả sao lên bầu trời" : "Vuốt xuống để thả bong bóng xuống đại dương"}
      </p>

      {/* Nơi hiển thị Star hoặc Bubble kéo thả */}
      <motion.div
        drag={releasing ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        animate={
          releasing
            ? {
                y: isStar ? -320 : 320,
                x: isStar ? [0, -15, 20, 0] : [0, 15, -20, 0],
                opacity: [1, 1, 0],
                scale: [1, 1.2, 0.2],
              }
            : { y: 0, opacity: 1, scale: 1 }
        }
        transition={
          releasing
            ? { duration: 1.5, ease: [0.22, 1, 0.36, 1], times: [0, 0.3, 1] }
            : { type: "spring", stiffness: 280, damping: 22 }
        }
        onAnimationComplete={() => {
          if (releasing) onReleased();
        }}
        className={`z-10 flex h-16 w-16 cursor-grab items-center justify-center rounded-full active:cursor-grabbing ${
          isStar ? "bg-sky-gold" : "bg-ocean-bubble/80"
        }`}
        style={{
          boxShadow: isStar
            ? "0 0 35px 10px rgba(245, 214, 125, 0.65)"
            : "0 0 30px 8px rgba(79, 209, 197, 0.55)",
        }}
      />
    </div>
  );
}
