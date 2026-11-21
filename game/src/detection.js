// Line of sight, vision cones, hiding and noise for Shadowtide. This file
// only answers questions ("can this guard see the mouse right now?"); the
// guard state machine in guards.js decides what to do with the answer.

import { FIELD_WIDTH, FIELD_HEIGHT } from './levels.js';

/** Distance between two points. */
export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Clamp an angle to the range [-PI, PI]. */
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when point (px, py) lies inside rect r. */
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/** True when segment (ax,ay)-(bx,by) crosses rect r (walls block sight). */
export function segmentHitsRect(ax, ay, bx, by, r) {
  if (pointInRect(ax, ay, r) || pointInRect(bx, by, r)) return true;
  const dx = bx - ax;
  const dy = by - ay;
  // Check each of the four edges for a crossing (Liang-Barsky style).
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const denom = dx * (ey2 - ey1) - dy * (ex2 - ex1);
    if (denom === 0) continue;
    const t = ((ex1 - ax) * (ey2 - ey1) - (ey1 - ay) * (ex2 - ex1)) / denom;
    const u = ((ex1 - ax) * dy - (ey1 - ay) * dx) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/** True when no wall stands between (ax,ay) and (bx,by). */
export function lineOfSight(ax, ay, bx, by, walls) {
  for (const wall of walls) {
    if (segmentHitsRect(ax, ay, bx, by, wall)) return false;
  }
  return true;
}

/** True when the mouse is tucked inside a reed bed or a shadow pool. */
export function isHidden(player, level) {
  for (const reed of level.reeds) {
    if (distance(player.x, player.y, reed.x, reed.y) <= reed.r) return true;
  }
  for (const shadow of level.shadows) {
    const nx = (player.x - shadow.x) / shadow.rx;
    const ny = (player.y - shadow.y) / shadow.ry;
    if (nx * nx + ny * ny <= 1) return true;
  }
  return false;
}

/**
 * How clearly a guard sees the player right now: 0 = not seen at all,
 * 1 = fully in the open inside the cone. Reeds and shadows hide the mouse
 * unless the guard is almost on top of it; walls always block the view.
 */
export function visibility(guard, player, level) {
  const d = distance(guard.x, guard.y, player.x, player.y);
  if (d > guard.coneRange) return 0;
  const angleToPlayer = Math.atan2(player.y - guard.y, player.x - guard.x);
  if (Math.abs(angleDifference(angleToPlayer, guard.facing)) > guard.coneHalfAngle) return 0;
  if (!lineOfSight(guard.x, guard.y, player.x, player.y, level.walls)) return 0;
  if (isHidden(player, level) && d > 46) return 0;
  // Closer and more centred in the cone means a clearer sighting.
  const centre = 1 - Math.abs(angleDifference(angleToPlayer, guard.facing)) / guard.coneHalfAngle;
  const near = 1 - d / guard.coneRange;
  return Math.min(1, 0.45 + 0.35 * centre + 0.2 * near);
}

/** How far the mouse's footsteps carry, by movement mode. */
export function noiseRadius(mode) {
  if (mode === 'sneak') return 0;
  if (mode === 'run') return 130;
  return 46;
}

/** True when a guard can hear the mouse running at its current distance. */
export function canHear(guard, player, mode) {
  if (mode !== 'run') return false;
  return distance(guard.x, guard.y, player.x, player.y) <= noiseRadius(mode);
}

/** Keep a point inside the playfield (with a small margin). */
export function clampToField(x, y, margin) {
  return {
    x: Math.max(margin, Math.min(FIELD_WIDTH - margin, x)),
    y: Math.max(margin, Math.min(FIELD_HEIGHT - margin, y)),
  };
}
