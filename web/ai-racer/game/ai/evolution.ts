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

// further = better, at the same progress faster = better
// time is at most 60 s
export function score(car: Car): number {
  return car.checkpointsPassed * 100 - car.lastProgressTime;
}

// Breeding

export function nextGeneration(scored: Scored[], size: number): Brain[] {
  const ranked = [...scored].sort((a, b) => b.score - a.score);

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