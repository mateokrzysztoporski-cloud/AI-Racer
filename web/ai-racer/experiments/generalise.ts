// Generalisation test: can the trained brain drive a track it has never seen?
// Runs the same game code without graphics: pnpm tsx experiments/generalise.ts

import { readFileSync } from "node:fs";
import { parseTraining, type SavedTraining } from "@/game/ai/saveBrain";
import type { GenerationStats } from "@/game/ai/stats";
import { createTrainer, LAYERS, restoreTrainer, updateTrainer, type Trainer } from "@/game/ai/trainer";
import { buildTrack, type Track, type TrackVariant } from "@/game/track/track";

// Settings

const STEP = 1 / 120; // same physics step as the game
const BRAIN_FILE = "public/ai-racer-brain-gen-174.json";
const VARIANTS: TrackVariant[] = ["normal", "mirror", "reverse"];
const RUNS = 5; // training is random, so every training test runs a few times
const MAX_GENERATIONS = 100; // give up after this many

// Test

const saved = loadBrain();

for (const variant of VARIANTS) {
  const track = buildTrack(variant);
  console.log(`\n${variant} track`);

  // 1. the exact trained brain alone, with no extra training
  const trainer = createTrainer(track);
  restoreTrainer(trainer, saved, track);
  trainer.racers = trainer.racers.slice(0, 1); // the first car has the exact brain, the other 99 are changed copies
  const drive = finishGeneration(trainer, track);
  console.log(`  trained brain, no extra training: ${drive.bestProgress.toFixed(2)} laps in ${drive.duration.toFixed(1)} s`);

  // 2. generations until the first full lap: training on from the trained brain, and from zero
  const fromTrained = Array.from({ length: RUNS }, () => generationsUntilLap(track, true));
  console.log(`  first full lap, trained brain + more training: generation ${fromTrained.join(", ")}`);
  const fromZero = Array.from({ length: RUNS }, () => generationsUntilLap(track, false));
  console.log(`  first full lap, training from zero: generation ${fromZero.join(", ")}`);
}

// Helpers

function loadBrain(): SavedTraining {
  const brain = parseTraining(readFileSync(BRAIN_FILE, "utf8"), LAYERS);
  if (!brain) throw new Error(`${BRAIN_FILE} is not a brain file for this network`);
  return brain;
}

// runs the physics until this generation is over and gives back its numbers
function finishGeneration(trainer: Trainer, track: Track): GenerationStats {
  const before = trainer.history.length;
  while (trainer.history.length === before) updateTrainer(trainer, track, STEP);
  return trainer.history[trainer.history.length - 1];
}

// trains on this track and counts the generations until a car finishes a lap
function generationsUntilLap(track: Track, fromTrained: boolean): number | string {
  const trainer = createTrainer(track);
  if (fromTrained) restoreTrainer(trainer, saved, track);
  trainer.bestLap = null; // forget the old record, we wait for the first lap on this track
  const first = trainer.generation;
  while (trainer.bestLap === null && trainer.generation < first + MAX_GENERATIONS) {
    updateTrainer(trainer, track, STEP);
  }
  return trainer.bestLap === null ? `over ${MAX_GENERATIONS}` : trainer.bestLapGeneration - first + 1;
}
