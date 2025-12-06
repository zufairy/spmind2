import { GridConfig, PathNode, Tile, Vec2 } from '../types/gameEngine';

const key = (x: number, y: number) => `${x},${y}`;

export function aStar(
  grid: GridConfig,
  tiles: Tile[],
  start: Vec2,
  goal: Vec2,
  allowDiagonal: boolean = false,
): Vec2[] {
  const cols = grid.cols;
  const rows = grid.rows;

  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows;
  const idx = (x: number, y: number) => y * cols + x;

  const h = (x: number, y: number) => {
    const dx = Math.abs(x - goal.x);
    const dy = Math.abs(y - goal.y);
    return allowDiagonal ? Math.max(dx, dy) : dx + dy;
  };

  const neighbors = (x: number, y: number): [number, number, number][] => {
    const result: [number, number, number][] = [];
    const base = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const diags = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (const [dx, dy] of base) result.push([x + dx, y + dy, 10]);
    if (allowDiagonal) {
      for (const [dx, dy] of diags) result.push([x + dx, y + dy, 14]); // ~√2*10
    }
    return result.filter(([nx, ny]) => inBounds(nx, ny) && tiles[idx(nx, ny)].walkable);
  };

  const open = new Map<string, PathNode>();
  const closed = new Set<string>();

  const startNode: PathNode = { x: start.x, y: start.y, g: 0, h: h(start.x, start.y), f: 0 };
  startNode.f = startNode.g + startNode.h;
  open.set(key(start.x, start.y), startNode);

  while (open.size) {
    // get lowest f
    let current: PathNode | null = null;
    for (const n of open.values()) {
      if (!current || n.f < (current as PathNode).f) current = n;
    }
    if (!current) break;

    if (current.x === goal.x && current.y === goal.y) {
      const path: Vec2[] = [];
      let c: PathNode | undefined = current;
      while (c) {
        path.push({ x: c.x, y: c.y });
        c = c.parent;
      }
      path.reverse();
      return path;
    }

    open.delete(key(current.x, current.y));
    closed.add(key(current.x, current.y));

    for (const [nx, ny, stepCost] of neighbors(current.x, current.y)) {
      const k = key(nx, ny);
      if (closed.has(k)) continue;
      const tileCost = Math.max(1, Math.round(tiles[idx(nx, ny)].cost * 10));
      const tentativeG = current.g + stepCost + tileCost - 10;
      const existing = open.get(k);
      if (!existing || tentativeG < existing.g) {
        const node: PathNode = {
          x: nx,
          y: ny,
          g: tentativeG,
          h: h(nx, ny),
          f: tentativeG + h(nx, ny),
          parent: current,
        };
        open.set(k, node);
      }
    }
  }

  return [];
}
