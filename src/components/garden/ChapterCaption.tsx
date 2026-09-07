"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ChapterCaptionProps {
  number?: string;
  title?: string;
  lines: string[];
  visible: boolean;
  className?: string;
  align?: "center" | "left";
  /** Extra pause (ms) before each line after the first — for 温柔 */
  linePauseMs?: number[];
  /** Keep title/number while lines fade (遇见：花留下，字淡掉) */
  persistHeader?: boolean;
  linesVisible?: boolean;
  duskTone?: boolean;
}

export function ChapterCaption({
  number,
  title,
  lines,
  visible,
  className = "",
  align = "center",
  linePauseMs,
  persistHeader = false,
  linesVisible = true,
  duskTone = false,
}: ChapterCaptionProps) {
  const tone = duskTone ? "text-[#3d2f45]/75" : "text-sage-deep";
  const soft = duskTone ? "text-[#3d2f45]/45" : "text-sage-deep/50";
  const body = duskTone ? "text-[#3d2f45]/80" : "text-sage-deep/80";

  const showShell = visible || (persistHeader && (number || title));

  return (
    <AnimatePresence mode="wait">
      {showShell && (
        <motion.div
          key={`${number}-${title}-shell`}
          className={`pointer-events-none select-none ${className}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: align }}
        >
          {number && (
            <motion.p
              className={`mb-1 font-display text-sm tracking-[0.35em] ${soft}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: visible ? 1 : persistHeader ? 0 : 1 }}
              transition={{ duration: 1.4 }}
            >
              {number}
            </motion.p>
          )}
          {title && (
            <motion.h2
              className={`mb-5 font-serif text-3xl font-light tracking-wide md:text-4xl ${tone}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: visible ? 1 : persistHeader ? 0 : 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.15 }}
            >
              {title}
            </motion.h2>
          )}

          <AnimatePresence>
            {visible && linesVisible && (
              <motion.div
                key="lines"
                className="space-y-4"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
              >
                {lines.map((line, i) => {
                  const pauseBefore =
                    linePauseMs?.[i] ??
                    (i === 0 ? 400 : 450);
                  const delaySec =
                    lines
                      .slice(0, i)
                      .reduce(
                        (acc, _, idx) =>
                          acc +
                          ((linePauseMs?.[idx] ?? (idx === 0 ? 400 : 450)) +
                            900) /
                            1000,
                        0,
                      ) +
                    pauseBefore / 1000;

                  return (
                    <motion.p
                      key={`${line}-${i}`}
                      className={`font-sans text-[15px] font-light leading-relaxed md:text-base ${body}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: delaySec,
                        duration: 1.15,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {line}
                    </motion.p>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SoftButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`font-display tracking-[0.3em] text-sage-deep/80 transition-colors hover:text-sage-deep ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 1 }}
      whileHover={{ letterSpacing: "0.38em" }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
