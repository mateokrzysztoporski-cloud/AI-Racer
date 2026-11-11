// Stats: one row of numbers per generation, for the progress chart and later the CSV export.

import { formatTime } from "@/game/race/lapTimer";
import type { Racer } from "./trainer";

export type GenerationStats = {
  generation: number;
  bestProgress: number; // the best car, in laps (1 = one full lap)
  topTenProgress: number; // average of the best 10 cars, in laps
  averageProgress: number; // average of all cars, in laps
  fullLaps: number; // how many cars finished at least one lap
  bestLap: number | null; // fastest lap in this generation, in ms
  duration: number; // how long the generation lasted, in seconds
};

// measures a generation that just ended
export function measureGeneration(
  generation: number,
  racers: Racer[],
  checkpointsPerLap: number,
  duration: number,
): GenerationStats {
  const progress = racers
    .map((racer) => racer.car.checkpointsPassed / checkpointsPerLap)
    .sort((a, b) => b - a);
  const laps = racers
    .map((racer) => racer.car.timer.bestLap)
    .filter((lap): lap is number => lap !== null);

  return {
    generation,
    bestProgress: progress[0],
    topTenProgress: average(progress.slice(0, 10)),
    averageProgress: average(progress),
    fullLaps: laps.length,
    bestLap: laps.length > 0 ? Math.min(...laps) : null,
    duration,
  };
}

// one readable line, e.g. for the browser console
export function describeGeneration(stats: GenerationStats): string {
  const percent = (laps: number) => `${Math.round(laps * 100)}%`;
  return (
    `gen ${stats.generation}: best ${percent(stats.bestProgress)} of a lap, ` +
    `top 10 ${percent(stats.topTenProgress)}, average ${percent(stats.averageProgress)}, ` +
    `${stats.fullLaps} cars with a full lap, best lap ${formatTime(stats.bestLap)}, ` +
    `${stats.duration.toFixed(1)} s`
  );
}

// the history as a CSV table (opens in Excel / Google Sheets), one row per generation
export function historyToCsv(history: GenerationStats[]): string {
  const header = [
    "generation",
    "best_laps",
    "top10_laps",
    "average_laps",
    "cars_with_full_lap",
    "best_lap_seconds",
    "duration_seconds",
  ].join(",");
  const rows = history.map((row) =>
    [
      row.generation,
      row.bestProgress.toFixed(3),
      row.topTenProgress.toFixed(3),
      row.averageProgress.toFixed(3),
      row.fullLaps,
      row.bestLap === null ? "" : (row.bestLap / 1000).toFixed(3),
      row.duration.toFixed(1),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

// Helpers

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}
