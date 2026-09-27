export type GameMode = "cruise" | "circuit" | "rush" | "survival";
export type SpeedPreset = "touring" | "sport" | "super" | "insane";

export type GameSettings = {
  name: string;
  mode: GameMode;
  speed: SpeedPreset;
};

export type GameHud = {
  score: number;
  best: number;
  speed: number;
  nitro: number;
  stage: number;
  crashed: boolean;
  paused: boolean;
  playing: boolean;
  boosting: boolean;
  doubleNitro: boolean;
  isHigh: boolean;
  mode: GameMode;
  speedPreset: SpeedPreset;
};

export type RemoteSnapshot = {
  id: string;
  name: string;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  nitro: number;
  crashed: boolean;
  color: number;
};

export type LocalSnapshot = {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  nitro: number;
  crashed: boolean;
  score: number;
  color: number;
  name: string;
};

export type TouchActions = {
  steer: number;
  throttle: number;
  brake: number;
  boost: number;
};

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  setSteer?: (v: number) => void;
  setKeys?: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}
