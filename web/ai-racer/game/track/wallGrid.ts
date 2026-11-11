// Wall grid: splits the world into squares, so a car only checks the walls near it.

import type { Point, Segment } from "./track";

export type WallGrid = {
  cellSize: number;
  columns: number;
  rows: number;
  cells: Segment[][]; // the walls in each square, row by row
};

// Settings

const CELL_SIZE = 50; // size of one square in pixels

// Building the grid

export function buildWallGrid(walls: Segment[], width: number, height: number): WallGrid {
  const columns = Math.ceil(width / CELL_SIZE);
  const rows = Math.ceil(height / CELL_SIZE);
  const cells: Segment[][] = Array.from({ length: columns * rows }, () => []);
  const grid = { cellSize: CELL_SIZE, columns, rows, cells };

  // put every wall in each square it touches (walls are short, usually 1 or 2 squares)
  for (const wall of walls) {
    const box = squaresAround(
      grid,
      Math.min(wall.a.x, wall.b.x),
      Math.min(wall.a.y, wall.b.y),
      Math.max(wall.a.x, wall.b.x),
      Math.max(wall.a.y, wall.b.y),
    );
    for (let row = box.firstRow; row <= box.lastRow; row++) {
      for (let column = box.firstColumn; column <= box.lastColumn; column++) {
        cells[row * columns + column].push(wall);
      }
    }
  }

  return grid;
}

// Using the grid

// all walls in the squares within `radius` pixels of the point
export function wallsNear(grid: WallGrid, point: Point, radius: number): Segment[] {
  const box = squaresAround(
    grid,
    point.x - radius,
    point.y - radius,
    point.x + radius,
    point.y + radius,
  );
  const found: Segment[] = [];
  for (let row = box.firstRow; row <= box.lastRow; row++) {
    for (let column = box.firstColumn; column <= box.lastColumn; column++) {
      found.push(...grid.cells[row * grid.columns + column]);
    }
  }
  return found;
}

// Helpers

// which squares a box covers, kept inside the world
function squaresAround(grid: WallGrid, left: number, top: number, right: number, bottom: number) {
  const inside = (value: number, max: number) => Math.min(Math.max(value, 0), max - 1);
  return {
    firstColumn: inside(Math.floor(left / grid.cellSize), grid.columns),
    lastColumn: inside(Math.floor(right / grid.cellSize), grid.columns),
    firstRow: inside(Math.floor(top / grid.cellSize), grid.rows),
    lastRow: inside(Math.floor(bottom / grid.cellSize), grid.rows),
  };
}
