"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { TimeOfDay } from "@/lib/types";

const SKY: Record<TimeOfDay, { from: string; via: string; to: string }> = {
  dawn: { from: "#F7F3EA", via: "#F3EFE4", to: "#E8EDE0" },
  day: { from: "#F7F3EA", via: "#EEF0E4", to: "#E2E8D6" },
  "dusk-peach": { from: "#F5DFC4", via: "#F0C9A8", to: "#E8D4B8" },
  "dusk-rose": { from: "#F0C9A8", via: "#E8B8BE", to: "#D4A8B8" },
  "dusk-violet": { from: "#E0B0B8", via: "#C4A8C8", to: "#9B8BB5" },
  dusk: { from: "#F0C9A8", via: "#E0B0B8", to: "#9B8BB5" },
  night: { from: "#1A1F2E", via: "#252B3D", to: "#1E2433" },
};

export function SkyBackdrop({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  const c = SKY[timeOfDay];
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10"
      animate={{
        background: `linear-gradient(180deg, ${c.from} 0%, ${c.via} 45%, ${c.to} 100%)`,
      }}
      transition={{ duration: 5, ease: "easeInOut" }}
    >
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,240,200,0.35), transparent 40%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.25), transparent 35%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />
    </motion.div>
  );
}

export function SunDust({ active }: { active: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 47) % 84)}%`,
        delay: (i % 9) * 1.2,
        duration: 10 + (i % 5) * 2,
        size: 2 + (i % 3),
      })),
    [],
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-[#F5E6C8]/60 animate-dust"
          style={{
            left: p.left,
            bottom: "-4%",
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function FallingLeaves({ active }: { active: boolean }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: `${12 + i * 14}%`,
        delay: i * 2.4,
        duration: 14 + i * 1.5,
        rotate: 20 + i * 30,
      })),
    [],
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
      {leaves.map((l) => (
        <motion.span
          key={l.id}
          className="absolute text-[#8A9A7B]/50"
          style={{ left: l.left, top: "-5%", fontSize: 14 }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, 30, -20, 40],
            rotate: [0, l.rotate, l.rotate + 80],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: l.duration,
            delay: l.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          ❦
        </motion.span>
      ))}
    </div>
  );
}

/** Left-side tufts that grow in as chapter 2 begins */
export function SideGrass({
  visible,
  side = "left",
}: {
  visible: boolean;
  side?: "left" | "right";
}) {
  const blades = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        h: 28 + (i % 4) * 10,
        delay: 0.15 * i,
        x: i * 14,
      })),
    [],
  );

  return (
    <div
      className={`pointer-events-none absolute bottom-[18%] ${
        side === "left" ? "left-4 md:left-10" : "right-4 md:right-10"
      }`}
      style={{ width: 130, height: 90 }}
    >
      <svg width="130" height="90" viewBox="0 0 130 90" className="overflow-visible">
        {blades.map((b) => (
          <motion.path
            key={b.id}
            d={`M${b.x + 8} 90 Q${b.x + 4} ${90 - b.h * 0.55} ${b.x + 10} ${90 - b.h}`}
            fill="none"
            stroke="#8A9A7B"
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              visible
                ? { pathLength: 1, opacity: 0.55 + (b.id % 3) * 0.1 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{
              duration: 1.6,
              delay: b.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </svg>
    </div>
  );
}
