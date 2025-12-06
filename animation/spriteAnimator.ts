import { ANIM_FPS, END_TILE_PAUSE_MS } from '../movement/grid';

export type PlayerState = 'idle' | 'walking' | 'endTile';

export interface Player {
  pos: { x: number; y: number };
  dir: "down" | "left" | "right" | "up";
  state: PlayerState;
  frame: number; // 0..3
  path: Array<{ tx: number; ty: number }>;
  animAccum: number; // seconds
  endTileTimer: number; // ms
}

export class SpriteAnimator {
  private frameDuration: number;

  constructor() {
    this.frameDuration = 1 / ANIM_FPS; // e.g., 0.1s for 10 FPS
  }

  update(dt: number, player: Player): void {
    // Update animation accumulator
    player.animAccum += dt;
    
    // Process frame changes at fixed cadence
    while (player.animAccum >= this.frameDuration) {
      player.animAccum -= this.frameDuration;
      this.updateFrame(player);
    }
  }

  private updateFrame(player: Player): void {
    if (player.state === "walking") {
      // Alternate between frames 1 and 3 while walking
      player.frame = (player.frame === 1) ? 3 : 1;
    } else if (player.state === "endTile") {
      // Show frame 2 at tile centers
      player.frame = 2;
    } else {
      // Idle - show frame 0
      player.frame = 0;
    }
  }

  // Handle end tile pause timing
  updateEndTileTimer(dt: number, player: Player): void {
    if (player.state === "endTile") {
      player.endTileTimer -= dt * 1000; // convert to ms
      if (player.endTileTimer <= 0) {
        player.endTileTimer = 0;
        player.state = "idle";
      }
    }
  }

  // Set end tile state with proper timing
  setEndTileState(player: Player): void {
    player.state = "endTile";
    player.endTileTimer = END_TILE_PAUSE_MS;
    player.frame = 2;
  }
}
