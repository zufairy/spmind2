import React, { memo } from 'react';
import { View } from 'react-native';
import { GameState, Tile } from '../types/gameEngine';

export const TileEffectsLayer = memo(function TileEffectsLayer({ state }: { state: GameState }) {
  const { tiles, grid } = state;
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: grid.cols * grid.tileSize, height: grid.rows * grid.tileSize }}>
      {tiles.map((t) => {
        if (!t.effect) return null;
        const left = t.tx * grid.tileSize;
        const top = t.ty * grid.tileSize;
        return (
          <View key={t.id} style={{ position: 'absolute', left, top, width: grid.tileSize, height: grid.tileSize, opacity: 0.2 }} />
        );
      })}
    </View>
  );
});
