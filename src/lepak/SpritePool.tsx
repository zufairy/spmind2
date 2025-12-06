import React, { memo, useMemo } from 'react';
import { SpriteRenderer } from './SpriteRenderer';
import { GameState, SpriteConfig } from './types';
import { AnimationSM } from './animSM';

interface SpritePoolProps {
  state: GameState;
  sprites: Record<string, SpriteConfig>;
  animationSM: AnimationSM;
}

/**
 * Pooled sprite renderer - only renders visible actors
 */
export const SpritePool = memo<SpritePoolProps>(function SpritePool({ 
  state, 
  sprites, 
  animationSM 
}) {
  const { camera, viewport } = state;
  const padding = 64; // Render actors within 64px of viewport
  
  // Filter visible actors
  const visibleActors = useMemo(() => {
    return Object.values(state.actors).filter(actor => {
      const x = actor.pos.x;
      const y = actor.pos.y;
      return x > camera.x - padding && 
             x < camera.x + viewport.w + padding && 
             y > camera.y - padding && 
             y < camera.y + viewport.h + padding;
    });
  }, [state.actors, camera, viewport, padding]);
  
  return (
    <>
      {visibleActors.map(actor => {
        const spriteCfg = sprites[actor.spriteId];
        if (!spriteCfg) return null;
        
        // Calculate current speed for animation
        const speed = Math.hypot(actor._vel?.x || 0, actor._vel?.y || 0);
        const frameIndex = animationSM.step(performance.now(), actor, spriteCfg, speed);
        
        return (
          <SpriteRenderer
            key={actor.id}
            actor={actor}
            cfg={spriteCfg}
            zoom={state.zoom}
            frameIndex={frameIndex}
          />
        );
      })}
    </>
  );
});