"use client";

import { useEffect, useRef } from "react";

interface Butterfly {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  phase: number;
  size: number;
  hue: number;
}

interface ButterfliesProps {
  active: boolean;
  targets: { x: number; y: number }[];
  className?: string;
}

export function Butterflies({ active, targets, className }: ButterfliesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bugs = useRef<Butterfly[]>([]);
  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    bugs.current = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight * 0.6,
      targetX: Math.random() * canvas.clientWidth,
      targetY: Math.random() * canvas.clientHeight * 0.7,
      speed: 0.65 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      size: 5.5 + Math.random() * 4.5,
      hue: 28 + i * 19,
    }));

    let raf = 0;
    let t = 0;
    let retargetAt = 0;

    const draw = () => {
      t += 0.016;
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      if (!active) {
        raf = requestAnimationFrame(draw);
        return;
      }

      if (t > retargetAt) {
        retargetAt = t + 1.8 + Math.random() * 2.5;
        const tg = targetsRef.current;
        for (const b of bugs.current) {
          if (tg.length && Math.random() > 0.35) {
            const pick = tg[Math.floor(Math.random() * tg.length)]!;
            b.targetX = (pick.x / 100) * width + (Math.random() - 0.5) * 40;
            b.targetY = (pick.y / 100) * height + (Math.random() - 0.5) * 30;
          } else {
            b.targetX = Math.random() * width;
            b.targetY = Math.random() * height * 0.75;
          }
        }
      }

      for (const b of bugs.current) {
        b.x += (b.targetX - b.x) * 0.016 * b.speed;
        b.y += (b.targetY - b.y) * 0.016 * b.speed;
        b.x += Math.sin(t * 1.3 + b.phase) * 0.22;
        b.y += Math.sin(t * 2.4 + b.phase) * 0.45;
        const flap = Math.sin(t * 16 + b.phase);

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.targetY - b.y, b.targetX - b.x) * 0.3);

        ctx.shadowColor = `hsla(${b.hue}, 55%, 75%, 0.35)`;
        ctx.shadowBlur = 5;
        ctx.fillStyle = `hsla(${b.hue}, 42%, 72%, 0.88)`;
        ctx.beginPath();
        ctx.ellipse(-b.size * 0.6, 0, b.size * (0.7 + flap * 0.25), b.size * 0.45, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(b.size * 0.6, 0, b.size * (0.7 + flap * 0.25), b.size * 0.45, 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(80,70,60,0.55)";
        ctx.shadowBlur = 0;
        ctx.fillRect(-1, -b.size * 0.7, 2, b.size * 1.2);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        opacity: active ? 1 : 0,
        transition: "opacity 2.5s ease",
        pointerEvents: "none",
      }}
    />
  );
}
