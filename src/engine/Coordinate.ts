import { GridConfig, Vec2 } from '../types/gameEngine';

export const tileToWorldPx = (grid: GridConfig, t: Vec2): Vec2 => {
  if (grid.isIsometric) {
    // Simple 2:1 isometric projection
    const tw = grid.tileSize;
    const th = grid.tileSize / 2;
    const x = (t.x - t.y) * tw;
    const y = (t.x + t.y) * th;
    return { x, y };
  }
  return { x: t.x * grid.tileSize, y: t.y * grid.tileSize };
};

export const worldPxToTile = (grid: GridConfig, p: Vec2): Vec2 => {
  if (grid.isIsometric) {
    const tw = grid.tileSize;
    const th = grid.tileSize / 2;
    const tx = Math.floor((p.x / tw + p.y / th) / 2);
    const ty = Math.floor((p.y / th - (p.x / tw)) / 2);
    return { x: tx, y: ty };
  }
  return { x: Math.floor(p.x / grid.tileSize), y: Math.floor(p.y / grid.tileSize) };
};

export const clampTile = (grid: GridConfig, t: Vec2): Vec2 => ({
  x: Math.max(0, Math.min(grid.cols - 1, t.x)),
  y: Math.max(0, Math.min(grid.rows - 1, t.y)),
});

export const dirFromDelta = (dx: number, dy: number): import('../types/gameEngine').Direction => {
  if (dx === 0 && dy < 0) return 'N';
  if (dx > 0 && dy < 0) return 'NE';
  if (dx > 0 && dy === 0) return 'E';
  if (dx > 0 && dy > 0) return 'SE';
  if (dx === 0 && dy > 0) return 'S';
  if (dx < 0 && dy > 0) return 'SW';
  if (dx < 0 && dy === 0) return 'W';
  return 'NW';
};
