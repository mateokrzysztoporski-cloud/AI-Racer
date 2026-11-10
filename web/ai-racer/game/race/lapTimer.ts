// Lap timer: current lap, last lap, best lap.
// All times in milliseconds

export type LapTimer = {
  lapStartedAt: number | null; 
  lastLap: number | null;
  bestLap: number | null;
};

export function createLapTimer(): LapTimer {
  return { lapStartedAt: null, lastLap: null, bestLap: null };
}

// call when the car crosses the start/finish line

export function crossStartLine(timer: LapTimer, now: number): LapTimer {
  if (timer.lapStartedAt === null) {
    return { ...timer, lapStartedAt: now };
  }
  const lap = now - timer.lapStartedAt;
  return {
    lapStartedAt: now,
    lastLap: lap,
    bestLap: timer.bestLap === null ? lap : Math.min(timer.bestLap, lap),
  };
}

// time of the lap that is running right now
export function currentLapTime(timer: LapTimer, now: number): number {
  return timer.lapStartedAt === null ? 0 : now - timer.lapStartedAt;
}

// ms -> "m:ss.mmm", e.g. 83456 -> "1:23.456"
export function formatTime(ms: number | null): string {
  if (ms === null) return "-:--.---";
  ms = Math.round(ms); // e.g. 15499.9999 -> 15500 (tiny errors from many small steps)
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}