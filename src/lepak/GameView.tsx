import React, { useEffect, useReducer, useRef } from 'react';
import { View, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { initialState, reducer } from './store';
import { GameState, SpriteConfig, Tile, Vec2, Grid } from './types';
import { GridVirtualizer } from './GridVirtualizer';
import { SpritePool } from './SpritePool';
import { MovementController } from './movement';
import { RafPool } from './timers';
import { AnimationSM } from './animSM';

export interface GameViewProps {
  tiles: Tile[];
  grid: Grid;
  sprites: Record<string, SpriteConfig>;
  actors: GameState['actors'][string][];
  viewport: { w: number; h: number };
  localPlayerId: string;
  onTilePress?: (tile: Vec2) => void;
  renderTile?: (index: number) => React.ReactNode;
}

/**
 * Main game view component with enhanced movement and animation
 */
export default function GameView({
  tiles,
  grid,
  sprites,
  actors,
  viewport,
  localPlayerId,
  onTilePress,
  renderTile
}: GameViewProps) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const movement = useRef(new MovementController()).current;
  const animationSM = useRef(new AnimationSM()).current;
  const raf = useRef(new RafPool()).current;
  const lastUpdateTime = useRef<number>(performance.now());
  const effectTickTime = useRef<number>(0);
  
  // Initialize game state
  useEffect(() => {
    dispatch({
      type: 'INIT',
      payload: {
        grid,
        tiles,
        actors,
        viewport,
        localPlayerId
      }
    });
    
    return () => {
      raf.clear();
      animationSM.clearAll();
    };
  }, [grid, tiles, actors, viewport, localPlayerId]);

  // Main game loop
  useEffect(() => {
    let running = true;
    
    const gameLoop = (now: number) => {
      if (!running) return;
      
      const deltaTime = (now - lastUpdateTime.current) / 1000;
      const cappedDt = Math.min(deltaTime, 0.05); // Cap at 50ms
      
      // Update movement system
      movement.update(state, now, cappedDt);
      
      // Update effect tick for VFX
      if (now - effectTickTime.current >= 250) {
        dispatch({ type: 'EFFECT_TICK' });
        effectTickTime.current = now;
      }
      
      lastUpdateTime.current = now;
      raf.add(gameLoop);
    };
    
    raf.add(gameLoop);
    
    return () => {
      running = false;
    };
  }, [state, movement]);

  // Camera pan handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e: GestureResponderEvent, gesture: PanResponderGestureState) => {
        const sensitivity = 0.5;
        dispatch({
          type: 'CAM',
          payload: {
            x: state.camera.x - gesture.dx * sensitivity,
            y: state.camera.y - gesture.dy * sensitivity
          }
        });
      }
    })
  ).current;

  // Handle tile press
  const handleTilePress = (tile: Vec2) => {
    if (onTilePress) {
      onTilePress(tile);
    } else {
      // Default behavior: move player to tile
      movement.issue(state, { target: tile, allowDiagonal: false }, localPlayerId);
    }
  };

  // Default tile renderer
  const defaultRenderTile = (index: number) => {
    const tile = state.tiles[index];
    if (!tile) return null;
    
    const { grid } = state;
    const x = tile.tx * grid.tileSize;
    const y = tile.ty * grid.tileSize;
    
    const backgroundColor = tile.kind === 1 ? '#333' : 
                          tile.kind === 2 ? '#48a6' : 
                          tile.kind === 3 ? '#2b4' : '#bbb';
    
    return (
      <View
        key={tile.id}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: grid.tileSize,
          height: grid.tileSize,
          backgroundColor,
          borderWidth: 0.5,
          borderColor: '#0003'
        }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => handleTilePress({ x: tile.tx, y: tile.ty })}
      />
    );
  };

  return (
    <View 
      {...panResponder.panHandlers}
      style={{ 
        width: viewport.w, 
        height: viewport.h, 
        backgroundColor: '#0b0b0b' 
      }}
    >
      <View 
        style={{ 
          position: 'absolute',
          left: -state.camera.x,
          top: -state.camera.y,
          transform: [{ scale: state.zoom }],
          width: state.grid.cols * state.grid.tileSize,
          height: state.grid.rows * state.grid.tileSize
        }}
      >
        <GridVirtualizer 
          state={state} 
          renderTile={renderTile || defaultRenderTile} 
        />
        <SpritePool 
          state={state} 
          sprites={sprites} 
          animationSM={animationSM} 
        />
      </View>
    </View>
  );
}
