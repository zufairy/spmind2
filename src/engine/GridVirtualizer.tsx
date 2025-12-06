import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { GameState } from '../types/gameEngine';

export const GridVirtualizer = memo(function GridVirtualizer({ state, renderTile }: { state: GameState; renderTile: (idx: number) => React.ReactNode }) {
  const { grid, camera, viewportPx } = state;
  const { cols, rows, tileSize } = grid;
  const startCol = Math.max(0, Math.floor(camera.x / tileSize) - 2);
  const startRow = Math.max(0, Math.floor(camera.y / tileSize) - 2);
  const endCol = Math.min(cols - 1, Math.ceil((camera.x + viewportPx.w) / tileSize) + 2);
  const endRow = Math.min(rows - 1, Math.ceil((camera.y + viewportPx.h) / tileSize) + 2);

  const indices = useMemo(() => {
    const list: number[] = [];
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) list.push(y * cols + x);
    }
    return list;
  }, [startRow, endRow, startCol, endCol, cols]);

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: cols * tileSize, height: rows * tileSize }}>
      {indices.map((i) => renderTile(i))}
    </View>
  );
});
