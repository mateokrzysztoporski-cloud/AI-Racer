// Draws one car from above, in its own color.

import { CAR_LENGTH, CAR_WIDTH, type Car } from "./car";

export function drawCar(ctx: CanvasRenderingContext2D, car: Car, highlighted = false) {
  const halfLength = CAR_LENGTH / 2;
  const halfWidth = CAR_WIDTH / 2;

  ctx.save();
  ctx.translate(car.position.x, car.position.y);
  ctx.rotate(car.angle); // +x = front of the car
  ctx.globalAlpha = car.crashed ? 0.4 : 1; // crashed cars are see-through

  // wheels
  ctx.fillStyle = "#111111";
  for (const x of [-halfLength + 7, halfLength - 7]) {
    for (const y of [-halfWidth, halfWidth]) {
      ctx.fillRect(x - 4, y - 2, 8, 4);
    }
  }

  // body
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.roundRect(-halfLength, -halfWidth + 1, CAR_LENGTH, CAR_WIDTH - 2, 4);
  ctx.fill();

  // windshield, shows where the front is
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(2, -halfWidth + 3, 5, CAR_WIDTH - 6);
  // white outline for the car we are watching

  if (highlighted) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-halfLength - 3, -halfWidth - 3, CAR_LENGTH + 6, CAR_WIDTH + 6);
  }

  ctx.restore();
}
