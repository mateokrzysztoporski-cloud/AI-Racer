// Evolution: scores the cars and breeds the next generation from the best brains.

import type { Car } from "@/game/car/car";
import { copyBrain, crossover, mutate, type Brain } from "./brain";

export type Scored = { brain: Brain; score: number };

// Settings

const ELITE_COUNT = 5; // the best brains go to the next generation unchanged
const PARENT_POOL = 20; // parents are picked from the best 20
const MUTATION_RATE = 0.1; // chance for each weight to change
const MUTATION_AMOUNT = 0.5; // how big a change can be

// Score

// further = better. With the same checkpoints, the car that survived longer wins:
// braking before a corner beats crashing into it, so the AI learns to slow down.
// Speed still counts: in 60 s, a faster car passes more checkpoints.
export function score(car: Car): number {
  return car.checkpointsPassed + Math.min(car.time, 60) / 100;
}

// Breeding

export function nextGeneration(scored: Scored[], size: number): Brain[] {
  const ranked = shuffle([...scored]).sort((a, b) => b.score - a.score);

  // the best ones stay exactly as they are, so the best result is never lost
  const next = ranked.slice(0, ELITE_COUNT).map((racer) => copyBrain(racer.brain));

  // the rest: two parents from the top, mixed, then changed a little
  const parents = ranked.slice(0, PARENT_POOL);
  while (next.length < size) {
    const mother = pickRandom(parents).brain;
    const father = pickRandom(parents).brain;
    next.push(mutate(crossover(mother, father), MUTATION_RATE, MUTATION_AMOUNT));
  }

  return next;
}

// Helpers

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// random order, so cars with the same score get the same chance
function shuffle<T>(list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
