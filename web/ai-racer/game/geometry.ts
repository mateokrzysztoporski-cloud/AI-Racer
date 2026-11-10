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