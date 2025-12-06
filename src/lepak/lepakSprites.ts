import { SpriteConfig } from './types';

export const hero_64: SpriteConfig = {
  id: 'hero_64',
  sheetUri: require('../../assets/images/sprite1.png'),
  frameW: 64,
  frameH: 64,
  scale: 1,
  baseFps: 10,
  anchor: { ox: 32, oy: 64 },
  animations: {
    idle: { 
      loop: true, 
      byDir: { 
        N: [0], E: [0], S: [0], W: [0] 
      } 
    },
    walking: { 
      loop: true, 
      byDir: { 
        N: [1, 2, 3, 0], 
        E: [5, 6, 7, 4], 
        S: [9, 10, 11, 8], 
        W: [13, 14, 15, 12] 
      } 
    },
    running: { 
      loop: true, 
      byDir: { 
        N: [1, 3, 2, 0], 
        E: [5, 7, 6, 4], 
        S: [9, 11, 10, 8], 
        W: [13, 15, 14, 12] 
      } 
    },
    turning: { 
      loop: false, 
      byDir: { 
        N: [0], E: [0], S: [0], W: [0] 
      } 
    }
  }
};

export const hero_32x48: SpriteConfig = {
  id: 'hero_32x48',
  sheetUri: require('../../assets/images/sprite2.png'),
  frameW: 32,
  frameH: 48,
  scale: 1,
  baseFps: 10,
  anchor: { ox: 16, oy: 48 },
  animations: {
    idle: { 
      loop: true, 
      byDir: { 
        N: [0], E: [0], S: [0], W: [0] 
      } 
    },
    walking: { 
      loop: true, 
      byDir: { 
        N: [1, 2, 3, 0], 
        E: [5, 6, 7, 4], 
        S: [9, 10, 11, 8], 
        W: [13, 14, 15, 12] 
      } 
    },
    running: { 
      loop: true, 
      byDir: { 
        N: [1, 3, 2, 0], 
        E: [5, 7, 6, 4], 
        S: [9, 11, 10, 8], 
        W: [13, 15, 14, 12] 
      } 
    },
    turning: { 
      loop: false, 
      byDir: { 
        N: [0], E: [0], S: [0], W: [0] 
      } 
    }
  }
};

// Export all sprites
export const lepakSprites = {
  hero_64,
  hero_32x48
};