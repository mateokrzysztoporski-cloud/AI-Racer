"use client"; 

// Game screen: draws the track on a canvas.

import { useEffect, useRef } from "react";
import {
  createLapTimer,
  currentLapTime,
  formatTime,
  type LapTimer,
} from "./lapTimer";
import {
  buildTrack,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type Point,
  type Segment,
  type StartPosition,
  type Track,
} from "./track";

const SHOW_CHECKPOINTS = true; // false = hide the yellow lines
const MONO_FONT = "ui-monospace, Menlo, monospace";

// Component 

export default function RaceTrack() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // draw once the canvas is on the page
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // sharp lines screens
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = WORLD_WIDTH * pixelRatio;
    canvas.height = WORLD_HEIGHT * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);

    drawTrack(ctx, buildTrack());
    drawLapTimer(ctx, createLapTimer(), performance.now());
  }, []);

  // fill the window 16:9
  const size = `min(100%, calc(100dvh * ${WORLD_WIDTH} / ${WORLD_HEIGHT}))`;

  return (
    <canvas
      ref={canvasRef}
      width={WORLD_WIDTH}
      height={WORLD_HEIGHT}
      style={{ width: size }}
    />
  );
}

// Track

function drawTrack(ctx: CanvasRenderingContext2D, track: Track) {
  // grass
  ctx.fillStyle = "#3f7d3a";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // road 
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3b3b3b";
  ctx.lineWidth = track.width;
  drawLoop(ctx, track.center);

  // walls
  ctx.strokeStyle = "#f5f5f5";
  ctx.lineWidth = 3;
  drawLoop(ctx, track.left);
  drawLoop(ctx, track.right);

  // checkpoints
  if (SHOW_CHECKPOINTS) {
    ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const checkpoint of track.checkpoints.slice(1)) {
      drawSegment(ctx, checkpoint);
    }
    ctx.setLineDash([]);
  }

  // start/finish line
  const startLine = track.checkpoints[0];
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ffffff";
  drawSegment(ctx, startLine);
  ctx.strokeStyle = "#111111";
  ctx.setLineDash([10, 10]);
  drawSegment(ctx, startLine);
  ctx.setLineDash([]);

  drawStartBox(ctx, track.start);
}

// Start box 

// where the car starts and which way it goes
function drawStartBox(ctx: CanvasRenderingContext2D, start: StartPosition) {
  ctx.save();
  ctx.translate(start.position.x, start.position.y);
  ctx.rotate(start.angle); //  +x = forward

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -14);
  ctx.lineTo(22, -14);
  ctx.lineTo(22, 14);
  ctx.lineTo(-22, 14);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-6, -7);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Lap timer  

function drawLapTimer(ctx: CanvasRenderingContext2D, timer: LapTimer, now: number) {
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

//  Helpers 

// line through all points and back to the first
function drawLoop(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawSegment(ctx: CanvasRenderingContext2D, segment: Segment) {
  ctx.beginPath();
  ctx.moveTo(segment.a.x, segment.a.y);
  ctx.lineTo(segment.b.x, segment.b.y);
  ctx.stroke();
}