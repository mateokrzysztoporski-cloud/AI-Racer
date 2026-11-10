// Sensors, lines from the car that measure how far away the walls are.

import { crossingAt } from "@/game/geometry";
import type { Point, Track } from "@/game/track/track";
import { MAX_SPEED, type Car } from "./car";

export type Sensor = {
  end: Point; // where the line hits a wall, or its full length if it hits nothing
  distance: number; // 0 = wall right at the car, 1 = no wall in range
};

// Settings

const SENSOR_COUNT = 7; // number of lines, odd = one looks straight ahead
const SENSOR_SPREAD = 180; // degrees from the leftmost to the rightmost line
const SENSOR_RANGE = 300; // how far the car can see, in pixels

// directions of the lines in degrees, 0 = straight ahead, minus = left, plus = right
const SENSOR_DEGREES = Array.from({ length: SENSOR_COUNT }, (_, i) =>
  SENSOR_COUNT > 1 ? -SENSOR_SPREAD / 2 + (SENSOR_SPREAD * i) / (SENSOR_COUNT - 1) : 0,
);

// how many numbers the neural network gets: one per line + speed
export const INPUT_COUNT = SENSOR_COUNT + 1;

// names of the inputs, e.g. "L90", "ahead", "R30", "speed"
export const INPUT_NAMES = [
  ...SENSOR_DEGREES.map((degrees) => {
    const rounded = Math.round(Math.abs(degrees));
    if (rounded === 0) return "ahead";
    return `${degrees < 0 ? "L" : "R"}${rounded}`;
  }),
  "speed",
];

// Sensors

export function readSensors(car: Car, track: Track): Sensor[] {
  const start = car.position;

  // only walls close enough to be seen, the rest is skipped 
  const reach = SENSOR_RANGE + 20;
  const nearWalls = track.walls.filter(
    (wall) => Math.abs(wall.a.x - start.x) < reach && Math.abs(wall.a.y - start.y) < reach,
  );

  return SENSOR_DEGREES.map((degrees) => {
    const direction = car.angle + (degrees * Math.PI) / 180;
    const far = {
      x: start.x + Math.cos(direction) * SENSOR_RANGE,
      y: start.y + Math.sin(direction) * SENSOR_RANGE,
    };

    // closest wall along the line
    let closest = 1;
    for (const wall of nearWalls) {
      const hit = crossingAt(start, far, wall.a, wall.b);
      if (hit !== null && hit < closest) closest = hit;
    }

    return {
      end: {
        x: start.x + (far.x - start.x) * closest,
        y: start.y + (far.y - start.y) * closest,
      },
      distance: closest,
    };
  });
}

// what the neural network will get
export function sensorInputs(car: Car, sensors: Sensor[]): number[] {
  return [...sensors.map((sensor) => sensor.distance), car.speed / MAX_SPEED];
}