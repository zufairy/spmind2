import React, { memo, useMemo } from 'react';
import { Image, ImageStyle } from 'react-native';
import { Actor, GameState, SpriteConfig } from '../types/gameEngine';

export type SpritePoolProps = {
  state: GameState;
  sprites: Record<string, SpriteConfig>;
};

const spriteKey = (a: Actor) => `${a.spriteId}:${a.id}`;

const SpriteNode = memo(function SpriteNode({ actor, cfg, zoom }: { actor: Actor; cfg: SpriteConfig; zoom: number }) {
  const w = cfg.frameW * (cfg.scale ?? 1) * zoom;
  const h = cfg.frameH * (cfg.scale ?? 1) * zoom;
  const style: ImageStyle = {
    position: 'absolute',
    left: actor.ppos.x - (cfg.anchor?.ox ?? w / 2),
    top: actor.ppos.y - (cfg.anchor?.oy ?? h), // anchor at feet
    width: w,
    height: h,
    transform: [{ translateX: 0 }, { translateY: 0 }],
  };
  return <Image source={{ uri: cfg.sheetUri }} style={style} resizeMode="contain" />;
});

export const SpritePool = memo(function SpritePool({ state, sprites }: SpritePoolProps) {
  // Batch render visible actors only
  const visibleActors = useMemo(() => {
    const { camera, viewportPx } = state;
    const pad = 64; // cull padding
    return Object.values(state.actors).filter((a) =>
      a.ppos.x > camera.x - pad && a.ppos.x < camera.x + viewportPx.w + pad &&
      a.ppos.y > camera.y - pad && a.ppos.y < camera.y + viewportPx.h + pad,
    );
  }, [state.actors, state.camera, state.viewportPx]);

  return (
    <>
      {visibleActors.map((a) => (
        <SpriteNode key={spriteKey(a)} actor={a} cfg={sprites[a.spriteId]} zoom={state.zoom} />
      ))}
    </>
  );
});
