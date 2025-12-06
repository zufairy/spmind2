import { Actor, GameState, MoveCmd, Vec2, SteeringParams } from './types';
import { aStar, smoothPath } from './pathfinding';
import { steerTowards } from './steering';
import { facing4WithHysteresis } from './math';
import { tileToPx } from './coord';

interface MovementPath {
  waypoints: Vec2[];
  currentIndex: number;
}

/**
 * Movement Controller for kinematic movement with pathfinding
 */
export class MovementController {
  private paths = new Map<string, MovementPath>();

  /**
   * Issue a movement command to an actor
   */
  issue(state: GameState, cmd: MoveCmd, actorId: string): void {
    const actor = state.actors[actorId];
    if (!actor) {
      console.warn(`Actor ${actorId} not found`);
      return;
    }

    // Find path using A* (4-directional only)
    const path = aStar(state.grid, state.tiles, actor.tile, cmd.target, false);
    if (path.length === 0) {
      console.warn(`No path found from (${actor.tile.x}, ${actor.tile.y}) to (${cmd.target.x}, ${cmd.target.y})`);
      return;
    }

    // Smooth the path
    const smoothedPath = smoothPath(state.grid, state.tiles, path);
    
    // Store path starting from second waypoint (first is current position)
    this.paths.set(actorId, {
      waypoints: smoothedPath.slice(1),
      currentIndex: 0
    });
  }

  /**
   * Cancel movement for an actor
   */
  cancel(actorId: string): void {
    this.paths.delete(actorId);
  }

  /**
   * Update all active movements
   */
  update(state: GameState, now: number, dt: number): void {
    // Cap delta time to prevent large jumps
    const cappedDt = Math.min(dt, 0.05);
    
    for (const [actorId, pathInfo] of [...this.paths]) {
      const actor = state.actors[actorId];
      if (!actor) {
        this.paths.delete(actorId);
        continue;
      }

      // Check if we have a current waypoint
      if (pathInfo.currentIndex >= pathInfo.waypoints.length) {
        // Path complete
        actor.state = 'idle';
        actor._vel = { x: 0, y: 0 };
        this.paths.delete(actorId);
        continue;
      }

      const currentWaypoint = pathInfo.waypoints[pathInfo.currentIndex];
      const targetPx = tileToPx(state.grid, currentWaypoint);
      
      // Steering parameters
      const params: SteeringParams = {
        maxSpeed: state.grid.tileSize * actor.speedTilesPerSec,
        maxAccel: state.grid.tileSize * 12, // 12 tiles/sec^2
        arriveRadius: state.grid.tileSize * 1.25,
        stopRadius: 2,
        friction: 2.0
      };

      // Apply steering
      const currentVel = actor._vel ?? { x: 0, y: 0 };
      const { vel: newVel, arrived } = steerTowards(actor.pos, currentVel, targetPx, cappedDt, params);
      
      // Update actor state
      actor._vel = newVel;
      actor.pos = {
        x: actor.pos.x + newVel.x * cappedDt,
        y: actor.pos.y + newVel.y * cappedDt
      };
      
      // Update facing with hysteresis
      actor.dir = facing4WithHysteresis(newVel, actor.dir, 15);
      
      // Update animation state based on speed
      const speed = Math.hypot(newVel.x, newVel.y);
      actor.state = speed > 5 ? 'walking' : 'idle';
      
      // Check if we've arrived at the current waypoint
      if (arrived) {
        // Snap to tile center
        actor.tile = currentWaypoint;
        actor.pos = targetPx;
        
        // Move to next waypoint
        pathInfo.currentIndex++;
        
        // Update path or remove if complete
        if (pathInfo.currentIndex >= pathInfo.waypoints.length) {
          this.paths.delete(actorId);
          actor.state = 'idle';
          actor._vel = { x: 0, y: 0 };
        } else {
          this.paths.set(actorId, pathInfo);
        }
      }
    }
  }

  /**
   * Check if an actor is moving
   */
  isMoving(actorId: string): boolean {
    return this.paths.has(actorId);
  }

  /**
   * Get current path for an actor
   */
  getPath(actorId: string): Vec2[] | null {
    const path = this.paths.get(actorId);
    return path ? path.waypoints : null;
  }
}