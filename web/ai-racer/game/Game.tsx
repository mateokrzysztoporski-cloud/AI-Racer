"use client";

// Game screen: runs the game loop and draws everything every frame.

import { useEffect, useRef } from "react";
import { drawChart, saveChartImage } from "@/game/ai/drawChart";
import { downloadHistoryCsv, downloadTraining, forgetBrowserSave, loadDemoBrain, loadFromBrowser, pickTrainingFile, saveToBrowser, trainingToSave } from "@/game/ai/saveBrain";
import { describeGeneration } from "@/game/ai/stats";
import { createTrainer, LAYERS, leader, MAX_TIME, POPULATION, restoreTrainer, updateTrainer } from "@/game/ai/trainer";
import { createCar, updateCar, type Car } from "@/game/car/car";
import { listenToKeyboard } from "@/game/car/controls";
import { drawCar } from "@/game/car/drawCar";
import { drawSensors } from "@/game/car/drawSensors";
import { INPUT_NAMES, readSensors, sensorInputs } from "@/game/car/sensors";
import { drawHint, drawInputs, drawLapTimer, drawTrainingInfo } from "@/game/race/drawHud";
import { drawTrack } from "@/game/track/drawTrack";
import { buildTrack, WORLD_HEIGHT, WORLD_WIDTH, type Track } from "@/game/track/track";

// physics step in seconds
const STEP = 1 / 120;

// false = hide the sensor lines and the AI inputs panel
const SHOW_SENSORS = true;

// training speeds for the keys 1 to 5 ("max" = as fast as the computer can)
const SPEEDS = [1, 2, 5, 10, 1000];
const SPEED_NAMES = ["1x", "2x", "5x", "10x", "max"];
const PHYSICS_BUDGET = 12; // ms of physics per frame at most, so the page stays smooth

