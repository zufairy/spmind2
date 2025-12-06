import { GameState, Actor, GridConfig, Tile, Vec2 } from '../types/gameEngine';
import { tileToWorldPx } from '../engine/Coordinate';

export type GameAction =
  | { type: 'INIT'; payload: { grid: GridConfig; tiles: Tile[]; actors: Actor[]; viewportPx: { w: number; h: number }; zoom?: number; localPlayerId: string } }
  | { type: 'SET_CAMERA'; payload: { camera: { x: number; y: number } } }
  | { type: 'SET_ZOOM'; payload: { zoom: number } }
  | { type: 'EFFECT_TICK' };

export function createInitialState(): GameState {
  return {
    grid: { cols: 1, rows: 1, tileSize: 24, isIsometric: false },
    tiles: [],
    zoom: 1,
    camera: { x: 0, y: 0 },
    viewportPx: { w: 320, h: 240 },
    actors: {},
    localPlayerId: null,
    effectsTick: 0,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT': {
      const { grid, tiles, actors, viewportPx, zoom = 1, localPlayerId } = action.payload;
      const actorsMap = Object.fromEntries(
        actors.map((a) => {
          const ppos = tileToWorldPx(grid, a.tpos);
          return [a.id, { ...a, ppos }];
        }),
      );
      return { ...state, grid, tiles, actors: actorsMap, viewportPx, zoom, localPlayerId };
    }
    case 'SET_CAMERA': {
      return { ...state, camera: action.payload.camera };
    }
    case 'SET_ZOOM': {
      return { ...state, zoom: action.payload.zoom };
    }
    case 'EFFECT_TICK': {
      return { ...state, effectsTick: state.effectsTick + 1 };
    }
    default:
      return state;
  }
}
