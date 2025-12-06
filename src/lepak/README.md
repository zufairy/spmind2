# Lepak Enhanced Movement System

A production-ready movement and animation system for React Native Expo games with A* pathfinding, kinematic steering, and optimized rendering.

## 🎯 Features

### **Pathfinding**
- **A* Algorithm**: Intelligent pathfinding with diagonal movement support
- **Corner-Cut Prevention**: Prevents walking through walls at corners
- **Path Smoothing**: Uses line-of-sight to create smoother, more natural paths
- **Performance**: Capped at 2000 iterations to prevent infinite loops

### **Movement**
- **Kinematic Steering**: Velocity-based movement with acceleration and friction
- **Arrival Behavior**: Natural slowing down when approaching targets
- **8-Directional Movement**: Full diagonal support while maintaining 4-directional sprite facing
- **Speed Control**: Configurable movement speeds in tiles per second

### **Animation**
- **State Machine**: Velocity-driven animation states (idle/walking/running)
- **Frame Timing**: Precise 10fps sprite animation with proper frame progression
- **Direction Hysteresis**: Prevents sprite flickering when changing directions
- **Sprite Support**: Works with different frame sizes (64x64, 32x48)

### **Performance**
- **Virtualized Rendering**: Only renders visible tiles and sprites
- **60fps Game Loop**: Smooth requestAnimationFrame-based updates
- **Memory Management**: Proper cleanup of timers and animations
- **Optimized Updates**: Delta-time based updates for consistent performance

## 🏗️ Architecture

### Core Modules

1. **`types.ts`** - TypeScript definitions for all game entities
2. **`coord.ts`** - Coordinate conversion utilities
3. **`math.ts`** - Mathematical helpers and direction mapping
4. **`pathfinding.ts`** - A* pathfinding with line-of-sight smoothing
5. **`steering.ts`** - Kinematic steering behaviors
6. **`animSM.ts`** - Animation state machine
7. **`timers.ts`** - RAF pool for memory management
8. **`movement.ts`** - Movement controller
9. **`store.ts`** - Redux-like state management
10. **`GameView.tsx`** - Main game component

### Rendering Components

- **`GridVirtualizer.tsx`** - Virtualized tile rendering
- **`SpriteRenderer.tsx`** - Individual sprite frame rendering
- **`SpritePool.tsx`** - Batched sprite rendering

## 🚀 Usage

### Basic Integration

```typescript
import GameView from './src/lepak/GameView';
import { lepakGrid, createLepakTiles, createLepakActors } from './src/lepak/lepakData';
import { lepakSprites } from './src/lepak/lepakSprites';

function MyGame() {
  const tiles = createLepakTiles('park');
  const actors = createLepakActors();
  
  return (
    <GameView
      tiles={tiles}
      grid={lepakGrid}
      sprites={lepakSprites}
      actors={actors}
      viewport={{ w: 400, h: 600 }}
      localPlayerId="player"
    />
  );
}
```

### Custom Tile Rendering

```typescript
<GameView
  // ... other props
  renderTile={(index) => (
    <MyCustomTileComponent 
      tile={tiles[index]} 
      onClick={() => handleTileClick(tile)} 
    />
  )}
/>
```

### Movement Control

```typescript
// Issue movement command
movement.issue(gameState, { 
  target: { x: 10, y: 15 }, 
  allowDiagonal: true 
}, 'player');

// Cancel movement
movement.cancel('player');

// Check if moving
const isMoving = movement.isMoving('player');
```

## 🎮 Sprite Configuration

### 64x64 Sprite (Sprite 1)
```typescript
const hero_64: SpriteConfig = {
  id: 'hero_64',
  sheetUri: require('../../assets/images/sprite1.png'),
  frameW: 64,
  frameH: 64,
  baseFps: 10,
  anchor: { ox: 32, oy: 64 },
  animations: {
    idle: { loop: true, byDir: { N: [0], E: [0], S: [0], W: [0] } },
    walking: { loop: true, byDir: { N: [1,2,3,0], E: [5,6,7,4], S: [9,10,11,8], W: [13,14,15,12] } },
    running: { loop: true, byDir: { N: [1,3,2,0], E: [5,7,6,4], S: [9,11,10,8], W: [13,15,14,12] } }
  }
};
```

