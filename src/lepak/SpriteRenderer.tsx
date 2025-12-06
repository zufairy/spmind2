import React, { memo } from 'react';
import { View, Image, ImageStyle } from 'react-native';
import { Actor, SpriteConfig } from './types';

interface SpriteRendererProps {
  actor: Actor;
  cfg: SpriteConfig;
  zoom: number;
  frameIndex: number;
}

/**
 * Renders a single sprite frame using sheet cropping technique
 */
export const SpriteRenderer = memo<SpriteRendererProps>(function SpriteRenderer({
  actor,
  cfg,
  zoom,
  frameIndex
}) {
  const frameW = cfg.frameW * (cfg.scale ?? 1) * zoom;
  const frameH = cfg.frameH * (cfg.scale ?? 1) * zoom;
  
  // Calculate frame position in sprite sheet
  const directionMap = { N: 0, E: 1, S: 2, W: 3 };
  const rowIndex = directionMap[actor.dir];
  const colIndex = frameIndex;
  
  // Calculate sheet dimensions
  const sheetCols = 4; // 4 frames per direction
  const sheetRows = 4; // 4 directions
  const sheetW = sheetCols * cfg.frameW;
  const sheetH = sheetRows * cfg.frameH;
  
  // Calculate offset to show current frame
  const offsetX = -colIndex * cfg.frameW;
  const offsetY = -rowIndex * cfg.frameH;
  
  // Calculate anchor offset
  const anchorX = (cfg.anchor?.ox ?? cfg.frameW / 2) * (cfg.scale ?? 1) * zoom;
  const anchorY = (cfg.anchor?.oy ?? cfg.frameH) * (cfg.scale ?? 1) * zoom;
  
  const containerStyle: ImageStyle = {
    position: 'absolute',
    left: actor.pos.x - anchorX,
    top: actor.pos.y - anchorY,
    width: frameW,
    height: frameH,
    overflow: 'hidden'
  };
  
  const imageStyle: ImageStyle = {
    position: 'absolute',
    left: offsetX * (cfg.scale ?? 1) * zoom,
    top: offsetY * (cfg.scale ?? 1) * zoom,
    width: sheetW * (cfg.scale ?? 1) * zoom,
    height: sheetH * (cfg.scale ?? 1) * zoom
  };
  
  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: cfg.sheetUri }}
        style={imageStyle}
        resizeMode="cover"
      />
    </View>
  );
});
