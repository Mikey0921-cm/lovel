"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FlowerStage } from "@/lib/types";
import { usePointer } from "@/lib/use-pointer";

interface FlowerProps {
  stage: FlowerStage;
  color: string;
  accent: string;
  size?: number;
  special?: boolean;
  dimmed?: boolean;
  windShake?: boolean;
  growFirst?: boolean;
  onBloomComplete?: () => void;
  onClick?: () => void;
  interactive?: boolean;
}

const PETAL_COUNT = 7;
const STEM_GROW_MS = 2200;
const PETAL_STAGGER = 0.28;

function petalPath(i: number, count: number, special: boolean) {
  const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
  const len = special ? 36 : 28;
  const width = special ? 15 : 11;
  const tipX = Math.cos(angle) * len;
  const tipY = Math.sin(angle) * len;
  const left = angle - 0.48;
  const right = angle + 0.48;
  const lx = Math.cos(left) * width * 1.1;
  const ly = Math.sin(left) * width * 1.1;
  const rx = Math.cos(right) * width * 1.1;
  const ry = Math.sin(right) * width * 1.1;
  return {
    d: `M 0 0 Q ${lx} ${ly} ${tipX} ${tipY} Q ${rx} ${ry} 0 0`,
    angleDeg: (angle * 180) / Math.PI,
  };
}

export function Flower({
  stage,
  color,
  accent,
  size = 120,
  special = false,
  dimmed = false,
  windShake = false,
  growFirst = false,
  onBloomComplete,
  onClick,
  interactive = false,
}: FlowerProps) {
  const { wind } = usePointer();
  const [showPetals, setShowPetals] = useState(stage === "alive");
  const doneRef = useRef(false);
  const bloomCompleteRef = useRef(onBloomComplete);
  const petals = useMemo(
    () =>
      Array.from({ length: PETAL_COUNT }, (_, i) =>
        petalPath(i, PETAL_COUNT, special),
      ),
    [special],
  );

  useEffect(() => {
    bloomCompleteRef.current = onBloomComplete;
  }, [onBloomComplete]);

  useEffect(() => {
    doneRef.current = false;

    if (stage === "alive") {
      setShowPetals(true);
      return;
    }

    if (stage !== "blooming") {
      if (stage === "hidden" || stage === "seed" || stage === "sprout" || stage === "bud") {
        setShowPetals(false);
      }
      return;
    }

    if (growFirst) {
      setShowPetals(false);
      const stemTimer = window.setTimeout(() => setShowPetals(true), STEM_GROW_MS);
      const doneTimer = window.setTimeout(() => {
        if (!doneRef.current) {
          doneRef.current = true;
          bloomCompleteRef.current?.();
        }
      }, STEM_GROW_MS + PETAL_COUNT * PETAL_STAGGER * 1000 + 1000);
      return () => {
        clearTimeout(stemTimer);
        clearTimeout(doneTimer);
      };
    }

    setShowPetals(true);
    const doneTimer = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        bloomCompleteRef.current?.();
      }
    }, PETAL_COUNT * PETAL_STAGGER * 1000 + 1000);
    return () => clearTimeout(doneTimer);
  }, [stage, growFirst]);

  if (stage === "hidden") return null;

  const showStem =
    stage === "sprout" ||
    stage === "bud" ||
    stage === "blooming" ||
    stage === "alive";
  const showBud = stage === "bud" && !showPetals;
  const showBloom =
    (stage === "blooming" || stage === "alive") && showPetals;

  const sway = windShake || stage === "alive";
  const baseRotate = wind.x * (sway ? 7 : 2);

  return (
    <motion.button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      className="relative border-0 bg-transparent p-0 outline-none disabled:cursor-default"
      style={{ width: size, height: size * 1.45 }}
      animate={
        sway
          ? {
              rotate: [baseRotate - 2.8, baseRotate + 2.8, baseRotate - 1.2],
              opacity: dimmed ? 0.4 : 1,
              scale: dimmed ? 0.96 : 1,
            }
          : {
              rotate: baseRotate,
              opacity: dimmed ? 0.4 : 1,
              scale: dimmed ? 0.96 : 1,
            }
      }
      transition={
        sway
          ? {
              rotate: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.8 },
            }
          : { type: "spring", stiffness: 30, damping: 18 }
      }
    >
      <svg
        width={size}
        height={size * 1.45}
        viewBox="0 0 100 145"
        className="overflow-visible"
      >
        {showStem && (
          <motion.path
            d="M50 138 C47 110, 53 85, 50 58"
            fill="none"
            stroke="#7A8B6A"
            strokeWidth="2.4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration:
                growFirst && stage === "blooming" ? STEM_GROW_MS / 1000 : 1.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        )}

        {showStem && (
          <>
            <motion.path
              d="M50 105 C36 98, 28 88, 24 78"
              fill="none"
              stroke="#8A9A7B"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                delay: growFirst ? 0.8 : 0.35,
                duration: 0.9,
              }}
            />
            <motion.path
              d="M50 112 C62 106, 70 96, 74 88"
              fill="none"
              stroke="#A8B59A"
              strokeWidth="1.4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{
                delay: growFirst ? 1.1 : 0.5,
                duration: 0.9,
              }}
            />
          </>
        )}

        <g transform="translate(50, 52)">
          <AnimatePresence>
            {showBud && (
              <motion.g
                key="bud"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.15, opacity: 0 }}
                transition={{ duration: 0.7 }}
              >
                <ellipse cx="0" cy="2" rx="11" ry="16" fill={accent} />
                <ellipse
                  cx="-2"
                  cy="-2"
                  rx="4"
                  ry="6"
                  fill={color}
                  opacity="0.55"
                />
              </motion.g>
            )}
          </AnimatePresence>

          {showBloom &&
            petals.map((p, i) => (
              <motion.path
                key={`${special}-${i}`}
                d={p.d}
                fill={color}
                stroke={accent}
                strokeWidth="0.45"
                strokeOpacity="0.4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.94 }}
                transition={{
                  delay: i * PETAL_STAGGER,
                  duration: 1.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: "0px 0px" }}
              />
            ))}

          {showBloom && (
            <motion.circle
              r={special ? 8.5 : 6}
              fill={accent}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: PETAL_COUNT * PETAL_STAGGER + 0.15,
                duration: 0.45,
              }}
            />
          )}
        </g>
      </svg>
    </motion.button>
  );
}