### 32x48 Sprite (Sprites 2-9)
```typescript
const hero_32x48: SpriteConfig = {
  id: 'hero_32x48',
  sheetUri: require('../../assets/images/sprite2.png'),
  frameW: 32,
  frameH: 48,
  baseFps: 10,
  anchor: { ox: 16, oy: 48 },
  animations: {
    // Same structure as above
  }
};
```

## ⚙️ Configuration

### Movement Parameters
```typescript
const steeringParams: SteeringParams = {
  maxSpeed: 72, // 3 tiles/sec * 24px/tile
  maxAccel: 288, // 12 tiles/sec^2 * 24px/tile
  arriveRadius: 30, // 1.25 tiles * 24px/tile
  stopRadius: 2,
  friction: 2.0
};
```

### Animation Settings
```typescript
const animationConfig = {
  baseFps: 10, // Base animation speed
  runningMultiplier: 1.5, // Running is 1.5x faster
  idleMultiplier: 0.5 // Idle is 0.5x slower
};
```

## 🧪 Testing

Run the pathfinding tests:
```bash
npm test src/lepak/__tests__/pathfinding.test.ts
```

### Manual Testing Checklist

1. **Diagonal Movement**: Move diagonally and verify sprite facing is N/E/S/W
2. **Animation Sync**: Check walking animation stays in sync with movement
3. **Performance**: Long paths should run at 60fps without drops
4. **Memory**: No leaks after navigating away from GameView
5. **Pathfinding**: A* finds optimal paths around obstacles
6. **Zoom**: Animation works correctly at different zoom levels

## 🔧 Performance Tips

1. **Virtualization**: Only visible tiles and sprites are rendered
2. **Batching**: Sprites are rendered in batches for better performance
3. **Memory**: RAF pool ensures proper cleanup of animations
4. **Updates**: Delta-time based updates prevent frame drops

## 🐛 Troubleshooting

### Common Issues

1. **Sprite not moving**: Check if pathfinding found a valid path
2. **Animation desync**: Verify sprite configuration and frame timing
3. **Performance drops**: Check for memory leaks in RAF pool
4. **Direction flickering**: Adjust hysteresis parameters in `facing4WithHysteresis`

### Debug Mode

Enable debug logging:
```typescript
// In movement.ts
console.log(`Path found: ${path.length} waypoints`);
console.log(`Actor ${actorId} moving to (${target.x}, ${target.y})`);
```

## 📚 API Reference

### MovementController
- `issue(state, cmd, actorId)` - Issue movement command
- `cancel(actorId)` - Cancel movement
- `update(state, now, dt)` - Update all movements
- `isMoving(actorId)` - Check if actor is moving

### AnimationSM
- `step(now, actor, spriteCfg, speed)` - Update animation and return frame
- `clear(actorId)` - Clear animation for actor
- `clearAll()` - Clear all animations

### GameView Props
- `tiles` - Array of tile data
- `grid` - Grid configuration
- `sprites` - Sprite configurations
- `actors` - Array of actor data
- `viewport` - Viewport dimensions
- `localPlayerId` - ID of local player
- `onTilePress` - Custom tile press handler
- `renderTile` - Custom tile renderer

## 🎯 Key Design Decisions

1. **4-Direction Facing**: Sprites only face N/E/S/W for consistency
2. **Hysteresis**: Prevents direction flickering during diagonal movement
3. **Kinematic Steering**: More natural movement than grid-based
4. **Virtualization**: Only renders visible content for performance
5. **RAF Pool**: Centralized animation management prevents memory leaks

This system provides a solid foundation for tile-based games with smooth movement and animation while maintaining excellent performance on mobile devices.
