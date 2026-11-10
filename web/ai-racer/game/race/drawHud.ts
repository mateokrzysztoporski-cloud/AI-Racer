// Draws the lap timer box in the top right corner.

import { WORLD_WIDTH } from "@/game/track/track";
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