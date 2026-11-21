// The reef mouse: movement, sneaking and running, wall collision,
// hiding, moon-key pickup and the exit gate.

import { distance, pointInRect, isHidden, clampToField } from './detection.js';

export const PLAYER_RADIUS = 13;
const WALK_SPEED = 132;
const SNEAK_SPEED = 72;
const RUN_SPEED = 214;

/** Fresh player state at a level's start point. */
export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: -Math.PI / 2,
    mode: 'walk', // 'walk' | 'sneak' | 'run'
    moving: false,
    hidden: false,
    stepPhase: 0,
    clickTarget: null,
  };
}

/** Circle-vs-rectangle push-out; returns the corrected position. */
function collideCircleWalls(x, y, radius, walls) {
  for (const wall of walls) {
    const nearestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const nearestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    const d = Math.hypot(dx, dy);
    if (d < radius) {
      if (d === 0) {
        y = wall.y - radius;
      } else {
        x = nearestX + (dx / d) * radius;
        y = nearestY + (dy / d) * radius;
      }
    }
  }
  return { x, y };
}

/**
 * Move the player for `dt` seconds. `keys` is the live keyboard state
 * ({up,down,left,right,sneak,run}); a click target steers the mouse when
 * no arrow key is held. Returns nothing; the player object is mutated.
 */
export function updatePlayer(player, dt, level, keys) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;

  if (dx === 0 && dy === 0 && player.clickTarget) {
    const tx = player.clickTarget.x;
    const ty = player.clickTarget.y;
    const d = distance(player.x, player.y, tx, ty);
    if (d < 6) {
      player.clickTarget = null;
    } else {
      dx = (tx - player.x) / d;
      dy = (ty - player.y) / d;
    }
  }

  player.mode = keys.sneak ? 'sneak' : keys.run ? 'run' : 'walk';
  const speed = player.mode === 'sneak' ? SNEAK_SPEED : player.mode === 'run' ? RUN_SPEED : WALK_SPEED;
  const len = Math.hypot(dx, dy);
  player.moving = len > 0;
  if (player.moving) {
    dx /= len;
    dy /= len;
    player.facing = Math.atan2(dy, dx);
    let nx = player.x + dx * speed * dt;
    let ny = player.y + dy * speed * dt;
    const fixed = collideCircleWalls(nx, ny, PLAYER_RADIUS, level.walls);
    // A click target that keeps ramming a wall is abandoned.
    if (player.clickTarget && Math.hypot(fixed.x - player.x, fixed.y - player.y) < speed * dt * 0.25) {
      player.clickTarget = null;
    }
    nx = fixed.x;
    ny = fixed.y;
    const clamped = clampToField(nx, ny, PLAYER_RADIUS + 2);
    player.x = clamped.x;
    player.y = clamped.y;
    player.stepPhase += dt * (player.mode === 'run' ? 11 : player.mode === 'sneak' ? 5 : 8);
  }

  player.hidden = isHidden(player, level);
}

/** Pick up any moon key the mouse touches; returns the key or null. */
export function tryPickupKey(player, level) {
  for (const key of level.keys) {
    if (!key.taken && distance(player.x, player.y, key.x, key.y) <= PLAYER_RADIUS + 16) {
      key.taken = true;
      return key;
    }
  }
  return null;
}

/** How many moon keys the mouse holds in this level. */
export function keysHeld(level) {
  return level.keys.filter((k) => k.taken).length;
}

/** The exit opens once all three moon keys are held. */
export function exitOpen(level) {
  return keysHeld(level) >= level.keys.length;
}

/** True when the mouse stands on the exit gate while it is open. */
export function atExit(player, level) {
  return exitOpen(level) && pointInRect(player.x, player.y, level.exit);
}
