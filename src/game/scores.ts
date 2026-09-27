import type { GameMode, SpeedPreset } from "./types";

export type ScoreRow = {
  name: string;
  score: number;
  mode: GameMode;
  speed: SpeedPreset;
  at: number;
};

export const MODE_INFO: Record<GameMode, { label: string; blurb: string }> = {
  cruise: { label: "Cruise", blurb: "Open road. Light traffic, extra nitro pads." },
  circuit: { label: "Circuit", blurb: "Classic run. Stages climb with your score." },
  rush: { label: "Nitro Rush", blurb: "Pads everywhere. Double-tap boost for blue flame." },
  survival: { label: "Survival", blurb: "Packed traffic and barriers. Highest payout." },
};

export const SPEED_INFO: Record<SpeedPreset, { label: string; mul: number }> = {
  touring: { label: "Touring", mul: 0.78 },
  sport: { label: "Sport", mul: 1 },
  super: { label: "Super", mul: 1.28 },
  insane: { label: "Insane", mul: 1.55 },
};

export const MODE_TUNING: Record<
  GameMode,
  { spawn: number; pads: number; barriersFrom: number; score: number; drain: number; extraTraffic: number }
> = {
  cruise: { spawn: 1.35, pads: 0.7, barriersFrom: 4, score: 0.85, drain: 0.85, extraTraffic: 0 },
  circuit: { spawn: 1, pads: 1, barriersFrom: 2, score: 1, drain: 1, extraTraffic: 0.3 },
  rush: { spawn: 0.92, pads: 0.55, barriersFrom: 3, score: 1.12, drain: 0.72, extraTraffic: 0.45 },
  survival: { spawn: 0.68, pads: 1.15, barriersFrom: 1, score: 1.4, drain: 1.15, extraTraffic: 0.7 },
};

const TABLE_KEY = "fnp-highscores-v1";
const BEST_KEY = "fast-nd-praise-best";

function readTable(): ScoreRow[] {
  try {
    const raw = JSON.parse(localStorage.getItem(TABLE_KEY) || "[]") as ScoreRow[];
    if (!Array.isArray(raw)) return [];
    return raw.filter((r) => r && typeof r.score === "number").slice(0, 40);
  } catch {
    return [];
  }
}

function writeTable(rows: ScoreRow[]) {
  try {
    localStorage.setItem(TABLE_KEY, JSON.stringify(rows.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export function loadScores(): ScoreRow[] {
  return readTable().sort((a, b) => b.score - a.score);
}

export function overallBest(): number {
  const fromTable = loadScores()[0]?.score || 0;
  try {
    return Math.max(fromTable, Number(localStorage.getItem(BEST_KEY) || 0) || 0);
  } catch {
    return fromTable;
  }
}

export function bestFor(mode: GameMode, speed: SpeedPreset): number {
  return loadScores()
    .filter((r) => r.mode === mode && r.speed === speed)
    .reduce((m, r) => Math.max(m, r.score), 0);
}

export function submitScore(row: Omit<ScoreRow, "at">): { table: ScoreRow[]; best: number; isHigh: boolean } {
  const table = loadScores();
  const isHigh = row.score > 0 && (table.length < 10 || row.score > (table[table.length - 1]?.score || 0) || row.score >= overallBest());
  const next = [...table, { ...row, at: Date.now() }].sort((a, b) => b.score - a.score).slice(0, 10);
  writeTable(next);
  const best = next[0]?.score || row.score;
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    /* ignore */
  }
  return { table: next, best, isHigh: row.score > 0 && row.score === best };
}
