// Trainer: 100 AI cars learn to drive, generation after generation.

import { createCar, updateCar, type Car } from "@/game/car/car";
import type { Controls } from "@/game/car/controls";
import { INPUT_COUNT, readSensors, sensorInputs } from "@/game/car/sensors";
import type { Track } from "@/game/track/track";
import { createBrain, think, type Brain } from "./brain";
import { nextGeneration, score } from "./evolution";
import type { SavedTraining } from "./saveBrain";
import { measureGeneration, type GenerationStats } from "./stats";

// Types

// one AI driver: a car and the brain that drives it
export type Racer = {
  car: Car;
  brain: Brain;
  controls: Controls; // the brain's last decision
};

export type Trainer = {
  generation: number; // starts at 1
  racers: Racer[];
  time: number; // seconds since this generation started
  steps: number; // physics steps since this generation started
  bestScore: number; // best score of all generations so far
  bestBrain: Brain | null; // the brain that got it
  bestLap: number | null; // fastest lap of all generations, in ms
  history: GenerationStats[]; // one row of stats per finished generation
  bestLapGeneration: number; // which generation drove it
};

// Settings

export const LAYERS = [INPUT_COUNT, 8, 6, 2]; // 8 sensors in, 2 hidden layers, gas + steer out
export const POPULATION = 100; // cars per generation
const THINK_EVERY = 4; // the brains decide every 4th physics step (30 times a second)
const STUCK_TIME = 5; // seconds without a new checkpoint = out
export const MAX_TIME = 60; // seconds, then the generation ends anyway

// Trainer

export function createTrainer(track: Track): Trainer {
  const brains = Array.from({ length: POPULATION }, () => createBrain(LAYERS));
  return {
    generation: 1,
    racers: brains.map((brain) => createRacer(brain, track)),
    time: 0,
    steps: 0,
    bestScore: 0,
    bestBrain: null,
    history: [],
    bestLap: null,
    bestLapGeneration: 0,
  };
}

// moves all AI cars forward in time by dt seconds
export function updateTrainer(trainer: Trainer, track: Track, dt: number) {
  const thinkNow = trainer.steps % THINK_EVERY === 0;
  trainer.steps += 1;
  trainer.time += dt;

  for (const racer of trainer.racers) {
    const car = racer.car;
    if (car.crashed) continue;

    // the brain looks at the sensors and decides
    if (thinkNow) {
      const [gas, steer] = think(racer.brain, sensorInputs(car, readSensors(car, track)));
      racer.controls = { gas, steer };
    }
    updateCar(car, racer.controls, track, dt);

    // new fastest lap of all generations?
    const lap = car.timer.bestLap;
    if (lap !== null && (trainer.bestLap === null || lap < trainer.bestLap)) {
      trainer.bestLap = lap;
      trainer.bestLapGeneration = trainer.generation;
    }

    // stuck or driving in circles: out
    if (car.time - car.lastProgressTime > STUCK_TIME) car.crashed = true;
  }

  // everyone out, or time is up: next generation
  const allOut = trainer.racers.every((racer) => racer.car.crashed);
  if (allOut || trainer.time > MAX_TIME) startNextGeneration(trainer, track);
}

// the car with the best score that is still driving (or the best one, if all are out)
export function leader(trainer: Trainer): Car {
  const driving = trainer.racers.filter((racer) => !racer.car.crashed);
  const candidates = driving.length > 0 ? driving : trainer.racers;
  let best = candidates[0].car;
  for (const racer of candidates) {
    if (score(racer.car) > score(best)) best = racer.car;
  }
  return best;
}
// continues training from a saved brain: 1 exact copy, the other 99 bred from it
export function restoreTrainer(trainer: Trainer, saved: SavedTraining, track: Track) {
  const brain = { layers: [...saved.layers], weights: [...saved.weights] };
  const brains = nextGeneration([{ brain, score: 1 }], POPULATION);
  trainer.racers = brains.map((child) => createRacer(child, track));
  trainer.generation = saved.generation + 1;
  trainer.time = 0;
  trainer.steps = 0;
  trainer.bestScore = 0;
  trainer.bestBrain = brain;
  trainer.bestLap = saved.bestLap;
  trainer.bestLapGeneration = saved.bestLapGeneration;
  trainer.history = [...saved.history];
}

// Helpers

function createRacer(brain: Brain, track: Track): Racer {
  return { car: createCar(track.start), brain, controls: { gas: 0, steer: 0 } };
}

function startNextGeneration(trainer: Trainer, track: Track) {
   // save this generation's numbers for the chart
  trainer.history.push(
    measureGeneration(trainer.generation, trainer.racers, track.checkpoints.length, trainer.time),
  );
  const scored = trainer.racers.map((racer) => ({ brain: racer.brain, score: score(racer.car) }));

  // remember the best brain ever
  for (const racer of scored) {
    if (racer.score > trainer.bestScore) {
      trainer.bestScore = racer.score;
      trainer.bestBrain = racer.brain;
    }
  }

  const brains = nextGeneration(scored, POPULATION);
  trainer.racers = brains.map((brain) => createRacer(brain, track));
  trainer.generation += 1;
  trainer.time = 0;
  trainer.steps = 0;
}