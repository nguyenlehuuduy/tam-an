"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";
type Accent = "sky" | "ocean" | "neutral";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  accent?: Accent;
}

const accentPrimaryStyle: Record<Accent, React.CSSProperties> = {
  sky: {
    background: "linear-gradient(135deg, #3A2E5C 0%, #7C9EFF 60%, #B388FF 100%)",
    boxShadow: "0 0 20px rgba(124, 158, 255, 0.35), 0 4px 16px rgba(0,0,0,0.4)",
  },
  ocean: {
    background: "linear-gradient(135deg, #072034 0%, #0E4D5C 40%, #4FD1C5 100%)",
    boxShadow: "0 0 20px rgba(79, 209, 197, 0.3), 0 4px 16px rgba(0,0,0,0.4)",
  },
  neutral: {
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  },
};

const accentGhost: Record<Accent, string> = {
  sky: "border border-sky-aurora/50 text-sky-aurora hover:bg-sky-aurora/10",
  ocean: "border border-ocean-aqua/50 text-ocean-aqua hover:bg-ocean-aqua/10",
  neutral: "border border-base-divider text-base-text-secondary hover:bg-base-surface",
};

export function Button({
  variant = "primary",
  accent = "neutral",
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  if (variant === "ghost") {
    return (
      <button
        className={clsx(
          "rounded-full px-6 py-3 font-body font-semibold text-[15px] transition-all duration-200 ease-out",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          accentGhost[accent],
          className
        )}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={clsx(
        "relative overflow-hidden rounded-full px-6 py-3 font-body font-bold text-[15px] text-base-text-primary transition-all duration-200 ease-out",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      style={accentPrimaryStyle[accent]}
      disabled={disabled}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {/* Shimmer overlay */}
      {!disabled && (
        <span
          className="absolute inset-0 shimmer-bg pointer-events-none"
          style={{ borderRadius: "inherit" }}
        />
      )}
      <span className="relative">{children}</span>
    </motion.button>
  );
}
