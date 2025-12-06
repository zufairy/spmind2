import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { GameState } from './types';

interface GridVirtualizerProps {
  state: GameState;
  renderTile: (index: number) => React.ReactNode;
}

/**
 * Virtualized grid renderer - only renders visible tiles
 */
export const GridVirtualizer = memo<GridVirtualizerProps>(function GridVirtualizer({ 
  state, 
  renderTile 
}) {
  const { grid, camera, viewport } = state;
  const { cols, rows, tileSize } = grid;
  
  // Calculate visible tile range with 2-tile padding
  const startCol = Math.max(0, Math.floor(camera.x / tileSize) - 2);
  const startRow = Math.max(0, Math.floor(camera.y / tileSize) - 2);
  const endCol = Math.min(cols - 1, Math.ceil((camera.x + viewport.w) / tileSize) + 2);
  const endRow = Math.min(rows - 1, Math.ceil((camera.y + viewport.h) / tileSize) + 2);
  
  // Generate list of visible tile indices
  const visibleIndices = useMemo(() => {
    const indices: number[] = [];
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        indices.push(y * cols + x);
      }
    }
    return indices;
  }, [startRow, endRow, startCol, endCol, cols]);
  
  return (
    <View style={{ 
      position: 'absolute', 
      left: 0, 
      top: 0, 
      width: cols * tileSize, 
      height: rows * tileSize 
    }}>
      {visibleIndices.map(index => (
        <React.Fragment key={index}>
          {renderTile(index)}
        </React.Fragment>
      ))}
    </View>
  );
});