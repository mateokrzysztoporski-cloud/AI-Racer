// Track: shape, walls, checkpoints and start position.

import { buildWallGrid, type WallGrid } from "./wallGrid";
// Types

export type Point = { x: number; y: number };

// line from a to b 
export type Segment = { a: Point; b: Point };

// where the car starts and which way it faces
export type StartPosition = { position: Point; angle: number };

export type Track = {
  center: Point[]; // middle of the road
  left: Point[]; // left edge
  right: Point[]; // right edge
  walls: Segment[]; // both edges 
  grid: WallGrid; // walls sorted into squares, for fast lookups
  checkpoints: Segment[]; // lines across the road in driving order,
  start: StartPosition; // car start spot behind the line
  width: number;
};

// Settings 

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;

const ROAD_WIDTH = 70;
const SMOOTHING_ROUNDS = 4; 
const CHECKPOINT_SPACING = 80; 
const START_BEHIND_LINE = 50; 

// Track structure 

const CONTROL_POINTS: Point[] = [
  { x: 1367, y: 840 }, // start/finish straight
  { x: 868, y: 840 },
  { x: 505, y: 837 },
  { x: 428, y: 804 }, // turn 1
  { x: 387, y: 719 },
  { x: 332, y: 635 }, 
  { x: 287, y: 495 },
  { x: 255, y: 369 },
  { x: 205, y: 256 },
  { x: 102, y: 178 },
  { x: 82, y: 163 }, // hairpin top
  { x: 66, y: 142 },
  { x: 60, y: 117 },
  { x: 64, y: 92 },
  { x: 78, y: 70 },
  { x: 100, y: 55 },
  { x: 125, y: 50 },
  { x: 150, y: 50 },
  { x: 1325, y: 50 }, // top straight
  { x: 1350, y: 50 }, // hairpin top right
  { x: 1370, y: 54 },
  { x: 1387, y: 65 },
  { x: 1398, y: 82 },
  { x: 1402, y: 102 },
  { x: 1398, y: 122 },
  { x: 1387, y: 139 },
  { x: 1370, y: 150 },
  { x: 1350, y: 154 },
  { x: 1325, y: 154 },
  { x: 1065, y: 154 },
  { x: 1040, y: 154 }, // left bend
  { x: 1010, y: 160 },
  { x: 985, y: 177 },
  { x: 968, y: 202 },
  { x: 962, y: 232 },
  { x: 968, y: 262 },
  { x: 985, y: 287 },
  { x: 1010, y: 304 },
  { x: 1040, y: 310 },
  { x: 1065, y: 310 }, // turn 4
  { x: 1086, y: 314 },
  { x: 1104, y: 326 },
  { x: 1116, y: 344 },
  { x: 1120, y: 365 },
  { x: 1116, y: 386 },
  { x: 1104, y: 404 },
  { x: 1086, y: 416 },
  { x: 1065, y: 420 },
  { x: 1040, y: 418 },
  { x: 950, y: 412 },
  { x: 845, y: 398 },
  { x: 709, y: 366 },
  { x: 573, y: 332 },
  { x: 450, y: 335 }, // loop in the middle
  { x: 414, y: 397 },
  { x: 432, y: 481 },
  { x: 469, y: 545 },
  { x: 550, y: 576 },
  { x: 664, y: 557 },
  { x: 800, y: 526 }, // crest
  { x: 959, y: 540 },
  { x: 1186, y: 579 },
  { x: 1413, y: 616 },
  { x: 1513, y: 646 }, // last corners
  { x: 1540, y: 705 },
  { x: 1533, y: 763 },
  { x: 1530, y: 787 },
  { x: 1523, y: 808 },
  { x: 1510, y: 825 },
  { x: 1491, y: 836 },
  { x: 1470, y: 840 },
  { x: 1445, y: 840 },
];

// Building the track 

export function buildTrack(): Track {
  const center = smoothLoop(CONTROL_POINTS, SMOOTHING_ROUNDS);
  const left = offsetLoop(center, ROAD_WIDTH / 2);
  const right = offsetLoop(center, -ROAD_WIDTH / 2);

  // checkpoint 
  const checkpoints: Segment[] = [];
  let travelled = CHECKPOINT_SPACING;
  for (let i = 0; i < center.length; i++) {
    if (i > 0) travelled += distance(center[i - 1], center[i]);
    if (travelled >= CHECKPOINT_SPACING) {
      checkpoints.push({ a: left[i], b: right[i] });
      travelled = 0;
    }
  }
  const walls = [...loopToSegments(left), ...loopToSegments(right)];
  return {
    center,
    left,
    right,
    walls,
    grid: buildWallGrid(walls, WORLD_WIDTH, WORLD_HEIGHT),
    checkpoints,
    start: findStart(center, START_BEHIND_LINE),
    width: ROAD_WIDTH,
  };
}

// go back from the start line 
function findStart(center: Point[], behind: number): StartPosition {
  let i = 0;
  let travelled = 0;
  while (travelled < behind) {
    const previous = (i - 1 + center.length) % center.length;
    travelled += distance(center[previous], center[i]);
    i = previous;
  }
  const ahead = center[(i + 1) % center.length];
  return {
    position: center[i],
    angle: Math.atan2(ahead.y - center[i].y, ahead.x - center[i].x),
  };
}

// Helpers 

// rounds the corners 
function smoothLoop(points: Point[], rounds: number): Point[] {
  let result = points;
  for (let round = 0; round < rounds; round++) {
    const next: Point[] = [];
    for (let i = 0; i < result.length; i++) {
      const a = result[i];
      const b = result[(i + 1) % result.length]; 
      next.push(between(a, b, 0.25), between(a, b, 0.75));
    }
    result = next;
  }
  return result;
}

// moves every point sideways across the road 
function offsetLoop(points: Point[], distance: number): Point[] {
  return points.map((point, i) => {
    const before = points[(i - 1 + points.length) % points.length];
    const after = points[(i + 1) % points.length];

    // road direction 
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy);

    // turned 90 degrees 
    const sideX = dy / length;
    const sideY = -dx / length;

    return { x: point.x + sideX * distance, y: point.y + sideY * distance };
  });
}

// points -> small lines between them
function loopToSegments(points: Point[]): Segment[] {
  return points.map((a, i) => ({ a, b: points[(i + 1) % points.length] }));
}

// point between a and b (t = 0 is a, t = 1 is b)
function between(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}