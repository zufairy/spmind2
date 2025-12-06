export type Vec2 = { x: number; y: number };

export type Direction =
  | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type AnimState =
  | 'idle'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'sitting'
  | 'dancing'
  | 'waving';

export type Tile = {
  id: number;
  tx: number; // tile x
  ty: number; // tile y
  type: 'floor' | 'water' | 'grass' | 'wall' | 'portal' | 'object';
  walkable: boolean;
  cost: number; // base movement cost (1 = normal)
  effect?: 'splash' | 'footstep' | 'sparkle';
};

export type GridConfig = {
  cols: number; // 85
  rows: number; // 85
  tileSize: number; // 24 px (world pixels per tile before zoom)
  isIsometric?: boolean; // set true for iso projection
};

export type SpriteConfig = {
  id: string;
  sheetUri: string; // local require or remote
  frameW: number; // 32 or 64
  frameH: number; // 48 or 64
  scale?: number; // visual scale multiplier
  fps?: number; // base fps (walking ~10)
  animations: Record<
    AnimState,
    {
      // directions mapping to frame index arrays
      byDir: Partial<Record<Direction, number[]>>;
      loop: boolean;
    }
  >;
  anchor?: { ox: number; oy: number }; // origin offset in px
};

export type Actor = {
  id: string;
  spriteId: string;
  tpos: Vec2; // tile coords
  ppos: Vec2; // pixel coords (derived)
  dir: Direction;
  state: AnimState;
  speedTilesPerSec: number; // walking speed
};

export type GameState = {
  grid: GridConfig;
  tiles: Tile[]; // length cols*rows
  zoom: number; // 1 = 1 world px ==> 1 screen px
  camera: Vec2; // top-left world px of viewport
  viewportPx: { w: number; h: number };
  actors: Record<string, Actor>;
  localPlayerId: string | null;
  effectsTick: number; // increments to trigger visual tile effects
};

export type PathNode = {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic to goal
  f: number; // g + h
  parent?: PathNode;
};

export type MovementCommand = {
  target: Vec2; // tile target
  allowDiagonal: boolean;
};

export type TimerHandle = number; // requestAnimationFrame id