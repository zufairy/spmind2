import { Vec2, SteeringParams, SteeringResult } from './types';
import { add, len, mul, norm, sub } from './math';

/**
 * Kinematic steering behavior with arrival slowing
 */
export function steerTowards(
  pos: Vec2,
  vel: Vec2,
  target: Vec2,
  dt: number,
  params: SteeringParams
): SteeringResult {
  const to = sub(target, pos);
  const dist = len(to);
  
  // Check if we've arrived
  if (dist <= params.stopRadius) {
    return { vel: { x: 0, y: 0 }, arrived: true };
  }
  
  // Calculate desired velocity
  const desiredDir = norm(to);
  const desiredSpeed = dist < params.arriveRadius 
    ? params.maxSpeed * (dist / params.arriveRadius) 
    : params.maxSpeed;
  const desiredVel = mul(desiredDir, desiredSpeed);
  
  // Calculate acceleration (steering force)
  const accel = sub(desiredVel, vel);
  const accelLen = len(accel);
  const maxAccel = params.maxAccel * dt;
  
  // Clamp acceleration
  const clampedAccel = accelLen > maxAccel 
    ? mul(norm(accel), maxAccel)
    : accel;
  
  // Apply acceleration to velocity
  let newVel = add(vel, clampedAccel);
  
  // Apply friction/damping
  const friction = Math.max(0, 1 - params.friction * dt);
  newVel = mul(newVel, friction);
  
  // Clamp final speed
  const speed = len(newVel);
  if (speed > params.maxSpeed) {
    newVel = mul(norm(newVel), params.maxSpeed);
  }
  
  return { vel: newVel, arrived: false };
}