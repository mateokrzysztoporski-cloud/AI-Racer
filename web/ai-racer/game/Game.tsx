"use client";

// Game screen: runs the game loop and draws everything every frame.

import { useEffect, useRef } from "react";
import { createCar, updateCar, type Car } from "@/game/car/car";
import { listenToKeyboard } from "@/game/car/controls";
import { drawCar } from "@/game/car/drawCar";
import { drawLapTimer } from "@/game/race/drawHud";
import { drawTrack } from "@/game/track/drawTrack";
import { buildTrack, WORLD_HEIGHT, WORLD_WIDTH, type Track } from "@/game/track/track";

// physics step in seconds
const STEP = 1 / 120;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // start the game once the canvas is on the page
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // sharp lines on screens
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = WORLD_WIDTH * pixelRatio;
    canvas.height = WORLD_HEIGHT * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);

        // track is drawn once, then pasted every frame
    const track = buildTrack();
    const background = drawBackground(track, pixelRatio);

    let cars: Car[] = [createCar(track.start)];

    // Space = new car in the start box
    const keyboard = listenToKeyboard(() => {
      cars = [createCar(track.start)];
    });

    // Game loop

    let lastTime = performance.now();
    let leftover = 0; // time not simulated yet TBD

    const frame = (now: number) => {
      // physics in fixed steps
      leftover += Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      while (leftover >= STEP) {
        const controls = keyboard.read();
        for (const car of cars) updateCar(car, controls, track, STEP);
        leftover -= STEP;
      }

      // draw
      ctx.drawImage(background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      for (const car of cars) drawCar(ctx, car);

      // lap timer of the first car, in the top left corner
      const player = cars[0];
      drawLapTimer(ctx, player.timer, player.time * 1000);

      frameId = requestAnimationFrame(frame);
    };

    let frameId = requestAnimationFrame(frame);

    // stop everything when the page closes
    return () => {
      cancelAnimationFrame(frameId);
      keyboard.stop();
    };
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

// Helpers

// draws the track once on a hidden canvas
function drawBackground(track: Track, pixelRatio: number): HTMLCanvasElement {
  const background = document.createElement("canvas");
  background.width = WORLD_WIDTH * pixelRatio;
  background.height = WORLD_HEIGHT * pixelRatio;
  const ctx = background.getContext("2d");
  if (ctx) {
    ctx.scale(pixelRatio, pixelRatio);
    drawTrack(ctx, track);
  }
  return background;
}