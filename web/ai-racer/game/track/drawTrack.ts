// Draws the track: grass, road, walls, checkpoints, start line and start box.

import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type Point,
  type Segment,
  type StartPosition,
  type Track,
} from "./track";

const SHOW_CHECKPOINTS = true; // false = hide the yellow lines

export function drawTrack(ctx: CanvasRenderingContext2D, track: Track) {
  // grass
  ctx.fillStyle = "#3f7d3a";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // road
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3b3b3b";
  ctx.lineWidth = track.width;
  drawLoop(ctx, track.center);

  // walls
  ctx.strokeStyle = "#f5f5f5";
  ctx.lineWidth = 3;
  drawLoop(ctx, track.left);
  drawLoop(ctx, track.right);

  // checkpoints
  if (SHOW_CHECKPOINTS) {
    ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const checkpoint of track.checkpoints.slice(1)) {
      drawSegment(ctx, checkpoint);
    }
    ctx.setLineDash([]);
  }

  // start/finish line
  const startLine = track.checkpoints[0];
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ffffff";
  drawSegment(ctx, startLine);
  ctx.strokeStyle = "#111111";
  ctx.setLineDash([10, 10]);
  drawSegment(ctx, startLine);
  ctx.setLineDash([]);

  drawStartBox(ctx, track.start);
}

// Start box

// where the car starts and which way it goes
function drawStartBox(ctx: CanvasRenderingContext2D, start: StartPosition) {
  ctx.save();
  ctx.translate(start.position.x, start.position.y);
  ctx.rotate(start.angle); //  +x = forward

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -14);
  ctx.lineTo(22, -14);
  ctx.lineTo(22, 14);
  ctx.lineTo(-22, 14);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-6, -7);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Helpers

// line through all points and back to the first
function drawLoop(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawSegment(ctx: CanvasRenderingContext2D, segment: Segment) {
  ctx.beginPath();
  ctx.moveTo(segment.a.x, segment.a.y);
  ctx.lineTo(segment.b.x, segment.b.y);
  ctx.stroke();
}
