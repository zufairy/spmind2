import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { View, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { createInitialState, gameReducer } from '../store/gameReducer';
import { GameState, SpriteConfig, Tile, Vec2 } from '../types/gameEngine';
import { GridVirtualizer } from '../engine/GridVirtualizer';
import { SpritePool } from '../engine/SpritePool';
import { TileEffectsLayer } from '../engine/TileEffects';
import { MovementController } from '../engine/Movement';
import { TimerManager } from '../engine/TimerManager';

export type GameViewProps = {
  initialTiles: Tile[];
  grid: GameState['grid'];
  sprites: Record<string, SpriteConfig>;
  actors: GameState['actors'][string][];
  viewportPx: { w: number; h: number };
  localPlayerId: string;
};

export default function GameView(props: GameViewProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const movement = useRef(new MovementController()).current;
  const timers = useRef(new TimerManager()).current;
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  // INIT
  useEffect(() => {
    dispatch({
      type: 'INIT',
      payload: {
        grid: props.grid,
        tiles: props.initialTiles,
        actors: props.actors,
        viewportPx: props.viewportPx,
        zoom: 1,
        localPlayerId: props.localPlayerId,
      },
    });
    return () => timers.clearAll();
  }, []);

  // rAF game loop
  useEffect(() => {
    let mounted = true;
    const loop = (now: number) => {
      if (!mounted) return;
      movement.update(stateRef.current, now);
      // lightweight state bump for effects every 250ms
      if (Math.floor(now / 250) !== Math.floor((stateRef.current as any)._lastEffectTick ?? 0)) {
        (stateRef.current as any)._lastEffectTick = Math.floor(now / 250);
        dispatch({ type: 'EFFECT_TICK' });
      }
      timers.add(loop);
    };
    timers.add(loop);
    return () => {
      mounted = false;
    };
  }, []);

  // Panning camera
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
        const c = stateRef.current.camera;
        dispatch({ type: 'SET_CAMERA', payload: { camera: { x: c.x - g.vx * 10, y: c.y - g.vy * 10 } } });
      },
    }),
  ).current;

  // Tap to move (tile-based)
  const onPressWorld = (p: Vec2) => {
    const playerId = stateRef.current.localPlayerId!;
    movement.issueMove(stateRef.current, { target: p, allowDiagonal: false }, playerId);
  };

  // Basic tile render (virtualized)
  const renderTile = (idx: number) => {
    const t = state.tiles[idx];
    const size = state.grid.tileSize;
    return (
      <View
        key={t.id}
        style={{
          position: 'absolute',
          left: t.tx * size,
          top: t.ty * size,
          width: size,
          height: size,
          backgroundColor:
            t.type === 'wall' ? '#333' : t.type === 'water' ? '#4aa3' : t.type === 'grass' ? '#3a3' : '#ccc',
          borderWidth: 0.5,
          borderColor: '#0003',
        }}
        // @ts-ignore - RN doesn't expose onStartShouldSetResponder types nicely
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => onPressWorld({ x: t.tx, y: t.ty })}
      />
    );
  };

  const worldStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: -state.camera.x,
    top: -state.camera.y,
    width: state.grid.cols * state.grid.tileSize,
    height: state.grid.rows * state.grid.tileSize,
    transform: [{ scale: state.zoom }],
  }), [state.camera, state.grid, state.zoom]);

  return (
    <View {...pan.panHandlers} style={{ width: state.viewportPx.w, height: state.viewportPx.h, backgroundColor: '#111' }}>
      <View style={worldStyle}>
        <GridVirtualizer state={state} renderTile={renderTile} />
        <TileEffectsLayer state={state} />
        <SpritePool state={state} sprites={props.sprites} />
      </View>
    </View>
  );
}
