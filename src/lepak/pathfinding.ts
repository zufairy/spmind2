import { Grid, PathNode, Tile, Vec2 } from './types';

const key = (x: number, y: number): string => `${x},${y}`;
const idx = (g: Grid, x: number, y: number): number => y * g.cols + x;

/**
 * A* pathfinding with 4-directional movement only
 */
export function aStar(
  grid: Grid, 
  tiles: Tile[], 
  start: Vec2, 
  goal: Vec2, 
  allowDiagonal: boolean = false
): Vec2[] {
  const cols = grid.cols;
  const rows = grid.rows;
  
  const inBounds = (x: number, y: number): boolean => 
    x >= 0 && y >= 0 && x < cols && y < rows;
  
  const isWalkable = (x: number, y: number): boolean => 
    inBounds(x, y) && tiles[idx(grid, x, y)].walkable;

  // Manhattan heuristic for 4-directional movement
  const heuristic = (x: number, y: number): number => {
    const dx = Math.abs(x - goal.x);
    const dy = Math.abs(y - goal.y);
    return allowDiagonal ? Math.max(dx, dy) : dx + dy;
  };

  // Get neighbors with corner-cut prevention
  const getNeighbors = (x: number, y: number): [number, number, number][] => {
    const neighbors: [number, number, number][] = [];
    
    // Cardinal directions (cost 10)
    const cardinals = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of cardinals) {
      const nx = x + dx;
      const ny = y + dy;
      if (isWalkable(nx, ny)) {
        neighbors.push([nx, ny, 10]);
      }
    }
    
    // Diagonal movement disabled - 4-directional only
    
    return neighbors;
  };

  const open = new Map<string, PathNode>();
  const closed = new Set<string>();
  
  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start.x, start.y),
    f: 0
  };
  startNode.f = startNode.g + startNode.h;
  open.set(key(start.x, start.y), startNode);

  let iterations = 0;
  const maxIterations = 2000;

  while (open.size > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find node with lowest f-cost
    let current: PathNode | undefined;
    for (const node of open.values()) {
      if (!current || node.f < current.f) {
        current = node;
      }
    }
    
    if (!current) break;
    
    // Check if we reached the goal
    if (current.x === goal.x && current.y === goal.y) {
      const path: Vec2[] = [];
      let node: PathNode | undefined = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }
    
    // Move current from open to closed
    open.delete(key(current.x, current.y));
    closed.add(key(current.x, current.y));
    
    // Check neighbors
    for (const [nx, ny, stepCost] of getNeighbors(current.x, current.y)) {
      const neighborKey = key(nx, ny);
      if (closed.has(neighborKey)) continue;
      
      const tileCost = Math.max(1, Math.round(tiles[idx(grid, nx, ny)].cost * 10));
      const gCost = current.g + stepCost + tileCost - 10; // normalize around 10
      
      const existing = open.get(neighborKey);
      if (!existing || gCost < existing.g) {
        const neighbor: PathNode = {
          x: nx,
          y: ny,
          g: gCost,
          h: heuristic(nx, ny),
          f: gCost + heuristic(nx, ny),
          parent: current
        };
        open.set(neighborKey, neighbor);
      }
    }
  }
  
  return []; // No path found
}

/**
 * Bresenham line-of-sight check across tiles
 */
export function hasLineOfSight(grid: Grid, tiles: Tile[], a: Vec2, b: Vec2): boolean {
  let x0 = a.x;
  let y0 = a.y;
  let x1 = b.x;
  let y1 = b.y;
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    const tile = tiles[idx(grid, x0, y0)];
    if (!tile || !tile.walkable) return false;
    
    if (x0 === x1 && y0 === y1) return true;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Smooth path using line-of-sight string-pulling
 */
export function smoothPath(grid: Grid, tiles: Tile[], path: Vec2[]): Vec2[] {
  if (path.length <= 2) return path;
  
  const smoothed: Vec2[] = [];
  let i = 0;
  let j = 1;
  
  smoothed.push(path[0]);
  
  while (j < path.length) {
    // Extend segment as far as line-of-sight allows
    while (j + 1 < path.length && 
           hasLineOfSight(grid, tiles, path[i], path[j + 1])) {
      j++;
    }
    
    smoothed.push(path[j]);
    i = j;
    j = i + 1;
  }
  
  return smoothed;
}