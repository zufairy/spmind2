import { Actor, AnimState, Direction, SpriteConfig } from './types';

interface AnimationCursor {
  idx: number;
  t: number;
  state: AnimState;
  dir: Direction;
}

/**
 * Animation State Machine for sprite frame management
 */
export class AnimationSM {
  private cursors = new Map<string, AnimationCursor>();

  /**
   * Update animation and return current frame index
   */
  step(
    now: number, 
    actor: Actor, 
    spriteCfg: SpriteConfig, 
    speedPxPerSec: number
  ): number {
    const key = actor.id;
    const cursor = this.cursors.get(key) ?? {
      idx: 0,
      t: now,
      state: actor.state,
      dir: actor.dir
    };

    // Determine animation state based on speed
    const state: AnimState = speedPxPerSec < 10 
      ? 'idle' 
      : speedPxPerSec < spriteCfg.frameW * 4 
        ? 'walking' 
        : 'running';

    // Reset frame if state or direction changed
    if (state !== cursor.state || actor.dir !== cursor.dir) {
      cursor.idx = 0;
      cursor.t = now;
      cursor.state = state;
      cursor.dir = actor.dir;
    }

    const animDef = spriteCfg.animations[state];
    const frames = animDef.byDir[actor.dir] ?? animDef.byDir['S'] ?? [0];
    
    if (frames.length === 0) return 0;

    // Calculate frame rate based on state
    const baseFps = spriteCfg.baseFps ?? 10;
    const fps = state === 'running' 
      ? baseFps * 1.5 
      : state === 'walking' 
        ? baseFps 
        : baseFps * 0.5;
    
    const frameDuration = 1000 / fps;
    
    // Update frame if enough time has passed
    if (now - cursor.t >= frameDuration) {
      if (animDef.loop) {
        cursor.idx = (cursor.idx + 1) % frames.length;
      } else {
        cursor.idx = Math.min(cursor.idx + 1, frames.length - 1);
      }
      cursor.t = now;
    }

    // Store updated cursor
    this.cursors.set(key, cursor);
    
    return frames[cursor.idx] ?? 0;
  }

  /**
   * Clear animation state for an actor
   */
  clear(actorId: string): void {
    this.cursors.delete(actorId);
  }

  /**
   * Clear all animation states
   */
  clearAll(): void {
    this.cursors.clear();
  }
}