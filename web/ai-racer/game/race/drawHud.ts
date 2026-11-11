// Draws the lap timer box in the top right corner and the AI inputs in the bottom left.

import { WORLD_HEIGHT, WORLD_WIDTH } from "@/game/track/track";
import { currentLapTime, formatTime, type LapTimer } from "./lapTimer";

const MONO_FONT = "ui-monospace, Menlo, monospace";

export function drawLapTimer(ctx: CanvasRenderingContext2D, timer: LapTimer, now: number) {
  const width = 132;
  const height = 100;
  const x = WORLD_WIDTH - width - 10;
  const y = 10;
  const left = x + 12;
  const right = x + width - 12;

  // background
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();

  // current lap
  ctx.fillStyle = "#a1a1aa";
  ctx.font = `12px ${MONO_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("LAP", left, y + 22);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 22px ${MONO_FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(formatTime(currentLapTime(timer, now)), right, y + 48);

  // last + best
  drawTimerRow(ctx, "LAST", formatTime(timer.lastLap), left, right, y + 70);
  drawTimerRow(ctx, "BEST", formatTime(timer.bestLap), left, right, y + 88);
}

function drawTimerRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  time: string,
  left: number,
  right: number,
  y: number,
) {
  ctx.font = `13px ${MONO_FONT}`;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "left";
  ctx.fillText(label, left, y);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText(time, right, y);
}

// AI inputs

// what the AI sees: one bar per input, red = wall close, green = far, blue = speed
export function drawInputs(ctx: CanvasRenderingContext2D, names: string[], inputs: number[]) {
  const rowHeight = 14;
  const width = 190;
  const height = 30 + inputs.length * rowHeight;
  const x = 10;
  const y = WORLD_HEIGHT - height - 10;
  const barX = x + 58;
  const barWidth = 80;

  // background
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();

  ctx.font = `12px ${MONO_FONT}`;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "left";
  ctx.fillText("AI INPUTS", x + 12, y + 20);

  inputs.forEach((value, i) => {
    const rowY = y + 30 + i * rowHeight;
    const isSpeed = i === inputs.length - 1;

    // name
    ctx.fillStyle = "#a1a1aa";
    ctx.textAlign = "left";
    ctx.fillText(names[i], x + 12, rowY + 10);

    // bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(barX, rowY + 2, barWidth, 9);
    ctx.fillStyle = isSpeed ? "#60a5fa" : `hsl(${Math.round(value * 120)}, 90%, 55%)`;
    ctx.fillRect(barX, rowY + 2, barWidth * Math.min(Math.max(value, 0), 1), 9);

    // number
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(value.toFixed(2), x + width - 10, rowY + 10);
  });
}

// Training info (right side, under the lap timer)

export type TrainingInfo = {
  generation: number;
  alive: number; // AI cars still driving
  population: number;
  time: number; // seconds into this generation
  maxTime: number;
  speed: string; // the chosen speed, e.g. "5x" or "max"
  realSpeed: number; // how fast it really runs, e.g. 4.8
  bestLap: number | null; // fastest lap of all generations, in ms
  bestLapGeneration: number;
  hideCrashed: boolean;
};

export function drawTrainingInfo(ctx: CanvasRenderingContext2D, info: TrainingInfo) {
  const rows = [
    ["gen", String(info.generation)],
    ["alive", `${info.alive}/${info.population}`],
    ["time", `${info.time.toFixed(1)}/${info.maxTime} s`],
    ["speed", `${info.speed} (${info.realSpeed.toFixed(1)}x)`],
    ["best lap", formatTime(info.bestLap)],
    ["from gen", info.bestLap === null ? "-" : String(info.bestLapGeneration)],
  ];
  const width = 160;
  const height = 40 + rows.length * 17 + 74;
  const x = WORLD_WIDTH - width - 10;
  const y = 200;
  const left = x + 12;
  const right = x + width - 12;

  // background
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();

  ctx.font = `12px ${MONO_FONT}`;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "left";
  ctx.fillText("AI TRAINING", left, y + 22);

  rows.forEach(([label, value], i) => {
    drawTimerRow(ctx, label, value, left, right, y + 44 + i * 17);
  });

  // keys
  ctx.font = `11px ${MONO_FONT}`;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "left";
  ctx.fillText("T trained AI", left, y + height - 66);
  ctx.fillText("1-5 speed   M drive", left, y + height - 52);
  ctx.fillText(`H ${info.hideCrashed ? "show" : "hide"} crashed cars`, left, y + height - 38);
  ctx.fillText("G chart P png C csv", left, y + height - 24);
  ctx.fillText("B save L load N new", left, y + height - 10);
}

// small one-line box under the lap timer, e.g. "M = AI training"
export function drawHint(ctx: CanvasRenderingContext2D, text: string, y = 200) {
  ctx.font = `12px ${MONO_FONT}`;
  const width = Math.max(160, ctx.measureText(text).width + 24); // wider for longer text
  const x = WORLD_WIDTH - width - 10;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, 30, 8);
  ctx.fill();

  ctx.font = `12px ${MONO_FONT}`;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "left";
  ctx.fillText(text, x + 12, y + 19);
}
