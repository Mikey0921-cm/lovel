export type FlowerId = 1 | 2 | 3 | 4 | 5 | 6;

export type FlowerStage = "hidden" | "seed" | "sprout" | "bud" | "blooming" | "alive";

export type TimeOfDay =
  | "dawn"
  | "day"
  | "dusk-peach"
  | "dusk-rose"
  | "dusk-violet"
  | "dusk"
  | "night";

export type Chapter =
  | "intro"
  | "seed"
  | "consent"
  | "meet"
  | "like"
  | "miss"
  | "gentle"
  | "secret"
  | "alive"
  | "reveal"
  | "finale"
  | "night"
  | "ps";

export interface FlowerState {
  id: FlowerId;
  stage: FlowerStage;
  title: string;
  number: string;
  color: string;
  accent: string;
  x: number; // percentage
  y: number; // percentage within garden scroll
}

export interface GardenSnapshot {
  chapter: Chapter;
  seedClicks: number;
  flowers: Record<FlowerId, FlowerState>;
  timeOfDay: TimeOfDay;
  gardenAlive: boolean;
  showConsent: boolean;
  secretHint: boolean;
  secretClicks: number;
  revealStep: number;
  finaleOpened: boolean;
  psOpened: boolean;
  restartCount: number;
  focusFlower: FlowerId | null;
  textVisible: boolean;
}
