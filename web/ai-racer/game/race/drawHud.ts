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