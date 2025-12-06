export type Vec2 = { x: number; y: number };

export type Direction = 'N' | 'E' | 'S' | 'W';

export type TileKind = 0 | 1 | 2 | 3; // 0=floor, 1=wall, 2=water, 3=grass

export type Tile = {
  id: number;
  tx: number;
  ty: number;
  kind: TileKind;
  walkable: boolean;
  cost: number;
};

export type Grid = {
  tileSize: number;
  cols: number;
  rows: number;
};

export type AnimState = 'idle' | 'walking' | 'running' | 'turning';

export type SpriteConfig = {
  id: string;
  sheetUri: string;
  frameW: number;
  frameH: number;
  scale?: number;
  baseFps?: number;
  anchor?: { ox: number; oy: number };
  animations: Record<AnimState, { 
    loop: boolean; 
    byDir: Partial<Record<Direction, number[]>> 
  }>;
};

export type Actor = {
  id: string;
  spriteId: string;
  tile: Vec2; // logical tile position
  pos: Vec2; // world pixels
  dir: Direction;
  state: AnimState;
  speedTilesPerSec: number;
  _vel?: Vec2; // internal velocity in px/sec
};

export type GameState = {
  grid: Grid;
  tiles: Tile[];
  camera: Vec2;
  zoom: number;
  viewport: { w: number; h: number };
  actors: Record<string, Actor>;
  localPlayerId: string | null;
  _effectTick: number;
};

export type PathNode = {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent?: PathNode;
};

export type MoveCmd = {
  target: Vec2;
  allowDiagonal: boolean;
};

export type SteeringParams = {
  maxSpeed: number; // px/sec
  maxAccel: number; // px/sec^2
  arriveRadius: number; // px
  stopRadius: number; // px
  friction: number; // 0..1 per second
};

export type SteeringResult = {
  vel: Vec2;
  arrived: boolean;
};