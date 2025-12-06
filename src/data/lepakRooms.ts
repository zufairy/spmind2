import { Tile, GridConfig } from '../types/gameEngine';

export const lepakGrid: GridConfig = {
  cols: 85,
  rows: 85,
  tileSize: 24,
  isIsometric: false
};

export const createLepakTiles = (roomType: 'park' | 'cafe' | 'arcade'): Tile[] => {
  const tiles: Tile[] = [];
  let id = 1;
  
  for (let y = 0; y < lepakGrid.rows; y++) {
    for (let x = 0; x < lepakGrid.cols; x++) {
      let type: Tile['type'] = 'floor';
      let walkable = true;
      let cost = 1;
      let effect: Tile['effect'] = undefined;
      
      if (roomType === 'cafe') {
        // Cafe has walls around the perimeter
        if (x === 0 || x === lepakGrid.cols - 1 || y === 0 || y === lepakGrid.rows - 1) {
          type = 'wall';
          walkable = false;
        }
      } else if (roomType === 'park') {
        // Park has some grass tiles
        if (Math.random() < 0.3) {
          type = 'grass';
          cost = 1.5;
          effect = 'footstep';
        }
      } else if (roomType === 'arcade') {
        // Arcade has some water tiles
        if (Math.random() < 0.1) {
          type = 'water';
          walkable = false;
          effect = 'splash';
        }
      }
      
      tiles.push({
        id: id++,
        tx: x,
        ty: y,
        type,
        walkable,
        cost,
        effect
      });
    }
  }
  
  return tiles;
};
