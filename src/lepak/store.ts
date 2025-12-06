import { Actor, GameState, Grid, Tile } from './types';
import { tileToPx } from './coord';

export type Action =
  | { type: 'INIT'; payload: { grid: Grid; tiles: Tile[]; actors: Actor[]; viewport: { w: number; h: number }; zoom?: number; localPlayerId: string } }
  | { type: 'CAM'; payload: { x: number; y: number } }
  | { type: 'ZOOM'; payload: { z: number } }
  | { type: 'EFFECT_TICK' };

export const initialState = (): GameState => ({
  grid: { tileSize: 24, cols: 1, rows: 1 },
  tiles: [],
  camera: { x: 0, y: 0 },
  zoom: 1,
  viewport: { w: 320, h: 240 },
  actors: {},
  localPlayerId: null,
  _effectTick: 0
});

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT': {
      const { grid, tiles, actors, viewport, zoom = 1, localPlayerId } = action.payload;
      
      // Convert tile positions to pixel positions
      const actorsWithPos = actors.map(actor => ({
        ...actor,
        pos: tileToPx(grid, actor.tile)
      }));
      
      const actorsMap = Object.fromEntries(
        actorsWithPos.map(actor => [actor.id, actor])
      );
      
      return {
        ...state,
        grid,
        tiles,
        actors: actorsMap,
        viewport,
        zoom,
        localPlayerId
      };
    }
    
    case 'CAM':
      return {
        ...state,
        camera: { x: action.payload.x, y: action.payload.y }
      };
    
    case 'ZOOM':
      return {
        ...state,
        zoom: action.payload.z
      };
    
    case 'EFFECT_TICK':
      return {
        ...state,
        _effectTick: state._effectTick + 1
      };
    
    default:
      return state;
  }
}