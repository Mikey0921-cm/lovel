"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  Chapter,
  FlowerId,
  FlowerState,
  GardenSnapshot,
  TimeOfDay,
} from "./types";

const FLOWER_META: Record<
  FlowerId,
  Pick<FlowerState, "title" | "number" | "color" | "accent" | "x" | "y">
> = {
  1: {
    title: "出会い",
    number: "01",
    color: "#F5EDE0",
    accent: "#E8D5B7",
    x: 50,
    y: 18,
  },
  2: {
    title: "好き",
    number: "02",
    color: "#E8C9C0",
    accent: "#D4A8A0",
    x: 72,
    y: 38,
  },
  3: {
    title: "想い",
    number: "03",
    color: "#E6C4A8",
    accent: "#C9A078",
    x: 28,
    y: 52,
  },
  4: {
    title: "優しさ",
    number: "04",
    color: "#C9B8D4",
    accent: "#A894B8",
    x: 58,
    y: 68,
  },
  5: {
    title: "秘密",
    number: "05",
    color: "#EDE4D4", // 奶白香槟
    accent: "#C9B8D4", // 淡紫
    x: 40,
    y: 82,
  },
  6: {
    title: "最後の一輪",
    number: "",
    color: "#D8C8E0",
    accent: "#A894C0",
    x: 50,
    y: 94,
  },
};

function createInitialFlowers(keepFirst = false): Record<FlowerId, FlowerState> {
  const ids: FlowerId[] = [1, 2, 3, 4, 5, 6];
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        id,
        stage:
          keepFirst && id === 1
            ? ("alive" as const)
            : keepFirst && id === 2
              ? ("seed" as const)
              : id === 1
                ? ("seed" as const)
                : ("hidden" as const),
        ...FLOWER_META[id],
      },
    ]),
  ) as Record<FlowerId, FlowerState>;
}

function createInitialState(restartCount = 0): GardenSnapshot {
  const keepFirst = restartCount > 0;
  return {
    chapter: keepFirst ? "like" : "intro",
    seedClicks: keepFirst ? 3 : 0,
    flowers: createInitialFlowers(keepFirst),
    timeOfDay: keepFirst ? "day" : "dawn",
    gardenAlive: false,
    showConsent: false,
    secretHint: false,
    secretClicks: 0,
    revealStep: 0,
    finaleOpened: false,
    psOpened: false,
    restartCount,
    focusFlower: null,
    textVisible: true,
  };
}

type Action =
  | { type: "SEED_CLICK" }
  | { type: "ACCEPT_GROW" }
  | { type: "SET_CHAPTER"; chapter: Chapter }
  | { type: "SET_TIME"; time: TimeOfDay }
  | { type: "UPDATE_FLOWER"; id: FlowerId; stage: FlowerState["stage"] }
  | { type: "FOCUS_FLOWER"; id: FlowerId | null }
  | { type: "SET_TEXT_VISIBLE"; visible: boolean }
  | { type: "SECRET_CLICK" }
  | { type: "SHOW_SECRET_HINT" }
  | { type: "ADVANCE_REVEAL" }
  | { type: "OPEN_FINALE" }
  | { type: "GARDEN_ALIVE" }
  | { type: "OPEN_PS" }
  | { type: "RESTART" }
  | { type: "UNLOCK_SEED"; id: FlowerId };

