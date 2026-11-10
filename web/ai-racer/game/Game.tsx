"use client";

// Game screen: sets up the canvas and draws the track and the lap timer.

import { useEffect, useRef } from "react";
import { drawLapTimer } from "@/game/race/drawHud";
import { createLapTimer } from "@/game/race/lapTimer";
import { drawTrack } from "@/game/track/drawTrack";
import { buildTrack, WORLD_HEIGHT, WORLD_WIDTH } from "@/game/track/track";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // draw once the canvas is on the page
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // sharp lines on retina screens
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