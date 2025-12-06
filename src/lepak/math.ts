import { Vec2, Direction } from './types';

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
export const len = (v: Vec2): number => Math.hypot(v.x, v.y);
export const norm = (v: Vec2): Vec2 => {
  const l = len(v);
  return l > 0 ? { x: v.x / l, y: v.y / l } : { x: 0, y: 0 };
};
export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export const angleOf = (v: Vec2): number => Math.atan2(v.y, v.x);

/**
 * Maps velocity to 4-directional facing with hysteresis to prevent jitter
 * @param vel Current velocity vector
 * @param prevDir Previous direction for hysteresis
 * @param hysteresisDeg Degrees of hysteresis (default 15)
 * @returns One of N/E/S/W
 */
export function facing4WithHysteresis(
  vel: Vec2, 
  prevDir: Direction, 
  hysteresisDeg: number = 15
): Direction {
  const speed = len(vel);
  if (speed < 0.1) return prevDir; // Don't change direction when nearly stopped

  const deg = Math.atan2(vel.y, vel.x) * 180 / Math.PI; // -180 to 180
  
  // Define sector boundaries
  const sectors = [
    { dir: 'E' as Direction, start: -45, end: 45 },
    { dir: 'S' as Direction, start: 45, end: 135 },
    { dir: 'W' as Direction, start: 135, end: 180 },
    { dir: 'W' as Direction, start: -180, end: -135 },
    { dir: 'N' as Direction, start: -135, end: -45 }
  ];

  // Check if current direction is still valid within hysteresis
  const currentSector = sectors.find(s => s.dir === prevDir);
  if (currentSector) {
    const inRange = (deg >= currentSector.start && deg <= currentSector.end) ||
                   (currentSector.start > currentSector.end && (deg >= currentSector.start || deg <= currentSector.end));
    
    if (inRange) {
      // Check if we're within hysteresis zone
      const hysteresis = hysteresisDeg;
      const expandedStart = currentSector.start - hysteresis;
      const expandedEnd = currentSector.end + hysteresis;
      
      const inHysteresis = (deg >= expandedStart && deg <= expandedEnd) ||
                          (expandedStart > expandedEnd && (deg >= expandedStart || deg <= expandedEnd));
      
      if (inHysteresis) return prevDir;
    }
  }

  // Find new direction
  for (const sector of sectors) {
    if (deg >= sector.start && deg <= sector.end) {
      return sector.dir;
    }
  }

  return 'S'; // fallback
}

/**
 * Alternative axis-dominant facing (simpler but less smooth)
 * @param vel Velocity vector
 * @param epsilon Threshold for axis dominance
 * @returns Direction based on dominant axis
 */
export function facing4AxisDominant(vel: Vec2, epsilon: number = 0.1): Direction {
  if (Math.abs(vel.x) - Math.abs(vel.y) > epsilon) {
    return vel.x > 0 ? 'E' : 'W';
  } else if (Math.abs(vel.y) - Math.abs(vel.x) > epsilon) {
    return vel.y > 0 ? 'S' : 'N';
  }
  return 'S'; // fallback
}