// canvas pixels per world pixel at most: 2 = 3200 x 1800, so big sharp screens don't slow training down
const MAX_SCALE = 2;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // start the game once the canvas is on the page
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const track = buildTrack();

    // sharp lines on every screen: the canvas gets as many pixels as it is shown with.
    // The track is drawn once on a hidden canvas of that size, then pasted every frame.
    // After a resize, a zoom or a move to another screen, both are made again.
    let background = fitCanvas(canvas, ctx, track);
    let pixelRatio = window.devicePixelRatio; // the pixel ratio the canvas was made for
    let sizeChanged = false;
    const resizeWatcher = new ResizeObserver(() => {
      sizeChanged = true;
    });
    resizeWatcher.observe(canvas);

    let cars: Car[] = [createCar(track.start)];

    // AI training: 100 cars learning, M switches between you driving and the AI
    const trainer = createTrainer(track);

    // continue where the last training stopped, if it was saved in this browser
    const saved = loadFromBrowser(LAYERS);
    if (saved) restoreTrainer(trainer, saved, track);
    let savedGenerations = trainer.history.length; // generations already saved in the browser

    // short message on the right, e.g. "brain downloaded"
    let notice = saved ? `continuing from generation ${saved.generation}` : "";
    let noticeUntil = saved ? performance.now() + 4000 : 0; // 0 = nothing to show
    const notify = (text: string, seconds = 2.5) => {
      notice = text;
      noticeUntil = performance.now() + seconds * 1000;
    };
    let mode: "drive" | "train" = "drive";
    let speedIndex = 0; // which of SPEEDS, keys 1 to 5
    let hideCrashed = false; // H hides crashed AI cars
    let realSpeed = 1; // how fast the game really runs, measured
    let showChart = true; // G shows / hides the progress chart
    let logged = trainer.history.length; // generations already written to the browser console

    // demo: the trained brain from generation 174 drives, so visitors don't see random cars first
    function startDemo() {
      loadDemoBrain(LAYERS).then((demo) => {
        if (!demo) {
          notify("trained AI not found");
          return;
        }
        restoreTrainer(trainer, demo, track);
        savedGenerations = trainer.history.length;
        logged = trainer.history.length;
        mode = "train";
        notify(`trained AI from generation ${demo.generation}, N = start from zero`, 8);
      });
    }
    if (!saved) startDemo(); // first visit: no training saved in this browser yet

    // Space = new car, M = drive / train, 1-5 = speed, H = hide crashed, G = chart,
    // P = save chart, B = download brain, L = load brain, N = new training, C = download history CSV
    // T = trained AI from generation 174
    const keyboard = listenToKeyboard((key) => {
      if (key === "Space" && mode === "drive") cars = [createCar(track.start)];
      if (key === "KeyM") mode = mode === "drive" ? "train" : "drive";
      if (key === "KeyH") hideCrashed = !hideCrashed;
      if (key === "KeyG") showChart = !showChart;
      if (key === "KeyP") saveChartImage(trainer.history);
      if (key === "KeyB") {
        const toSave = trainingToSave(trainer);
        if (toSave) downloadTraining(toSave);
        notify(toSave ? "brain downloaded (.json)" : "no brain yet, wait 1 generation");
      }
      if (key === "KeyL") {
        pickTrainingFile(LAYERS, (loaded) => {
          if (!loaded) {
            notify("not a brain file for this network");
            return;
          }
          restoreTrainer(trainer, loaded, track);
          savedGenerations = trainer.history.length;
          logged = trainer.history.length;
          mode = "train";
          notify(`loaded brain from generation ${loaded.generation}`);
        });
      }

      if (key === "KeyC") {
        const hasHistory = trainer.history.length > 0;
        if (hasHistory) downloadHistoryCsv(trainer.history);
        notify(hasHistory ? "history downloaded (.csv)" : "no history yet, wait 1 generation");
      }

      if (key === "KeyT") startDemo();
      if (key === "KeyN") {
        Object.assign(trainer, createTrainer(track));
        forgetBrowserSave();
        savedGenerations = 0;
        logged = 0;
        notify("new training started");
      }
      const number = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].indexOf(key);
      if (number >= 0) speedIndex = number;
    });

    // Game loop

    let lastTime = performance.now();
    let leftover = 0; // time not simulated yet TBD

    const frame = (now: number) => {
      // physics in fixed steps, more of them when training is sped up
      const frameTime = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const speed = mode === "train" ? SPEEDS[speedIndex] : 1;
      leftover += frameTime * speed;

      const stopAt = performance.now() + PHYSICS_BUDGET;
      let steps = 0;
      while (leftover >= STEP) {
        if (performance.now() > stopAt) {
          leftover = 0; // the computer can't keep up, skip the rest
          break;
        }
        if (mode === "drive") {
          const controls = keyboard.read();
          for (const car of cars) updateCar(car, controls, track, STEP);
        } else {
          updateTrainer(trainer, track, STEP);
        }
        leftover -= STEP;
        steps += 1;
      }

      // measured speed, smoothed so the number doesn't jump around
      if (frameTime > 0) realSpeed = realSpeed * 0.95 + ((steps * STEP) / frameTime) * 0.05;

      // one line per finished generation in the browser console (Cmd + Option + J)
      while (logged < trainer.history.length) {
        console.log(describeGeneration(trainer.history[logged]));
        logged += 1;
      }
      // after every generation: save the training in this browser
      if (trainer.history.length > savedGenerations) {
        savedGenerations = trainer.history.length;
        const toSave = trainingToSave(trainer);
        if (toSave) saveToBrowser(toSave);
      }
      // draw (the size is only changed here, right before drawing, so the canvas never shows up empty)
      if (sizeChanged || window.devicePixelRatio !== pixelRatio) {
        sizeChanged = false;
        pixelRatio = window.devicePixelRatio;
        background = fitCanvas(canvas, ctx, track);
      }
      ctx.drawImage(background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // in training: all 100 AI cars, and we watch the leader
      const shown = mode === "drive" ? cars : trainer.racers.map((racer) => racer.car);
      const watched = mode === "drive" ? cars[0] : leader(trainer);

      // sensor lines of the watched car, drawn under the cars
      const sensors = readSensors(watched, track);
      if (SHOW_SENSORS && !watched.crashed) {
        drawSensors(ctx, watched, sensors);
      }
      for (const car of shown) {
        if (car === watched || (hideCrashed && car.crashed)) continue;
        drawCar(ctx, car);
      }
      drawCar(ctx, watched, mode === "train"); // the watched car on top, outlined in training

      // lap timer of the watched car, in the top right corner
      const player = watched;
      drawLapTimer(ctx, player.timer, player.time * 1000);

      // AI inputs of the watched car, in the bottom left corner
      if (SHOW_SENSORS && !watched.crashed) {
        const inputs = sensorInputs(watched, sensors);
        drawInputs(ctx, INPUT_NAMES, inputs);
      }

      // training info under the lap timer, or a hint how to start training
      if (mode === "train") {
        drawTrainingInfo(ctx, {
          generation: trainer.generation,
          alive: trainer.racers.filter((racer) => !racer.car.crashed).length,
          population: POPULATION,
          time: trainer.time,
          maxTime: MAX_TIME,
          speed: SPEED_NAMES[speedIndex],
          realSpeed,
          bestLap: trainer.bestLap,
          bestLapGeneration: trainer.bestLapGeneration,
          hideCrashed,
        });
        if (showChart) drawChart(ctx, trainer.history);
      } else {
        drawHint(ctx, "M = AI training");
      }
      // short message, e.g. after saving or loading
      if (performance.now() < noticeUntil) drawHint(ctx, notice, mode === "train" ? 426 : 240);
      frameId = requestAnimationFrame(frame);
    };

    let frameId = requestAnimationFrame(frame);

    // stop everything when the page closes
    return () => {
      cancelAnimationFrame(frameId);
      keyboard.stop();
      resizeWatcher.disconnect();
    };
  }, []);

  // fill the window 16:9, the height follows the width
  const size = `min(100%, calc(100dvh * ${WORLD_WIDTH} / ${WORLD_HEIGHT}))`;
  const aspectRatio = `${WORLD_WIDTH} / ${WORLD_HEIGHT}`;

  return (
    <canvas
      ref={canvasRef}
      width={WORLD_WIDTH}
      height={WORLD_HEIGHT}
      style={{ width: size, aspectRatio }}
      role="img"
      aria-label="AI Racer: cars driving around a race track"
    />
  );
}

