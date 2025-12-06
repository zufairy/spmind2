import { Tile, manhattanDistance, getNeighbors } from '../movement/grid';

interface AStarNode {
  tile: Tile;
  g: number; // cost from start
  h: number; // heuristic cost to goal
  f: number; // g + h
  parent?: AStarNode;
}

export function aStar(start: Tile, goal: Tile, grid: number[][]): Tile[] {
  if (!isValidTile(start) || !isValidTile(goal)) {
    return [];
  }

  if (grid[goal.ty][goal.tx] === 1) {
    return []; // goal is blocked
  }

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();
  
  const startNode: AStarNode = {
    tile: start,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal)
  };
  
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Find node with lowest f cost
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }

    const current = openSet.splice(currentIndex, 1)[0];
    const currentKey = `${current.tile.tx},${current.tile.ty}`;
    closedSet.add(currentKey);

    // Check if we reached the goal
    if (current.tile.tx === goal.tx && current.tile.ty === goal.ty) {
      return reconstructPath(current);
    }

    // Check all neighbors
    const neighbors = getNeighbors(current.tile);
    for (const neighborTile of neighbors) {
      const neighborKey = `${neighborTile.tx},${neighborTile.ty}`;
      
      if (closedSet.has(neighborKey)) continue;
      if (grid[neighborTile.ty][neighborTile.tx] === 1) continue; // blocked

      const tentativeG = current.g + 1; // each step costs 1

      // Check if this neighbor is already in open set
      const existingNode = openSet.find(node => 
        node.tile.tx === neighborTile.tx && node.tile.ty === neighborTile.ty
      );

      if (existingNode) {
        if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      } else {
        const neighborNode: AStarNode = {
          tile: neighborTile,
          g: tentativeG,
          h: manhattanDistance(neighborTile, goal),
          f: tentativeG + manhattanDistance(neighborTile, goal),
          parent: current
        };
        openSet.push(neighborNode);
      }
    }
  }

  return []; // no path found
}

function reconstructPath(node: AStarNode): Tile[] {
  const path: Tile[] = [];
  let current: AStarNode | undefined = node;
  
  while (current) {
    path.unshift(current.tile);
    current = current.parent;
  }
  
  return path;
}

function isValidTile(t: Tile): boolean {
  return t.tx >= 0 && t.tx < 85 && t.ty >= 0 && t.ty < 85;
}
