"use client";

import { useEffect, useRef } from "react";
import { usePointer } from "@/lib/use-pointer";
import type { TimeOfDay } from "@/lib/types";

interface GrassFieldProps {
  visible: boolean;
  timeOfDay: TimeOfDay;
  className?: string;
}

interface Blade {
  x: number;
  h: number;
  w: number;
  phase: number;
  shade: number;
}

export function GrassField({ visible, timeOfDay, className }: GrassFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blades = useRef<Blade[]>([]);
  const { wind, pointer } = usePointer();
  const windRef = useRef(wind);
  const pointerRef = useRef(pointer);
  windRef.current = wind;
  pointerRef.current = pointer;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor(width / 7);
      blades.current = Array.from({ length: count }, (_, i) => ({
        x: (i / count) * width + (Math.random() - 0.5) * 6,
        h: 18 + Math.random() * 42,
        w: 1.2 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        shade: Math.random(),
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let t = 0;

    const colors =
      timeOfDay === "night"
        ? ["#3D4A38", "#4A5A42", "#2F3A2C"]
        : timeOfDay === "dusk" ||
            timeOfDay === "dusk-peach" ||
            timeOfDay === "dusk-rose" ||
            timeOfDay === "dusk-violet"
          ? ["#6B7A5C", "#7A8A68", "#5C6B50"]
          : ["#8A9A7B", "#A8B59A", "#6F7F60"];

    const draw = () => {
      t += 0.016;
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      if (!visible) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const w = windRef.current;
      const p = pointerRef.current;
      const wave =
        typeof window !== "undefined" && window.matchMedia("(pointer: coarse)")
          .matches
          ? Math.sin(t * 1.4 + p.x * 8) * 0.35
          : 0;

      for (const b of blades.current) {
        const localWind =
          w.x * (0.5 + b.shade) +
          Math.sin(t * 1.2 + b.phase) * 0.25 +
          wave +
          (p.active ? (p.x * width - b.x) * 0.0008 : 0);

        const tipX = b.x + localWind * b.h * 0.45;
        const tipY = height - b.h;

        ctx.beginPath();
        ctx.moveTo(b.x - b.w / 2, height);
        ctx.quadraticCurveTo(b.x + localWind * 8, height - b.h * 0.5, tipX, tipY);
        ctx.quadraticCurveTo(
          b.x + localWind * 6 + b.w,
          height - b.h * 0.5,
          b.x + b.w / 2,
          height,
        );
        ctx.closePath();
        ctx.fillStyle = colors[Math.floor(b.shade * colors.length)]!;
        ctx.globalAlpha = 0.55 + b.shade * 0.35;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [visible, timeOfDay]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 2s ease",
        pointerEvents: "none",
      }}
    />
  );
}
