import { aStar, hasLineOfSight, smoothPath } from '../pathfinding';
import { Grid, Tile } from '../types';

// Test grid setup
const testGrid: Grid = {
  tileSize: 24,
  cols: 5,
  rows: 5
};

const testTiles: Tile[] = [
  // Row 0: all walkable
  { id: 1, tx: 0, ty: 0, kind: 0, walkable: true, cost: 1 },
  { id: 2, tx: 1, ty: 0, kind: 0, walkable: true, cost: 1 },
  { id: 3, tx: 2, ty: 0, kind: 0, walkable: true, cost: 1 },
  { id: 4, tx: 3, ty: 0, kind: 0, walkable: true, cost: 1 },
  { id: 5, tx: 4, ty: 0, kind: 0, walkable: true, cost: 1 },
  
  // Row 1: with obstacle
  { id: 6, tx: 0, ty: 1, kind: 0, walkable: true, cost: 1 },
  { id: 7, tx: 1, ty: 1, kind: 1, walkable: false, cost: 1 },
  { id: 8, tx: 2, ty: 1, kind: 0, walkable: true, cost: 1 },
  { id: 9, tx: 3, ty: 1, kind: 0, walkable: true, cost: 1 },
  { id: 10, tx: 4, ty: 1, kind: 0, walkable: true, cost: 1 },
  
  // Row 2: all walkable
  { id: 11, tx: 0, ty: 2, kind: 0, walkable: true, cost: 1 },
  { id: 12, tx: 1, ty: 2, kind: 0, walkable: true, cost: 1 },
  { id: 13, tx: 2, ty: 2, kind: 0, walkable: true, cost: 1 },
  { id: 14, tx: 3, ty: 2, kind: 0, walkable: true, cost: 1 },
  { id: 15, tx: 4, ty: 2, kind: 0, walkable: true, cost: 1 },
  
  // Row 3: all walkable
  { id: 16, tx: 0, ty: 3, kind: 0, walkable: true, cost: 1 },
  { id: 17, tx: 1, ty: 3, kind: 0, walkable: true, cost: 1 },
  { id: 18, tx: 2, ty: 3, kind: 0, walkable: true, cost: 1 },
  { id: 19, tx: 3, ty: 3, kind: 0, walkable: true, cost: 1 },
  { id: 20, tx: 4, ty: 3, kind: 0, walkable: true, cost: 1 },
  
  // Row 4: all walkable
  { id: 21, tx: 0, ty: 4, kind: 0, walkable: true, cost: 1 },
  { id: 22, tx: 1, ty: 4, kind: 0, walkable: true, cost: 1 },
  { id: 23, tx: 2, ty: 4, kind: 0, walkable: true, cost: 1 },
  { id: 24, tx: 3, ty: 4, kind: 0, walkable: true, cost: 1 },
  { id: 25, tx: 4, ty: 4, kind: 0, walkable: true, cost: 1 }
];

describe('Pathfinding', () => {
  test('A* finds direct path', () => {
    const path = aStar(testGrid, testTiles, { x: 0, y: 0 }, { x: 2, y: 0 }, true);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 2, y: 0 });
  });

  test('A* avoids obstacles', () => {
    const path = aStar(testGrid, testTiles, { x: 0, y: 0 }, { x: 4, y: 0 }, true);
    expect(path.length).toBeGreaterThan(0);
    // Should not go through obstacle at (1,1)
    const hasObstacle = path.some(p => p.x === 1 && p.y === 1);
    expect(hasObstacle).toBe(false);
  });

  test('A* with diagonal movement', () => {
    const path = aStar(testGrid, testTiles, { x: 0, y: 0 }, { x: 2, y: 2 }, true);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });
  });

  test('A* without diagonal movement', () => {
    const path = aStar(testGrid, testTiles, { x: 0, y: 0 }, { x: 2, y: 2 }, false);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });
  });

  test('Line of sight works', () => {
    const hasLOS = hasLineOfSight(testGrid, testTiles, { x: 0, y: 0 }, { x: 4, y: 0 });
    expect(hasLOS).toBe(true);
  });

  test('Line of sight blocked by obstacle', () => {
    const hasLOS = hasLineOfSight(testGrid, testTiles, { x: 0, y: 0 }, { x: 4, y: 1 });
    expect(hasLOS).toBe(false);
  });

  test('Path smoothing reduces nodes', () => {
    const originalPath = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 }
    ];
    const smoothed = smoothPath(testGrid, testTiles, originalPath);
    expect(smoothed.length).toBeLessThanOrEqual(originalPath.length);
    expect(smoothed[0]).toEqual(originalPath[0]);
    expect(smoothed[smoothed.length - 1]).toEqual(originalPath[originalPath.length - 1]);
  });
});
