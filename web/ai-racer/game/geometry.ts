// Geometry: Used for crashes, checkpoints and later the AI's sensors.

import type { Point } from "@/game/track/track";

// true if line a-b crosses line c-d
export function linesCross(a: Point, b: Point, c: Point, d: Point): boolean {
  // a and b on different sides of c-d, and c and d on different sides of a-b
  return side(c, d, a) * side(c, d, b) < 0 && side(a, b, c) * side(a, b, d) < 0;
}

// which side of line a-b the point p is on: + one side, - the other, 0 on the line
function side(a: Point, b: Point, p: Point): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

// how far along line a-b it crosses line c-d: 0 = at a, 1 = at b, null = no crossing
export function crossingAt(a: Point, b: Point, c: Point, d: Point): number | null {
  const rx = b.x - a.x;
  const ry = b.y - a.y;
  const sx = d.x - c.x;
  const sy = d.y - c.y;
  const denominator = rx * sy - ry * sx;
  if (denominator === 0) return null; // parallel lines never cross
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / denominator; // along a-b
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / denominator; // along c-d
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}
