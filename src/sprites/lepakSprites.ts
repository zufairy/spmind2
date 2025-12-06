import { SpriteConfig } from '../types/gameEngine';

export const lepakSprites: Record<string, SpriteConfig> = {
  sprite1: {
    id: 'sprite1',
    sheetUri: require('../../assets/images/sprite1.png'),
    frameW: 64,
    frameH: 64,
    scale: 1.0,
    fps: 10,
    anchor: { ox: 32, oy: 48 },
    animations: {
      idle: {
        loop: true,
        byDir: {
          S: [0], SE: [0], E: [0], NE: [0], N: [0], NW: [0], W: [0], SW: [0]
        }
      },
      walking: {
        loop: true,
        byDir: {
          S: [1, 2, 3, 0],   // Down
          SE: [5, 6, 7, 4],  // Down-Right
          E: [9, 10, 11, 8], // Right
          NE: [13, 14, 15, 12], // Up-Right
          N: [17, 18, 19, 16],  // Up
          NW: [21, 22, 23, 20], // Up-Left
          W: [25, 26, 27, 24],  // Left
          SW: [29, 30, 31, 28]  // Down-Left
        }
      },
      running: { loop: true, byDir: {} },
      jumping: { loop: false, byDir: {} },
      sitting: { loop: true, byDir: {} },
      dancing: { loop: true, byDir: {} },
      waving: { loop: true, byDir: {} },
    }
  },
  sprite2: {
    id: 'sprite2',
    sheetUri: require('../../assets/images/sprite2.png'),
    frameW: 32,
    frameH: 48,
    scale: 1.2,
    fps: 10,
    anchor: { ox: 16, oy: 40 },
    animations: {
      idle: {
        loop: true,
        byDir: {
          S: [0], SE: [0], E: [0], NE: [0], N: [0], NW: [0], W: [0], SW: [0]
        }
      },
      walking: {
        loop: true,
        byDir: {
          S: [1, 2, 3, 0],   // Down
          SE: [5, 6, 7, 4],  // Down-Right
          E: [9, 10, 11, 8], // Right
          NE: [13, 14, 15, 12], // Up-Right
          N: [17, 18, 19, 16],  // Up
          NW: [21, 22, 23, 20], // Up-Left
          W: [25, 26, 27, 24],  // Left
          SW: [29, 30, 31, 28]  // Down-Left
        }
      },
      running: { loop: true, byDir: {} },
      jumping: { loop: false, byDir: {} },
      sitting: { loop: true, byDir: {} },
      dancing: { loop: true, byDir: {} },
      waving: { loop: true, byDir: {} },
    }
  },
  sprite3: {
    id: 'sprite3',
    sheetUri: require('../../assets/images/sprite3.png'),
    frameW: 32,
    frameH: 48,
    scale: 1.2,
    fps: 10,
    anchor: { ox: 16, oy: 40 },
    animations: {
      idle: {
        loop: true,
        byDir: {
          S: [0], SE: [0], E: [0], NE: [0], N: [0], NW: [0], W: [0], SW: [0]
        }
      },
      walking: {
        loop: true,
        byDir: {
          S: [1, 2, 3, 0],   // Down
          SE: [5, 6, 7, 4],  // Down-Right
          E: [9, 10, 11, 8], // Right
          NE: [13, 14, 15, 12], // Up-Right
          N: [17, 18, 19, 16],  // Up
          NW: [21, 22, 23, 20], // Up-Left
          W: [25, 26, 27, 24],  // Left
          SW: [29, 30, 31, 28]  // Down-Left
        }
      },
      running: { loop: true, byDir: {} },
      jumping: { loop: false, byDir: {} },
      sitting: { loop: true, byDir: {} },
      dancing: { loop: true, byDir: {} },
      waving: { loop: true, byDir: {} },
    }
  },
  // Add more sprites as needed...
};
