// Mutation rate experiment: is 10% really a good chance for each weight to change?
// Trains from zero with 5%, 10% and 20%, and counts the generations until the first full lap.
// Runs the same game code without graphics: pnpm tsx experiments/mutation-rate.ts

import { setMutationRate } from "@/game/ai/evolution";
import { createTrainer, updateTrainer } from "@/game/ai/trainer";
import { setSeed } from "@/game/random";
import { buildTrack } from "@/game/track/track";

// Settings

const STEP = 1 / 120; // same physics step as the game
const RATES = [0.05, 0.1, 0.2];
const RUNS = 10; // training is random, one run could just be lucky
const MAX_GENERATIONS = 100; // a run that needs longer counts as 100

// Experiment

const track = buildTrack();

for (const rate of RATES) {
  setMutationRate(rate);
  const results: number[] = [];
  for (let seed = 1; seed <= RUNS; seed++) {
    setSeed(seed); // the same 10 seeds for every rate, so the comparison is fair
    results.push(firstLapGeneration());
  }
  const average = results.reduce((sum, generation) => sum + generation, 0) / RUNS;
  console.log(`mutation rate ${rate * 100}%: first full lap in generation ${results.join(", ")} (average ${average.toFixed(1)})`);
}

// Helpers

// trains from zero and gives back the generation of the first full lap
function firstLapGeneration(): number {
  const trainer = createTrainer(track);
  while (trainer.bestLap === null && trainer.generation < MAX_GENERATIONS) {
    updateTrainer(trainer, track, STEP);
  }
  return trainer.bestLap === null ? MAX_GENERATIONS : trainer.bestLapGeneration;
}
