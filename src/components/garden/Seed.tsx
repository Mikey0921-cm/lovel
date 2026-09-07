"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { usePointer } from "@/lib/use-pointer";

interface SeedProps {
  stage: "seed" | "crack" | "sprout" | "gone";
  clicks: number;
  onClick?: () => void;
  size?: number;
  interactive?: boolean;
  label?: string;
  longPress?: boolean;
  onLongPressProgress?: (p: number) => void;
  onLongPressComplete?: () => void;
}

export function Seed({
  stage,
  clicks,
  onClick,
  size = 64,
  interactive = true,
  label,
  longPress = false,
  onLongPressProgress,
  onLongPressComplete,
}: SeedProps) {
  const { wind } = usePointer();
  const pressRef = useRef<{ interval: number }>({ interval: 0 });

  useEffect(() => {
    const r = pressRef.current;
    return () => {
      if (r.interval) clearInterval(r.interval);
    };
  }, []);

  if (stage === "gone") return null;

  const handlePointerDown = () => {
    if (!longPress || !interactive) return;
    const start = performance.now();
    pressRef.current.interval = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / 2000, 1);
      onLongPressProgress?.(p);
      if (p >= 1) {
        clearInterval(pressRef.current.interval);
        onLongPressComplete?.();
      }
    }, 50);
  };

  const clearPress = () => {
    if (pressRef.current.interval) {
      clearInterval(pressRef.current.interval);
      pressRef.current.interval = 0;
      onLongPressProgress?.(0);
    }
  };

  return (
    <motion.button
      type="button"
      aria-label={label || "ひとつの種"}
      disabled={!interactive}
      onClick={longPress ? undefined : onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onContextMenu={(e) => e.preventDefault()}
      className="relative touch-none select-none border-0 bg-transparent p-4 outline-none disabled:cursor-default"
      style={{ width: size + 32, height: size + 48 }}
      animate={
        clicks === 1 && stage === "seed"
          ? { x: [0, -3, 3, -2, 2, 0], rotate: [0, -4, 4, -2, 2, 0] }
          : { x: wind.x * 2, rotate: wind.x * 3 }
      }
      transition={
        clicks === 1
          ? { duration: 0.45 }
          : { type: "spring", stiffness: 40, damping: 20 }
      }
    >
      <svg
        width={size}
        height={size + 20}
        viewBox="0 0 64 84"
        className="mx-auto overflow-visible"
      >
        <ellipse cx="32" cy="72" rx="14" ry="4" fill="#5F6F52" opacity="0.18" />

        {stage === "sprout" && (
          <motion.g
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "32px 58px" }}
          >
            <path
              d="M32 58 C32 48, 28 40, 26 32"
              fill="none"
              stroke="#8A9A7B"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <motion.path
              d="M26 34 C20 30, 18 24, 22 20 C28 22, 30 28, 26 34Z"
              fill="#A8B59A"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{ transformOrigin: "26px 28px" }}
            />
          </motion.g>
        )}

        <motion.g>
          <motion.ellipse
            cx="32"
            cy="58"
            rx={clicks >= 2 ? 9 : 10}
            ry={clicks >= 2 ? 7 : 8}
            fill="#6B5B45"
            animate={{
              scaleX: clicks >= 2 ? [1, 1.15, 0.9] : 1,
              opacity: stage === "sprout" ? 0.55 : 1,
            }}
            transition={{ duration: 0.5 }}
          />
          <ellipse cx="29" cy="55" rx="3" ry="2" fill="#8A7A60" opacity="0.45" />
          {/* crack / sprout use clicks; crack stage keeps seed body with split */}
        {(stage === "crack" || clicks >= 2) && stage !== "sprout" && (
            <>
              <motion.path
                d="M32 50 L30 58 L34 66"
                fill="none"
                stroke="#F7F3EA"
                strokeWidth="1.2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 0.5 }}
              />
              <motion.ellipse
                cx="24"
                cy="60"
                rx="5"
                ry="4"
                fill="#6B5B45"
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: -6, rotate: -25, opacity: 0.85 }}
                transition={{ duration: 0.55 }}
              />
              <motion.ellipse
                cx="40"
                cy="60"
                rx="5"
                ry="4"
                fill="#6B5B45"
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: 6, rotate: 25, opacity: 0.85 }}
                transition={{ duration: 0.55 }}
              />
            </>
          )}
          {clicks >= 2 && stage === "sprout" && (
            <motion.ellipse
              cx="32"
              cy="62"
              rx="8"
              ry="5"
              fill="#6B5B45"
              opacity="0.4"
            />
          )}
        </motion.g>
      </svg>
    </motion.button>
  );
}
