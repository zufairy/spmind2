import { Grid, Tile, Actor } from './types';

export const lepakGrid: Grid = {
  tileSize: 24,
  cols: 85,
  rows: 85
};

export function createLepakTiles(roomType: 'park' | 'cafe' | 'arcade'): Tile[] {
  const tiles: Tile[] = [];
  let id = 1;

  for (let y = 0; y < lepakGrid.rows; y++) {
    for (let x = 0; x < lepakGrid.cols; x++) {
      let kind: 0 | 1 | 2 | 3 = 0; // Default to floor
      let walkable = true;
      let cost = 1;

      // Create different room layouts
      if (roomType === 'park') {
        // Park layout with grass and paths
        if (x < 3 || x > 26 || y < 3 || y > 21) {
          kind = 1; // walls
          walkable = false;
        } else if ((x + y) % 4 === 0) {
          kind = 3; // grass
          cost = 2;
        } else {
          kind = 0; // floor/path
        }
      } else if (roomType === 'cafe') {
        // Cafe layout with tables and counter
        if (x < 2 || x > 27 || y < 2 || y > 22) {
          kind = 1; // walls
          walkable = false;
        } else if ((x >= 8 && x <= 12 && y >= 8 && y <= 12) || 
                   (x >= 18 && x <= 22 && y >= 8 && y <= 12)) {
          kind = 1; // tables (non-walkable)
          walkable = false;
        } else if (x >= 14 && x <= 16 && y >= 2 && y <= 4) {
          kind = 1; // counter
          walkable = false;
        } else {
          kind = 0; // floor
        }
      } else if (roomType === 'arcade') {
        // Arcade layout with machines
        if (x < 2 || x > 27 || y < 2 || y > 22) {
          kind = 1; // walls
          walkable = false;
        } else if ((x % 4 === 0 && y % 3 === 0) && x > 2 && x < 27 && y > 2 && y < 22) {
          kind = 1; // arcade machines
          walkable = false;
        } else {
          kind = 0; // floor
        }
      }

      tiles.push({
        id: id++,
        tx: x,
        ty: y,
        kind,
        walkable,
        cost
      });
    }
  }

  return tiles;
}

export function createLepakActors(): Actor[] {
  return [
    {
      id: 'player',
      spriteId: 'hero_32x48',
      tile: { x: 2, y: 2 },
      pos: { x: 0, y: 0 }, // Will be set by tileToPx
      dir: 'S',
      state: 'idle',
      speedTilesPerSec: 8
    }
  ];
}