// Save brain: keeps the best trained brain in the browser and as a .json file, and loads it back.

import { countWeights } from "./brain";
import { historyToCsv, type GenerationStats } from "./stats";
import type { Trainer } from "./trainer";

// Types

// everything needed to continue a training later
export type SavedTraining = {
  layers: number[]; // the network shape, e.g. [8, 8, 6, 2]
  weights: number[]; // the best brain's weights
  generation: number; // the last finished generation
  bestLap: number | null; // fastest lap so far, in ms
  bestLapGeneration: number;
  history: GenerationStats[]; // one row per generation, for the chart
  savedAt: string; // date and time, e.g. "2026-11-10T21:30:00.000Z"
};

// Settings

const STORAGE_KEY = "ai-racer-training"; // name of the save in the browser
const DEMO_FILE = "/ai-racer-brain-gen-174.json"; // trained brain for visitors, in public/

// Saving

// what to save from the trainer (null = no best brain yet)
export function trainingToSave(trainer: Trainer): SavedTraining | null {
  if (!trainer.bestBrain) return null;
  return {
    layers: trainer.bestBrain.layers,
    weights: trainer.bestBrain.weights,
    generation: trainer.generation - 1,
    bestLap: trainer.bestLap,
    bestLapGeneration: trainer.bestLapGeneration,
    history: trainer.history,
    savedAt: new Date().toISOString(),
  };
}

// keeps it in this browser, so training survives closing the page
export function saveToBrowser(saved: SavedTraining) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // browser storage full or blocked: just don't save
  }
}

// downloads it as a .json file, e.g. to keep it in the repo's ai/ folder
export function downloadTraining(saved: SavedTraining) {
  downloadFile(`ai-racer-brain-gen-${saved.generation}.json`, JSON.stringify(saved, null, 2), "application/json");
}

// downloads the generation history as a .csv table (Excel / Google Sheets)
export function downloadHistoryCsv(history: GenerationStats[]) {
  downloadFile(`ai-racer-history-gen-${history.length}.csv`, historyToCsv(history), "text/csv");
}

// Loading

// the save from this browser, if there is one that fits these layers
export function loadFromBrowser(layers: number[]): SavedTraining | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? parseTraining(text, layers) : null;
  } catch {
    return null;
  }
}

// the trained brain that comes with the game, null if it can't be loaded
export async function loadDemoBrain(layers: number[]): Promise<SavedTraining | null> {
  try {
    const response = await fetch(DEMO_FILE);
    return response.ok ? parseTraining(await response.text(), layers) : null;
  } catch {
    return null; // offline: start from zero
  }
}

export function forgetBrowserSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to forget
  }
}

// opens a file picker, onLoad gets the training or null if the file doesn't fit
export function pickTrainingFile(layers: number[], onLoad: (saved: SavedTraining | null) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) onLoad(parseTraining(await file.text(), layers));
  };
  input.click();
}

// reads a saved training, only accepts one with the same network shape as now
export function parseTraining(text: string, layers: number[]): SavedTraining | null {
  try {
    const saved = JSON.parse(text) as SavedTraining;
    const sameLayers = Array.isArray(saved.layers) && saved.layers.join(",") === layers.join(",");
    const rightSize = Array.isArray(saved.weights) && saved.weights.length === countWeights(layers);
    if (!sameLayers || !rightSize) return null;
    return { ...saved, history: Array.isArray(saved.history) ? saved.history : [] };
  } catch {
    return null; // not a valid .json file
  }
}

// Helpers

// makes the browser download a text file
function downloadFile(fileName: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
