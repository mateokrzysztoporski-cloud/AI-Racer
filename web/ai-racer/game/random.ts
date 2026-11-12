// Random: one source of random numbers for the AI, so a training run can be repeated exactly.

let next = Math.random; // normal play: different every time

// same seed = same random numbers = the same training run again
export function setSeed(seed: number) {
  let state = seed;
  // mulberry32: a small, well-known random number generator
  next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// a number from 0 up to 1 (never exactly 1), like Math.random()
export function random(): number {
  return next();
}
