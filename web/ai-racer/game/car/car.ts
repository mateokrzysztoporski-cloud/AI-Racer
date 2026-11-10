// Car: data, physics, crashes and checkpoints. AI can use it too.

import { linesCross } from "@/game/geometry";
import { createLapTimer, crossStartLine, type LapTimer } from "@/game/race/lapTimer";
import type { Point, Segment, StartPosition, Track } from "@/game/track/track";
import type { Controls } from "./controls";

// Types

export type Car = {
  position: Point; // middle of the car
  angle: number; // radians, 0 = facing right
  speed: number; // pixels per second, minus = reversing
  color: string;
  crashed: boolean; // hit a wall
  time: number; // seconds since the car started
  nextCheckpoint: number; // which checkpoint has to be passed next
  checkpointsPassed: number; // how far it got
  timer: LapTimer;
};

// Settings (fast and twitchy)

export const CAR_LENGTH = 30;
export const CAR_WIDTH = 16;

const MAX_SPEED = 600; // pixels per second
const MAX_REVERSE = 150;
const ACCELERATION = 700; // speed gained per second
const BRAKING = 1400; // speed lost per second when braking
const ROLLING = 250; // speed lost per second with no gas
const TURN_RATE = 4; // radians per second at full steering
const FULL_GRIP_SPEED = 120; // below this speed steering is weaker

// Car

export function createCar(start: StartPosition): Car {
  return {
    position: { ...start.position },
    angle: start.angle,
    speed: 0,
    color: randomColor(),
    crashed: false,
    time: 0,
    nextCheckpoint: 0, // the start line, crossing it starts lap 1
    checkpointsPassed: 0,
    timer: createLapTimer(),
  };
}

// moves the car forward in time by dt seconds
export function updateCar(car: Car, controls: Controls, track: Track, dt: number) {
  if (car.crashed) return;
  car.time += dt;

  // keyboard gives -1, 0 or 1, the AI any number in between (0.5 = half)
  const gas = Math.min(Math.max(controls.gas, -1), 1);
  const steer = Math.min(Math.max(controls.steer, -1), 1);

  // gas, brake, reverse
  if (gas > 0) {
    car.speed += ACCELERATION * gas * dt;
  } else if (gas < 0) {
    car.speed += (car.speed > 0 ? BRAKING : ACCELERATION) * gas * dt;
  } else {
    car.speed = towardsZero(car.speed, ROLLING * dt);
  }
  car.speed = Math.min(Math.max(car.speed, -MAX_REVERSE), MAX_SPEED);

  // steering: none when standing, weak when slow, flipped when reversing
  const grip = Math.min(Math.abs(car.speed) / FULL_GRIP_SPEED, 1);
  car.angle += steer * TURN_RATE * grip * Math.sign(car.speed) * dt;

  // drive in the direction the car is facing
  const before = { ...car.position };
  car.position.x += Math.cos(car.angle) * car.speed * dt;
  car.position.y += Math.sin(car.angle) * car.speed * dt;

  // crash: stop for good
  if (hitsWall(car, track.walls)) {
    car.crashed = true;
    car.speed = 0;
    return;
  }

  // checkpoints, only the next one counts, so they have to be passed in order
  const checkpoint = track.checkpoints[car.nextCheckpoint];
  if (linesCross(before, car.position, checkpoint.a, checkpoint.b)) {
    if (car.nextCheckpoint === 0) {
      car.timer = crossStartLine(car.timer, car.time * 1000);
    }
    car.checkpointsPassed += 1;
    car.nextCheckpoint = (car.nextCheckpoint + 1) % track.checkpoints.length;
  }
}

// the 4 corners of the car, turned with the car
export function carCorners(car: Car): Point[] {
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const halfLength = CAR_LENGTH / 2;
  const halfWidth = CAR_WIDTH / 2;
  const corners = [
    [halfLength, halfWidth],
    [halfLength, -halfWidth],
    [-halfLength, -halfWidth],
    [-halfLength, halfWidth],
  ];
  return corners.map(([x, y]) => ({
    x: car.position.x + x * cos - y * sin,
    y: car.position.y + x * sin + y * cos,
  }));
}

// Helpers

// true if one of the car's 4 sides crosses a wall
function hitsWall(car: Car, walls: Segment[]): boolean {
  const corners = carCorners(car);
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    for (const wall of walls) {
      if (linesCross(a, b, wall.a, wall.b)) return true;
    }
  }
  return false;
}

// moves a number closer to 0 by amount, without going past 0
function towardsZero(value: number, amount: number): number {
  if (Math.abs(value) <= amount) return 0;
  return value - Math.sign(value) * amount;
}

// bright random color, different every time
function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 85%, 55%)`;
}