// Helpers

// gives the canvas as many pixels as it has on the screen, returns the track drawn at that size
function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, track: Track): HTMLCanvasElement {
  const shownWidth = canvas.getBoundingClientRect().width; // in CSS pixels
  const pixelRatio = window.devicePixelRatio || 1; // screen pixels per CSS pixel
  const scale = Math.min((shownWidth * pixelRatio) / WORLD_WIDTH, MAX_SCALE) || 1; // 0 = not on screen yet
  canvas.width = Math.max(Math.round(WORLD_WIDTH * scale), 1);
  canvas.height = Math.max(Math.round(WORLD_HEIGHT * scale), 1);
  // everything is still drawn in world pixels (1600 x 900), the canvas scales it
  ctx.setTransform(canvas.width / WORLD_WIDTH, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
  return drawBackground(track, canvas.width, canvas.height);
}

// draws the track once on a hidden canvas with the same number of pixels
function drawBackground(track: Track, width: number, height: number): HTMLCanvasElement {
  const background = document.createElement("canvas");
  background.width = width;
  background.height = height;
  const ctx = background.getContext("2d");
  if (ctx) {
    ctx.setTransform(width / WORLD_WIDTH, 0, 0, height / WORLD_HEIGHT, 0, 0);
    drawTrack(ctx, track);
  }
  return background;
}
