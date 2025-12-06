import { Actor, Direction, GameState, MovementCommand, Vec2 } from '../types/gameEngine';
import { aStar } from './Pathfinding';
import { dirFromDelta, tileToWorldPx } from './Coordinate';

export type ActiveMove = {
  actorId: string;
  path: Vec2[]; // tile nodes including start
  nextIndex: number; // index into path (next tile to step onto)
  stepStartTime: number; // ms
  stepDuration: number; // ms per tile (derived from speed)
  lastDir: Direction;
};

export class MovementController {
  private moves: Map<string, ActiveMove> = new Map();

  issueMove(state: GameState, cmd: MovementCommand, actorId: string) {
    const actor = state.actors[actorId];
    if (!actor) return;
    const path = aStar(state.grid, state.tiles, actor.tpos, cmd.target, false);
    if (path.length <= 1) return; // no move

    const stepDuration = 1000 / actor.speedTilesPerSec; // ms per tile
    const first = path[1];
    const dx = first.x - actor.tpos.x;
    const dy = first.y - actor.tpos.y;

    const move: ActiveMove = {
      actorId,
      path,
      nextIndex: 1,
      stepStartTime: performance.now(),
      stepDuration,
      lastDir: dirFromDelta(dx, dy),
    };
    this.moves.set(actorId, move);
    actor.state = 'walking';
    actor.dir = move.lastDir; // instant face towards next tile
  }

  cancel(actorId: string) {
    this.moves.delete(actorId);
  }

  update(state: GameState, now: number) {
    // called each rAF
    for (const move of [...this.moves.values()]) {
      const actor = state.actors[move.actorId];
      if (!actor) {
        this.moves.delete(move.actorId);
        continue;
      }
      const t = (now - move.stepStartTime) / move.stepDuration; // 0..1
      // Smoothstep interpolation with 8 micro-steps feel
      const s = t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

      const curTile = move.path[move.nextIndex - 1];
      const nxtTile = move.path[move.nextIndex];
      const dx = nxtTile.x - curTile.x;
      const dy = nxtTile.y - curTile.y;
      const dir = dirFromDelta(dx, dy);
      if (dir !== move.lastDir) {
        actor.dir = dir; // instant direction change (Habbo-like)
        move.lastDir = dir;
      }

      // interpolate in world pixels
      const curPx = tileToWorldPx(state.grid, curTile);
      const nxtPx = tileToWorldPx(state.grid, nxtTile);
      actor.ppos = { x: curPx.x + (nxtPx.x - curPx.x) * s, y: curPx.y + (nxtPx.y - curPx.y) * s };

      if (t >= 1) {
        // finalize step
        actor.tpos = { ...nxtTile };
        actor.ppos = { ...nxtPx };
        move.nextIndex++;
        move.stepStartTime = now;
        if (move.nextIndex >= move.path.length) {
          // arrived
          actor.state = 'idle';
          this.moves.delete(move.actorId);
        }
      }
    }
  }
}
