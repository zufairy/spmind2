// Grid / world constants
export const TILE_SIZE = 24;
export const WORLD_W = 85;
export const WORLD_H = 85;
export const WORLD_PX = { w: WORLD_W * TILE_SIZE, h: WORLD_H * TILE_SIZE };

// Quadrant definitions for image assets
export const QUADRANTS = {
  TOP_LEFT: { x: 0, y: 0, width: Math.floor(WORLD_W / 2), height: Math.floor(WORLD_H / 2) },
  TOP_RIGHT: { x: Math.floor(WORLD_W / 2), y: 0, width: Math.ceil(WORLD_W / 2), height: Math.floor(WORLD_H / 2) },
  BOTTOM_LEFT: { x: 0, y: Math.floor(WORLD_H / 2), width: Math.floor(WORLD_W / 2), height: Math.ceil(WORLD_H / 2) },
  BOTTOM_RIGHT: { x: Math.floor(WORLD_W / 2), y: Math.floor(WORLD_H / 2), width: Math.ceil(WORLD_W / 2), height: Math.ceil(WORLD_H / 2) }
};

// Sprite sheet / frames
export const SPRITE_COLS = 4;
export const SPRITE_ROWS = 4;
export const FRAME_W = 32; // or 64
export const FRAME_H = 48; // or 64

// Scaling to 60px visible height
export const VISIBLE_H = TILE_SIZE * 2.5; // 60
export const SCALE = VISIBLE_H / FRAME_H;
export const VISIBLE_W = Math.round(FRAME_W * SCALE);

// Movement & animation feel
export const WALK_SPEED = 120;           // px/s
export const ANIM_FPS = 10;              // walking frames cadence
export const END_TILE_PAUSE_MS = 120;    // show frame 2 at centers
export const ARRIVE_EPS = 1;             // px snap threshold

// Types
export type Tile = { tx: number; ty: number };
export type Vec2 = { x: number; y: number };

// Helper functions
export function tileCenterPx(t: Tile): Vec2 {
  return {
    x: t.tx * TILE_SIZE + TILE_SIZE / 2,
    y: t.ty * TILE_SIZE + TILE_SIZE / 2
  };
}

export function worldToTile(p: Vec2): Tile {
  return {
    tx: Math.floor(p.x / TILE_SIZE),
    ty: Math.floor(p.y / TILE_SIZE)
  };
}

export function dirFromDelta(dx: number, dy: number): "down"|"left"|"right"|"up" {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "down" : "up";
  }
}

export function rowFromDir(d: "down"|"left"|"right"|"up"): number {
  const dirMap = { down: 0, left: 1, right: 2, up: 3 };
  return dirMap[d];
}

export function isValidTile(t: Tile): boolean {
  return t.tx >= 0 && t.tx < WORLD_W && t.ty >= 0 && t.ty < WORLD_H;
}

export function getNeighbors(t: Tile): Tile[] {
  const neighbors = [
    { tx: t.tx, ty: t.ty - 1 }, // up
    { tx: t.tx + 1, ty: t.ty }, // right
    { tx: t.tx, ty: t.ty + 1 }, // down
    { tx: t.tx - 1, ty: t.ty }, // left
  ];
  return neighbors.filter(isValidTile);
}

export function manhattanDistance(a: Tile, b: Tile): number {
  return Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty);
}

// Quadrant helper functions
export function getQuadrantForTile(tile: Tile): keyof typeof QUADRANTS | null {
  const halfWidth = Math.floor(WORLD_W / 2);
  const halfHeight = Math.floor(WORLD_H / 2);
  
  if (tile.tx < halfWidth && tile.ty < halfHeight) {
    return 'TOP_LEFT';
  } else if (tile.tx >= halfWidth && tile.ty < halfHeight) {
    return 'TOP_RIGHT';
  } else if (tile.tx < halfWidth && tile.ty >= halfHeight) {
    return 'BOTTOM_LEFT';
  } else if (tile.tx >= halfWidth && tile.ty >= halfHeight) {
    return 'BOTTOM_RIGHT';
  }
  return null;
}

export function getQuadrantForPosition(pos: Vec2): keyof typeof QUADRANTS | null {
  const tile = worldToTile(pos);
  return getQuadrantForTile(tile);
}

export function getQuadrantBounds(quadrant: keyof typeof QUADRANTS) {
  return QUADRANTS[quadrant];
}

export function isPositionInQuadrant(pos: Vec2, quadrant: keyof typeof QUADRANTS): boolean {
  const bounds = QUADRANTS[quadrant];
  const tile = worldToTile(pos);
  return tile.tx >= bounds.x && tile.tx < bounds.x + bounds.width &&
         tile.ty >= bounds.y && tile.ty < bounds.y + bounds.height;
}
