// Progress chart: how far the cars got in each generation, best / top 10 / average.

import type { GenerationStats } from "./stats";

// Settings

const CHART_X = 290; // in the grass under the top straight
const CHART_Y = 130;
const CHART_WIDTH = 420;
const CHART_HEIGHT = 120;
const MONO_FONT = "ui-monospace, Menlo, monospace";

const LINES = [
  { name: "best", color: "#4ade80", value: (row: GenerationStats) => row.bestProgress },
  { name: "top 10", color: "#facc15", value: (row: GenerationStats) => row.topTenProgress },
  { name: "average", color: "#60a5fa", value: (row: GenerationStats) => row.averageProgress },
];

// Chart

export function drawChart(ctx: CanvasRenderingContext2D, history: GenerationStats[]) {
  drawChartAt(ctx, history, CHART_X, CHART_Y, "rgba(0, 0, 0, 0.6)");
}

// saves the chart as a PNG file, e.g. for the README
export function saveChartImage(history: GenerationStats[]) {
  const scale = 2; // twice the size, so it stays sharp
  const canvas = document.createElement("canvas");
  canvas.width = CHART_WIDTH * scale;
  canvas.height = CHART_HEIGHT * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  drawChartAt(ctx, history, 0, 0, "#18181b"); // solid background for the image

  const link = document.createElement("a");
  link.download = `ai-racer-progress-gen-${history.length}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// Helpers

function drawChartAt(
  ctx: CanvasRenderingContext2D,
  history: GenerationStats[],
  x: number,
  y: number,
  background: string,
) {
  // background
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.roundRect(x, y, CHART_WIDTH, CHART_HEIGHT, 8);
  ctx.fill();

  // title and legend
  ctx.font = `12px ${MONO_FONT}`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText("PROGRESS (laps)", x + 12, y + 20);
  LINES.forEach((line, i) => {
    ctx.fillStyle = line.color;
    ctx.fillText(line.name, x + 170 + i * 75, y + 20);
  });

  // the plot area
  const left = x + 36;
  const right = x + CHART_WIDTH - 12;
  const top = y + 32;
  const bottom = y + CHART_HEIGHT - 20;

  if (history.length < 2) {
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("waiting for the first generations...", left, (top + bottom) / 2);
    return;
  }

  // up to the best result so far, at least 1 lap
  const maxLaps = Math.max(1, Math.ceil(Math.max(...history.map((row) => row.bestProgress))));
  const toX = (i: number) => left + (i / (history.length - 1)) * (right - left);
  const toY = (laps: number) => bottom - (laps / maxLaps) * (bottom - top);

  // one grid line per lap
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "right";
  for (let laps = 0; laps <= maxLaps; laps++) {
    ctx.beginPath();
    ctx.moveTo(left, toY(laps));
    ctx.lineTo(right, toY(laps));
    ctx.stroke();
    ctx.fillText(String(laps), left - 8, toY(laps) + 4);
  }

  // generation numbers under the plot
  ctx.textAlign = "left";
  ctx.fillText(`gen ${history[0].generation}`, left, bottom + 15);
  ctx.textAlign = "right";
  ctx.fillText(`gen ${history[history.length - 1].generation}`, right, bottom + 15);

  // the three lines
  ctx.lineWidth = 2;
  for (const line of LINES) {
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    history.forEach((row, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(line.value(row)));
      else ctx.lineTo(toX(i), toY(line.value(row)));
    });
    ctx.stroke();
  }
}