"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGarden } from "@/lib/garden-context";
import { usePointer } from "@/lib/use-pointer";
import type { FlowerId, FlowerState } from "@/lib/types";
import { Seed } from "./Seed";
import { Flower } from "./Flower";
import { GrassField } from "./GrassField";
import { Butterflies } from "./Butterflies";
import {
  FallingLeaves,
  SideGrass,
  SkyBackdrop,
  SunDust,
} from "./Atmosphere";
import { ChapterCaption, SoftButton } from "./ChapterCaption";
import { AmbientAudio } from "./AmbientAudio";

export function GardenExperience() {
  const { state, dispatch, markAlive } = useGarden();
  const { setPointer } = usePointer();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [captionId, setCaptionId] = useState<FlowerId | null>(null);
  const [captionVisible, setCaptionVisible] = useState(false);
  const [linesVisible, setLinesVisible] = useState(true);
  const [longPress, setLongPress] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [nightMessage, setNightMessage] = useState(false);
  const [windBurst, setWindBurst] = useState(false);
  const [grassProgress, setGrassProgress] = useState(0);
  const unlocked = useRef<Set<number>>(new Set());
  const captionTimers = useRef<number[]>([]);
  const revealTimer = useRef<number | null>(null);

  const aliveTargets = useMemo(() => {
    return Object.values(state.flowers)
      .filter((f) => f.stage === "alive" || f.stage === "blooming")
      .map((f) => ({ x: f.x, y: f.y }));
  }, [state.flowers]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setPointer(x, y, true);
    },
    [setPointer],
  );

  const clearCaptionTimers = () => {
    captionTimers.current.forEach(clearTimeout);
    captionTimers.current = [];
  };

  const showFlowerCaption = useCallback((id: FlowerId) => {
    clearCaptionTimers();
    setCaptionId(id);
    setCaptionVisible(true);
    setLinesVisible(true);

    // 遇见：文字慢慢淡掉，花留下
    if (id === 1) {
      captionTimers.current.push(
        window.setTimeout(() => setLinesVisible(false), 3800),
        window.setTimeout(() => setCaptionVisible(false), 5600),
      );
      return;
    }

    // 喜欢
    if (id === 2) {
      captionTimers.current.push(
        window.setTimeout(() => setCaptionVisible(false), 5800),
      );
      return;
    }

    // 想念：短句后一阵风
    if (id === 3) {
      captionTimers.current.push(
        window.setTimeout(() => setCaptionVisible(false), 5200),
        window.setTimeout(() => {
          setWindBurst(true);
          window.setTimeout(() => setWindBurst(false), 3200);
        }, 2600),
      );
      return;
    }

    // 温柔：停顿后逐句出现，总时长更长
    if (id === 4) {
      captionTimers.current.push(
        window.setTimeout(() => setCaptionVisible(false), 9800),
      );
      return;
    }

    // 秘密
    if (id === 5) {
      captionTimers.current.push(
        window.setTimeout(() => setCaptionVisible(false), 5200),
      );
    }
  }, []);

  const handleBloomDone = useCallback(
    (id: FlowerId) => {
      markAlive(id);
      showFlowerCaption(id);

      if (id === 1) {
        dispatch({ type: "SET_CHAPTER", chapter: "like" });
      }
      if (id === 2) {
        dispatch({ type: "SET_CHAPTER", chapter: "miss" });
      }
      if (id === 3) {
        dispatch({ type: "SET_CHAPTER", chapter: "gentle" });
        dispatch({ type: "SET_TIME", time: "dusk-violet" });
      }
      if (id === 4) {
        dispatch({
          type: "UPDATE_FLOWER",
          id: 5,
          stage: "bud",
        });
        dispatch({ type: "SET_CHAPTER", chapter: "secret" });
      }
      if (id === 5) {
        dispatch({ type: "GARDEN_ALIVE" });
        if (revealTimer.current) clearTimeout(revealTimer.current);
        revealTimer.current = window.setTimeout(() => {
          setShowReveal(true);
          revealTimer.current = null;
        }, 6500);
      }
      if (id === 6) {
        dispatch({ type: "SET_CHAPTER", chapter: "night" });
        dispatch({ type: "SET_TIME", time: "night" });
        window.setTimeout(() => setNightMessage(true), 2800);
      }
    },
    [dispatch, markAlive, showFlowerCaption],
  );

  // Scroll: garden exploration — grass fades in, seeds unlock, dusk shifts
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? el.scrollTop / max : 0;
      setGrassProgress(Math.min(1, Math.max(0, (p - 0.02) / 0.18)));

      // 第二朵：向下时右边出现种子
      if (
        p > 0.08 &&
        state.flowers[1].stage === "alive" &&
        state.flowers[2].stage === "hidden"
      ) {
        dispatch({ type: "UNLOCK_SEED", id: 2 });
      }

      // 第三朵 + 黄昏：淡橙 → 粉 → 紫
      if (state.flowers[2].stage === "alive") {
        if (p > 0.22 && state.flowers[3].stage === "hidden") {
          dispatch({ type: "UNLOCK_SEED", id: 3 });
        }
        if (p > 0.2 && p < 0.28) {
          dispatch({ type: "SET_TIME", time: "dusk-peach" });
        } else if (p > 0.28 && p < 0.36) {
          dispatch({ type: "SET_TIME", time: "dusk-rose" });
        } else if (p > 0.36 && state.timeOfDay !== "night") {
          dispatch({ type: "SET_TIME", time: "dusk-violet" });
        }
      }

      // 第四朵
      if (
        p > 0.42 &&
        state.flowers[3].stage === "alive" &&
        state.flowers[4].stage === "hidden"
      ) {
        dispatch({ type: "UNLOCK_SEED", id: 4 });
        dispatch({ type: "SET_CHAPTER", chapter: "gentle" });
      }

      if (
        p > 0.78 &&
        state.chapter === "reveal" &&
        state.revealStep >= 4 &&
        state.flowers[6].stage === "hidden"
      ) {
        dispatch({ type: "UNLOCK_SEED", id: 6 });
        dispatch({ type: "SET_CHAPTER", chapter: "finale" });
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [dispatch, state.chapter, state.flowers, state.revealStep, state.timeOfDay]);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!showReveal) return;
    dispatch({ type: "SET_CHAPTER", chapter: "reveal" });
    const steps = [0, 1800, 3600, 5400, 7200];
    const timers = steps.map((ms, i) =>
      window.setTimeout(() => {
        dispatch({ type: "ADVANCE_REVEAL" });
        if (i === steps.length - 1) {
          dispatch({ type: "UNLOCK_SEED", id: 6 });
        }
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [showReveal, dispatch]);

  const dimOthers = state.focusFlower !== null;
  const isIntro =
    state.chapter === "intro" ||
    state.chapter === "seed" ||
    state.chapter === "consent";

  const duskTone =
    state.timeOfDay === "dusk" ||
    state.timeOfDay === "dusk-peach" ||
    state.timeOfDay === "dusk-rose" ||
    state.timeOfDay === "dusk-violet";

  const revealLines = [
    "知ってる？",
    "実はこの花たちは……",
    "私が植えたんじゃない。",
    "あなたが咲かせたんだよ。",
  ];

  const grassVisible =
    state.flowers[1].stage === "alive" ||
    state.flowers[1].stage === "blooming" ||
    grassProgress > 0.05 ||
    state.gardenAlive;

  return (
    <div
      ref={scrollerRef}
      className="relative h-[100dvh] overflow-x-hidden overflow-y-auto"
      onPointerMove={onPointerMove}
      style={{
        scrollBehavior: "smooth",
        overscrollBehavior: "none",
        scrollSnapType: "y proximity",
      }}
    >
      <motion.div
        className="pointer-events-none fixed inset-0 z-[5]"
        animate={{
          opacity:
            state.timeOfDay === "night"
              ? 0.55
              : state.chapter === "reveal"
                ? 0.42
                : 0,
          background:
            state.timeOfDay === "night"
              ? "radial-gradient(ellipse at center, transparent 20%, #0d111a 85%)"
              : "rgba(26, 31, 46, 0.4)",
        }}
        transition={{ duration: 3.5 }}
      />

      <SkyBackdrop timeOfDay={state.timeOfDay} />
      <SunDust
        active={state.timeOfDay !== "night"}
      />
      <FallingLeaves active={state.gardenAlive} />
      <AmbientAudio
        timeOfDay={state.timeOfDay}
        enabled={state.chapter !== "intro"}
      />

      {state.gardenAlive && (
        <GrassField
          visible
          timeOfDay={state.timeOfDay}
          className="pointer-events-none fixed bottom-0 left-0 z-[4] h-36 w-full"
        />
      )}

      <AnimatePresence>
        {isIntro && (
          <motion.header
            className="pointer-events-none fixed left-0 right-0 top-8 z-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <h1 className="font-serif text-2xl font-light tracking-wide text-sage-deep md:text-3xl">
              花が代わりに語る
            </h1>
            <p className="mt-2 font-display text-xs tracking-[0.28em] text-sage/60">
              Flowers Say What I Cannot.
            </p>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="relative mx-auto min-h-[520vh] w-full max-w-3xl">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[10%] h-[90%] w-full"
          style={{
            opacity: Math.min(1, grassProgress * 1.4 + (grassVisible ? 0.35 : 0)),
            transition: "opacity 1.2s ease",
          }}
        >
          <GrassField
            visible={grassVisible}
            timeOfDay={state.timeOfDay}
            className="h-full w-full"
          />
        </div>

        <Butterflies
          active={state.gardenAlive}
          targets={aliveTargets}
          className="absolute inset-0 z-[4] h-full w-full"
        />

        {/* ——— 01 遇见 ——— */}
        <section
          className="relative z-10 flex h-[100dvh] flex-col items-center justify-center px-6"
          style={{ scrollSnapAlign: "start" }}
        >
          {(state.flowers[1].stage === "seed" ||
            state.flowers[1].stage === "sprout") &&
            state.chapter !== "meet" && (
              <div className="relative z-20 flex flex-col items-center">
                <Seed
                  stage={
                    state.seedClicks >= 3
                      ? "sprout"
                      : state.seedClicks >= 2
                        ? "crack"
                        : "seed"
                  }
                  clicks={state.seedClicks}
                  onClick={() => {
                    if (state.chapter === "consent" || state.showConsent) {
                      dispatch({ type: "ACCEPT_GROW" });
                      return;
                    }
                    dispatch({ type: "SEED_CLICK" });
                  }}
                  interactive
                  label={
                    state.chapter === "consent"
                      ? "クリックして、続きを育てる"
                      : "種をクリック"
                  }
                />

                <AnimatePresence mode="wait">
                  {state.seedClicks === 0 && state.chapter === "intro" && (
                    <motion.div
                      key="intro-copy"
                      className="mt-10 max-w-xs text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                    >
                      <p className="font-sans text-sm font-light leading-relaxed text-sage-deep/70">
                        ずっと、どう伝えればいいのか
                        わからない想いがありました。
                      </p>
                      <button
                        type="button"
                        className="mt-8 font-display text-sm tracking-[0.3em] text-sage-deep/80 transition-colors hover:text-sage-deep"
                        onClick={() => dispatch({ type: "SEED_CLICK" })}
                      >
                        花を咲かせる
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 第三次点击后：必须出现询问，避免卡在嫩芽 */}
                <AnimatePresence>
                  {(state.showConsent ||
                    state.chapter === "consent" ||
                    state.seedClicks >= 3) && (
                      <motion.div
                        key="consent"
                        className="mt-14 text-center"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, delay: 0.35 }}
                      >
                        <p className="mb-10 font-serif text-lg font-light text-sage-deep md:text-xl">
                          この花を育ててくれる？
                        </p>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "ACCEPT_GROW" })}
                          className="font-display text-base tracking-[0.4em] text-sage-deep transition-opacity hover:opacity-70"
                        >
                          YES
                        </button>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            )}

          {(state.flowers[1].stage === "blooming" ||
            state.flowers[1].stage === "alive") && (
            <div className="absolute left-1/2 top-[40%] z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <Flower
                stage={state.flowers[1].stage}
                color={state.flowers[1].color}
                accent={state.flowers[1].accent}
                size={148}
                growFirst
                dimmed={dimOthers && state.focusFlower !== 1}
                windShake={windBurst || state.gardenAlive}
                onBloomComplete={() => {
                  if (!unlocked.current.has(1)) {
                    unlocked.current.add(1);
                    handleBloomDone(1);
                  }
                }}
              />
              <div className="mt-6 min-h-[7rem]">
                <ChapterCaption
                  number="01"
                  title="出会い"
                  lines={["こんなに広い世界で、あなたに出会えた。"]}
                  visible={captionVisible && captionId === 1}
                  linesVisible={linesVisible}
                />
              </div>
            </div>
          )}
        </section>

        {/* ——— 02 喜欢：左草右种子，第一朵仍在上方 ——— */}
        <section
          className="relative flex min-h-[100vh] flex-col justify-center px-6"
          style={{ scrollSnapAlign: "start" }}
        >
          <SideGrass
            visible={
              state.flowers[1].stage === "alive" &&
              (state.flowers[2].stage !== "hidden" || grassProgress > 0.2)
            }
            side="left"
          />

          {/* 第一朵花仍在视野边缘，形成小花园 */}
          {state.flowers[1].stage === "alive" &&
            state.flowers[2].stage !== "hidden" && (
              <motion.div
                className="absolute left-[18%] top-[12%] opacity-70"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.75, y: 0 }}
                transition={{ duration: 1.4 }}
              >
                <Flower
                  stage="alive"
                  color={state.flowers[1].color}
                  accent={state.flowers[1].accent}
                  size={72}
                  dimmed={dimOthers && state.focusFlower === 2}
                  windShake={windBurst || state.gardenAlive}
                />
              </motion.div>
            )}

          {state.flowers[2].stage !== "hidden" && (
            <div className="relative ml-auto mr-[8%] flex w-full max-w-[220px] flex-col items-center md:mr-[14%]">
              {state.flowers[2].stage === "seed" ||
              state.flowers[2].stage === "sprout" ? (
                <Seed
                  stage="seed"
                  clicks={0}
                  onClick={() => {
                    dispatch({
                      type: "UPDATE_FLOWER",
                      id: 2,
                      stage: "blooming",
                    });
                    dispatch({ type: "FOCUS_FLOWER", id: 2 });
                    dispatch({ type: "SET_CHAPTER", chapter: "like" });
                  }}
                  interactive
                  label="二つ目の種"
                />
              ) : (
                <Flower
                  stage={state.flowers[2].stage}
                  color={state.flowers[2].color}
                  accent={state.flowers[2].accent}
                  size={128}
                  dimmed={dimOthers && state.focusFlower !== 2}
                  windShake={windBurst || state.gardenAlive}
                  onBloomComplete={() => {
                    if (!unlocked.current.has(2)) {
                      unlocked.current.add(2);
                      handleBloomDone(2);
                    }
                  }}
                />
              )}
              <ChapterCaption
                number="02"
                title="好き"
                lines={[
                  "いつの間にか、",
                  "あなたがいる毎日に慣れていた。",
                ]}
                visible={captionVisible && captionId === 2}
                className="mt-8"
                duskTone={false}
              />
            </div>
          )}
        </section>

        {/* ——— 03 想念 ——— */}
        <section
          className="relative flex min-h-[100vh] flex-col items-center justify-center px-6"
          style={{ scrollSnapAlign: "start" }}
        >
          {/* 已开的花还在 */}
          {state.flowers[1].stage === "alive" &&
            state.flowers[3].stage !== "hidden" && (
              <div className="absolute left-[12%] top-[10%] scale-75 opacity-60">
                <Flower
                  stage="alive"
                  color={state.flowers[1].color}
                  accent={state.flowers[1].accent}
                  size={70}
                  windShake={windBurst}
                />
              </div>
            )}
          {state.flowers[2].stage === "alive" &&
            state.flowers[3].stage !== "hidden" && (
              <div className="absolute right-[10%] top-[14%] scale-75 opacity-60">
                <Flower
                  stage="alive"
                  color={state.flowers[2].color}
                  accent={state.flowers[2].accent}
                  size={70}
                  windShake={windBurst}
                />
              </div>
            )}

          {state.flowers[3].stage !== "hidden" && (
            <div className="relative flex flex-col items-center">
              {state.flowers[3].stage === "seed" ? (
                <Seed
                  stage="seed"
                  clicks={0}
                  onClick={() => {
                    dispatch({
                      type: "UPDATE_FLOWER",
                      id: 3,
                      stage: "blooming",
                    });
                    dispatch({ type: "FOCUS_FLOWER", id: 3 });
                    dispatch({ type: "SET_CHAPTER", chapter: "miss" });
                  }}
                  interactive
                />
              ) : (
                <Flower
                  stage={state.flowers[3].stage}
                  color={state.flowers[3].color}
                  accent={state.flowers[3].accent}
                  size={132}
                  dimmed={dimOthers && state.focusFlower !== 3}
                  windShake={windBurst || state.gardenAlive}
                  onBloomComplete={() => {
                    if (!unlocked.current.has(3)) {
                      unlocked.current.add(3);
                      handleBloomDone(3);
                    }
                  }}
                />
              )}
              <ChapterCaption
                number="03"
                title="想い"
                lines={[
                  "何も特別なことがないのに、",
                  "ふいにあなたを想うことがある。",
                ]}
                visible={captionVisible && captionId === 3}
                className="mt-10"
                duskTone={duskTone}
              />
            </div>
          )}
        </section>

        {/* ——— 04 温柔：长按 ——— */}
        <section
          className="relative flex min-h-[100vh] flex-col items-center justify-center px-6"
          style={{ scrollSnapAlign: "start" }}
        >
          <GardenMemory
            flowers={state.flowers}
            upTo={3}
            windShake={state.gardenAlive}
            dim={dimOthers && state.focusFlower === 4}
          />

          {state.flowers[4].stage !== "hidden" && (
            <div className="relative z-10 flex flex-col items-center">
              {state.flowers[4].stage === "seed" ||
              state.flowers[4].stage === "sprout" ? (
                <>
                  <Seed
                    stage={longPress > 0.45 ? "sprout" : "seed"}
                    clicks={longPress > 0.45 ? 3 : longPress > 0.15 ? 2 : 0}
                    longPress
                    onLongPressProgress={setLongPress}
                    onLongPressComplete={() => {
                      setLongPress(0);
                      if (state.flowers[4].stage !== "seed") return;
                      dispatch({
                        type: "UPDATE_FLOWER",
                        id: 4,
                        stage: "blooming",
                      });
                      dispatch({ type: "FOCUS_FLOWER", id: 4 });
                      dispatch({ type: "SET_CHAPTER", chapter: "gentle" });
                    }}
                    interactive
                    label="種を長押し"
                  />
                  <p className="mt-5 font-sans text-[11px] tracking-[0.22em] text-sage-deep/40">
                    長押しして、そっと育てて
                  </p>
                  {longPress > 0 && (
                    <div className="mt-3 h-[1px] w-20 overflow-hidden bg-sage-mist/60">
                      <div
                        className="h-full bg-sage-deep/45 transition-[width] duration-75"
                        style={{ width: `${longPress * 100}%` }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <Flower
                  stage={state.flowers[4].stage}
                  color={state.flowers[4].color}
                  accent={state.flowers[4].accent}
                  size={130}
                  dimmed={dimOthers && state.focusFlower !== 4}
                  windShake={state.gardenAlive}
                  onBloomComplete={() => {
                    if (!unlocked.current.has(4)) {
                      unlocked.current.add(4);
                      handleBloomDone(4);
                    }
                  }}
                />
              )}

              <ChapterCaption
                number="04"
                title="優しさ"
                lines={[
                  "この世界が、あなたに優しくありますように。",
                  "もしそうでなければ、",
                  "私が優しくする。",
                ]}
                linePauseMs={[500, 1600, 1400]}
                visible={captionVisible && captionId === 4}
                className="mt-10"
                duskTone={duskTone}
              />
            </div>
          )}
        </section>

        {/* ——— 05 秘密 ——— */}
        <section
          className="relative flex min-h-[95vh] flex-col items-center justify-center px-6"
          style={{ scrollSnapAlign: "start" }}
        >
          <GardenMemory
            flowers={state.flowers}
            upTo={4}
            windShake={state.gardenAlive}
            dim={dimOthers && state.focusFlower === 5}
          />

          {(state.flowers[5].stage === "bud" ||
            state.flowers[5].stage === "blooming" ||
            state.flowers[5].stage === "alive") && (
            <div className="relative z-10 flex flex-col items-center">
              <Flower
                stage={
                  state.flowers[5].stage === "bud"
                    ? "bud"
                    : state.flowers[5].stage
                }
                color={state.flowers[5].color}
                accent={state.flowers[5].accent}
                size={138}
                special
                interactive={state.flowers[5].stage === "bud"}
                dimmed={dimOthers && state.focusFlower !== 5}
                windShake={state.gardenAlive}
                onClick={() => {
                  if (state.flowers[5].stage !== "bud") return;
                  if (state.secretClicks >= 1) {
                    dispatch({
                      type: "UPDATE_FLOWER",
                      id: 5,
                      stage: "blooming",
                    });
                    dispatch({ type: "FOCUS_FLOWER", id: 5 });
                    dispatch({ type: "SET_CHAPTER", chapter: "secret" });
                  } else {
                    dispatch({ type: "SECRET_CLICK" });
                  }
                }}
                onBloomComplete={() => {
                  if (!unlocked.current.has(5)) {
                    unlocked.current.add(5);
                    handleBloomDone(5);
                  }
                }}
              />

              <AnimatePresence>
                {state.secretHint && state.flowers[5].stage === "bud" && (
                  <motion.button
                    type="button"
                    className="absolute -right-6 top-10 font-display text-base text-sage-deep/35 md:-right-8"
                    style={{ color: duskTone ? "rgba(61,47,69,0.4)" : undefined }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: [0.35, 0.7, 0.35], scale: 1 }}
                    transition={{
                      opacity: { duration: 2.8, repeat: Infinity },
                      scale: { duration: 0.6 },
                    }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      dispatch({
                        type: "UPDATE_FLOWER",
                        id: 5,
                        stage: "blooming",
                      });
                      dispatch({ type: "FOCUS_FLOWER", id: 5 });
                      dispatch({ type: "SET_CHAPTER", chapter: "secret" });
                    }}
                  >
                    ?
                  </motion.button>
                )}
              </AnimatePresence>

              {/* 秘密：不要大标题压迫，只留那一行字 */}
              <AnimatePresence>
                {captionVisible && captionId === 5 && (
                  <motion.p
                    className="mt-12 max-w-xs text-center font-sans text-[15px] font-light leading-relaxed text-sage-deep/80"
                    style={{
                      color: duskTone ? "rgba(61,47,69,0.8)" : undefined,
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4 }}
                  >
                    この一輪は、最初からあなたのために。
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* REVEAL */}
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-8">
          <AnimatePresence mode="wait">
            {state.chapter === "reveal" && state.revealStep > 0 && (
              <motion.p
                key={state.revealStep}
                className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center px-8 text-center font-serif text-xl font-light leading-relaxed text-sage-deep md:text-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 1.2 }}
                style={{
                  color:
                    state.timeOfDay === "night"
                      ? "rgba(247,243,234,0.85)"
                      : duskTone
                        ? "rgba(61,47,69,0.85)"
                        : undefined,
                }}
              >
                {revealLines[
                  Math.min(state.revealStep - 1, revealLines.length - 1)
                ]}
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* FINALE */}
        <section className="relative flex min-h-[100vh] flex-col items-center justify-center px-6 pb-32">
          {(state.flowers[6].stage === "seed" ||
            state.flowers[6].stage === "blooming" ||
            state.flowers[6].stage === "alive") && (
            <div className="flex flex-col items-center text-center">
              {!state.finaleOpened && state.flowers[6].stage === "seed" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.4 }}
                  className="mb-8"
                >
                  <p className="font-display text-xs tracking-[0.3em] text-sage-deep/50">
                    最後の一輪
                  </p>
                  <p className="mt-4 font-sans text-sm font-light text-sage-deep/70">
                    この一輪は、私からあなたへ。
                  </p>
                </motion.div>
              )}

              {state.flowers[6].stage === "seed" ? (
                <Seed
                  stage="seed"
                  clicks={0}
                  onClick={() => dispatch({ type: "OPEN_FINALE" })}
                  label="最後の一輪"
                />
              ) : (
                <Flower
                  stage={state.flowers[6].stage}
                  color={state.flowers[6].color}
                  accent={state.flowers[6].accent}
                  size={150}
                  special
                  windShake
                  onBloomComplete={() => {
                    if (!unlocked.current.has(6)) {
                      unlocked.current.add(6);
                      handleBloomDone(6);
                    }
                  }}
                />
              )}

              <AnimatePresence>
                {(state.flowers[6].stage === "alive" ||
                  state.flowers[6].stage === "blooming") &&
                  state.finaleOpened && (
                    <motion.div
                      className="mt-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5, duration: 1.5 }}
                    >
                      <p
                        className="font-serif text-lg font-light"
                        style={{
                          color:
                            state.timeOfDay === "night"
                              ? "rgba(247,243,234,0.9)"
                              : undefined,
                        }}
                      >
                        私の世界に来てくれて、ありがとう。
                      </p>
                      <p
                        className="mt-6 font-display text-sm tracking-wide"
                        style={{
                          color:
                            state.timeOfDay === "night"
                              ? "rgba(247,243,234,0.45)"
                              : "rgba(95,111,82,0.45)",
                        }}
                      >
                        —— 奥田ちゃん
                      </p>
                    </motion.div>
                  )}
              </AnimatePresence>

              <AnimatePresence>
                {nightMessage && (
                  <motion.p
                    className="mt-20 font-display text-base tracking-[0.15em] text-[#F7F3EA]/70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                  >
                    Good night, my love. ✿
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* P.S. */}
        <section className="relative flex min-h-[50vh] flex-col items-center justify-center px-6 pb-24">
          {(state.chapter === "night" ||
            state.chapter === "ps" ||
            state.finaleOpened) && (
            <div className="text-center">
              {!state.psOpened ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "OPEN_PS" })}
                  className="font-display text-xs tracking-[0.4em] text-[#F7F3EA]/35 transition-colors hover:text-[#F7F3EA]/70"
                >
                  P.S.
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2 }}
                  className="flex flex-col items-center"
                >
                  <p className="font-sans text-sm font-light text-[#F7F3EA]/70">
                    花は咲き終わった。
                  </p>
                  <p className="mt-4 font-sans text-sm font-light text-[#F7F3EA]/55">
                    でも……
                  </p>
                  <motion.div
                    className="mt-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 1 }}
                  >
                    <Seed stage="seed" clicks={0} interactive={false} />
                  </motion.div>
                  <p className="mt-6 font-sans text-sm font-light text-[#F7F3EA]/65">
                    まだ、伝え終わっていないみたい。
                  </p>
                  <SoftButton
                    className="mt-12 text-sm text-[#F7F3EA]/70"
                    onClick={() => {
                      unlocked.current = new Set([1]);
                      setCaptionId(null);
                      setCaptionVisible(false);
                      setLinesVisible(true);
                      setShowReveal(false);
                      setNightMessage(false);
                      setLongPress(0);
                      if (revealTimer.current) {
                        clearTimeout(revealTimer.current);
                        revealTimer.current = null;
                      }
                      clearCaptionTimers();
                      dispatch({ type: "RESTART" });
                      scrollerRef.current?.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                  >
                    もう一度始める
                  </SoftButton>
                </motion.div>
              )}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {state.flowers[1].stage === "alive" &&
          !captionVisible &&
          (state.flowers[2].stage === "seed" ||
            state.flowers[2].stage === "hidden") && (
            <motion.p
              className="pointer-events-none fixed bottom-8 left-0 right-0 text-center font-sans text-[11px] tracking-[0.25em] text-sage-deep/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.2, duration: 1.5 }}
            >
              もう少し下へ
            </motion.p>
          )}
      </AnimatePresence>
    </div>
  );
}

/** Soft memory of previously bloomed flowers */
function GardenMemory({
  flowers,
  upTo,
  windShake,
  dim,
}: {
  flowers: Record<FlowerId, FlowerState>;
  upTo: number;
  windShake: boolean;
  dim: boolean;
}) {
  const spots: { id: FlowerId; className: string }[] = [
    { id: 1, className: "absolute left-[8%] top-[8%]" },
    { id: 2, className: "absolute right-[10%] top-[6%]" },
    { id: 3, className: "absolute left-[14%] bottom-[22%]" },
    { id: 4, className: "absolute right-[16%] bottom-[20%]" },
  ];

  return (
    <>
      {spots
        .filter((s) => s.id <= upTo && flowers[s.id].stage === "alive")
        .map((s) => (
          <div key={s.id} className={`${s.className} scale-[0.65] opacity-55`}>
            <Flower
              stage="alive"
              color={flowers[s.id].color}
              accent={flowers[s.id].accent}
              size={68}
              windShake={windShake}
              dimmed={dim}
              special={s.id === 5}
            />
          </div>
        ))}
    </>
  );
}
