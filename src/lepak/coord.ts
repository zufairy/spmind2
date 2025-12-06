import { Grid, Vec2 } from './types';

export const tileToPx = (g: Grid, t: Vec2): Vec2 => ({
  x: t.x * g.tileSize,
  y: t.y * g.tileSize
});

export const pxToTile = (g: Grid, p: Vec2): Vec2 => ({
  x: Math.floor(p.x / g.tileSize),
  y: Math.floor(p.y / g.tileSize)
});

export const clampTile = (g: Grid, t: Vec2): Vec2 => ({
  x: Math.max(0, Math.min(g.cols - 1, t.x)),
  y: Math.max(0, Math.min(g.rows - 1, t.y))
});