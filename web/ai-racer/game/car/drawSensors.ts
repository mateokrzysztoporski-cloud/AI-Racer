// Draws the sensor lines: green = wall far away, red = wall close.

import type { Car } from "./car";
import type { Sensor } from "./sensors";

export function drawSensors(ctx: CanvasRenderingContext2D, car: Car, sensors: Sensor[]) {
  ctx.save();
  ctx.lineWidth = 1.5;

  for (const sensor of sensors) {
    const color = `hsl(${Math.round(sensor.distance * 120)}, 90%, 55%)`;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(car.position.x, car.position.y);
    ctx.lineTo(sensor.end.x, sensor.end.y);
    ctx.stroke();

    // dot where the line hits a wall
    if (sensor.distance < 1) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sensor.end.x, sensor.end.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
