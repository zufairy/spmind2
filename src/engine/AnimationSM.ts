import { Actor, AnimState, Direction, SpriteConfig } from '../types/gameEngine';

export type FrameCursor = { frameIndex: number; lastTime: number };

export class AnimationStateMachine {
  private cursors: Map<string, FrameCursor> = new Map();

  step(actor: Actor, cfg: SpriteConfig, now: number): number {
    const key = actor.id;
    const cursor = this.cursors.get(key) ?? { frameIndex: 0, lastTime: now };
    const def = cfg.animations[actor.state];
    const dirFrames = def.byDir[actor.dir] ?? def.byDir['S'];
    if (!dirFrames || dirFrames.length === 0) return 0;

    const fps = cfg.fps ?? 10;
    const frameDuration = 1000 / fps;

    if (now - cursor.lastTime >= frameDuration) {
      cursor.frameIndex = def.loop ? (cursor.frameIndex + 1) % dirFrames.length : Math.min(cursor.frameIndex + 1, dirFrames.length - 1);
      cursor.lastTime = now;
      this.cursors.set(key, cursor);
    }

    return dirFrames[cursor.frameIndex];
  }

  setState(actorId: string, _state: AnimState) {
    // Reset cursor on state change if desired (optional to implement)
    const c = this.cursors.get(actorId);
    if (c) c.frameIndex = 0;
  }
}
