"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SkyCanvas } from "@/components/canvas/SkyCanvas";
import { OceanCanvas } from "@/components/canvas/OceanCanvas";
import { ReleaseGesture } from "@/components/release/ReleaseGesture";
import { HotlineBanner } from "@/components/ui/HotlineBanner";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/context/AppStateContext";

export default function RitualPage() {
  const router = useRouter();
  const { draft, releaseDraft } = useAppState();
  const [phase, setPhase] = useState<"gesture" | "confirm">("gesture");
  const [highRisk, setHighRisk] = useState(false);

  useEffect(() => {
    if (!draft.type || draft.content.trim().length === 0) {
      router.replace("/write");
    }
  }, [draft, router]);

  if (!draft.type) return null;

  const Canvas = draft.type === "star" ? SkyCanvas : OceanCanvas;

  function handleReleased() {
    const result = releaseDraft();
    setHighRisk(Boolean(result?.highRisk));
    setPhase("confirm");
    
    // Nếu nội dung không có nguy cơ cao (highRisk), tự chuyển hướng sau 2.5 giây
    if (!result?.highRisk) {
      const t = setTimeout(() => router.push("/explore"), 2500);
      return () => clearTimeout(t);
    }
  }

  return (
    <Canvas>
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-6 pt-4 md:px-8 md:pb-10 md:pt-6 justify-between items-center">
        
        {/* Header indicator */}
        <header className="w-full flex justify-between items-center z-10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-text-secondary">
            Nghi thức giải tỏa
          </span>
          <span className="text-[11px] italic text-base-text-secondary/70">
            Hít thở sâu và thư giãn...
          </span>
        </header>

        {/* Central gesture widget */}
        <main className="flex flex-1 items-center justify-center w-full my-6 z-10">
          <div className="w-full max-w-md rounded-sheet border border-transparent bg-transparent px-6 py-8 text-center transition-all duration-300 md:border-white/10 md:bg-white/5 md:backdrop-blur-lg md:shadow-2xl md:px-8 md:py-10">
            {phase === "gesture" ? (
              <ReleaseGesture type={draft.type} onReleased={handleReleased} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full text-center"
              >
                <p className="font-display text-xl md:text-2xl font-extrabold text-base-text-primary tracking-tight">
                  Nỗi lòng đã được thả trôi...
                </p>
                <p className="mt-3 text-sm text-base-text-secondary leading-relaxed">
                  Cảm ơn bạn đã can đảm sẻ chia. Hãy thả lỏng và để mọi thứ trôi xuôi theo gió trời hoặc dòng nước.
                </p>

                {highRisk && (
                  <div className="mt-8 text-left">
                    <HotlineBanner />
                    <Button
                      accent={draft.type === "star" ? "sky" : "ocean"}
                      onClick={() => router.push("/explore")}
                      className="mt-6 w-full font-bold shadow-lg"
                    >
                      Khám phá không gian
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>

        {/* Footer info placeholder */}
        <footer className="w-full text-center z-10">
          <p className="text-[10px] text-base-text-secondary/30">Trạm Phát Sáng</p>
        </footer>
      </div>
    </Canvas>
  );
}