function reducer(state: GardenSnapshot, action: Action): GardenSnapshot {
  switch (action.type) {
    case "SEED_CLICK": {
      // 允许 intro / seed 阶段推进；已到 consent 则忽略
      if (
        state.chapter !== "intro" &&
        state.chapter !== "seed" &&
        state.chapter !== "consent"
      ) {
        return state;
      }
      if (state.chapter === "consent" || state.seedClicks >= 3) {
        return state;
      }

      const next = state.seedClicks + 1;
      const flowers = { ...state.flowers };

      // 1 震动  2 裂开  3 发芽 + 询问
      if (next === 1) {
        flowers[1] = { ...flowers[1], stage: "seed" };
        return {
          ...state,
          seedClicks: next,
          flowers,
          chapter: "seed",
        };
      }
      if (next === 2) {
        flowers[1] = { ...flowers[1], stage: "seed" };
        return {
          ...state,
          seedClicks: next,
          flowers,
          chapter: "seed",
        };
      }
      // next === 3
      flowers[1] = { ...flowers[1], stage: "sprout" };
      return {
        ...state,
        seedClicks: 3,
        flowers,
        chapter: "consent",
        showConsent: true,
      };
    }
    case "ACCEPT_GROW":
      return {
        ...state,
        showConsent: false,
        chapter: "meet",
        timeOfDay: "day",
        focusFlower: 1,
        flowers: {
          ...state.flowers,
          1: { ...state.flowers[1], stage: "blooming" },
        },
      };
    case "SET_CHAPTER":
      return { ...state, chapter: action.chapter };
    case "SET_TIME":
      return { ...state, timeOfDay: action.time };
    case "UPDATE_FLOWER":
      return {
        ...state,
        flowers: {
          ...state.flowers,
          [action.id]: { ...state.flowers[action.id], stage: action.stage },
        },
      };
    case "FOCUS_FLOWER":
      return { ...state, focusFlower: action.id };
    case "SET_TEXT_VISIBLE":
      return { ...state, textVisible: action.visible };
    case "UNLOCK_SEED":
      return {
        ...state,
        flowers: {
          ...state.flowers,
          [action.id]: {
            ...state.flowers[action.id],
            stage:
              state.flowers[action.id].stage === "hidden"
                ? "seed"
                : state.flowers[action.id].stage,
          },
        },
      };
    case "SECRET_CLICK": {
      const clicks = state.secretClicks + 1;
      if (clicks >= 2 && !state.secretHint) {
        return { ...state, secretClicks: clicks, secretHint: true };
      }
      return { ...state, secretClicks: clicks };
    }
    case "SHOW_SECRET_HINT":
      return { ...state, secretHint: true };
    case "ADVANCE_REVEAL":
      return { ...state, revealStep: state.revealStep + 1 };
    case "OPEN_FINALE":
      return {
        ...state,
        finaleOpened: true,
        chapter: "finale",
        focusFlower: 6,
        flowers: {
          ...state.flowers,
          6: { ...state.flowers[6], stage: "blooming" },
        },
      };
    case "GARDEN_ALIVE":
      return {
        ...state,
        gardenAlive: true,
        chapter: "alive",
        focusFlower: null,
      };
    case "OPEN_PS":
      return { ...state, psOpened: true, chapter: "ps" };
    case "RESTART":
      return createInitialState(state.restartCount + 1);
    default:
      return state;
  }
}

interface GardenContextValue {
  state: GardenSnapshot;
  dispatch: React.Dispatch<Action>;
  bloomFlower: (id: FlowerId) => void;
  markAlive: (id: FlowerId) => void;
}

const GardenContext = createContext<GardenContextValue | null>(null);

export function GardenProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(0),
  );

  const bloomFlower = useCallback((id: FlowerId) => {
    dispatch({ type: "UPDATE_FLOWER", id, stage: "blooming" });
    dispatch({ type: "FOCUS_FLOWER", id });
  }, []);

  const markAlive = useCallback((id: FlowerId) => {
    dispatch({ type: "UPDATE_FLOWER", id, stage: "alive" });
    dispatch({ type: "FOCUS_FLOWER", id: null });
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, bloomFlower, markAlive }),
    [state, bloomFlower, markAlive],
  );

  return (
    <GardenContext.Provider value={value}>{children}</GardenContext.Provider>
  );
}

export function useGarden() {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error("useGarden must be used within GardenProvider");
  return ctx;
}
