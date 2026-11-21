// The lantern crabs: patrol, suspicion and the four-stage detection
// machine CALM -> SUSPICIOUS -> ALERT -> SEARCH -> CALM. A guard never
// teleports and never knows where the mouse is unless it saw or heard it;
// every stage gives the player a real chance to slip away and recover.

import { distance, angleDifference, visibility, canHear } from './detection.js';

export const GUARD_CALM = 'CALM';
export const GUARD_SUSPICIOUS = 'SUSPICIOUS';
export const GUARD_ALERT = 'ALERT';
export const GUARD_SEARCH = 'SEARCH';

/** How fast suspicion (0-100) rises while the mouse is clearly seen. */
const SEE_RATE = 62;
/** How fast suspicion rises while the guard only hears running feet. */
const HEAR_RATE = 26;
/** How fast suspicion fades while nothing is seen or heard. */
const CALM_RATE = 16;
/** Suspicion at which a guard goes from calm to suspicious ("?"). */
const SUSPICIOUS_AT = 55;
/** Seconds an ALERT guard keeps chasing after losing sight. */
const CHASE_MEMORY = 2.5;
/** Seconds a guard searches the last-seen spot before giving up. */
const SEARCH_TIME = 4.5;
/** Distance at which an ALERT guard catches the mouse. */
const CATCH_DISTANCE = 26;

/** Build one live guard from a level definition's guard entry. */
export function makeGuard(def, id) {
  const start = def.waypoints[0];
  return {
    id,
    x: start.x,
    y: start.y,
    facing: 0,
    speed: def.speed,
    coneRange: def.coneRange,
    coneHalfAngle: def.coneHalfAngle,
    waypoints: def.waypoints.map((w) => ({ ...w })),
    waypointIndex: 1,
    pause: def.pause,
    pauseLeft: 0,
    scanAngle: 0,
    state: GUARD_CALM,
    suspicion: 0,
    lastSeen: null,
    chaseLeft: 0,
    searchLeft: 0,
    searchAngle: 0,
  };
}

/** Turn the guard toward a point, smoothly. */
function turnToward(guard, tx, ty, dt, rate) {
  const target = Math.atan2(ty - guard.y, tx - guard.x);
  const diff = angleDifference(target, guard.facing);
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  guard.facing += step;
}

/** Walk toward a point at `speed`; returns true when arrived. */
function walkToward(guard, tx, ty, dt, speed) {
  const d = distance(guard.x, guard.y, tx, ty);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  guard.x += ((tx - guard.x) / d) * step;
  guard.y += ((ty - guard.y) / d) * step;
  turnToward(guard, tx, ty, dt, 6);
  return d - step < 2;
}

/**
 * Advance one guard by `dt` seconds. Returns 'caught' when the guard
 * reaches the mouse while ALERT, otherwise null. `events` collects
 * human-readable notes (spotted, lost the trail, gave up) for the HUD log.
 */
export function updateGuard(guard, dt, level, player, events) {
  const seen = visibility(guard, player, level);
  const heard = canHear(guard, player, player.mode);

  // --- Suspicion meter -------------------------------------------------
  if (seen > 0) {
    guard.suspicion = Math.min(100, guard.suspicion + SEE_RATE * seen * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.chaseLeft = CHASE_MEMORY;
  } else if (heard) {
    guard.suspicion = Math.min(100, guard.suspicion + HEAR_RATE * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.chaseLeft = CHASE_MEMORY;
  } else if (guard.state === GUARD_CALM || guard.state === GUARD_SUSPICIOUS) {
    guard.suspicion = Math.max(0, guard.suspicion - CALM_RATE * dt);
  }

  // --- State transitions ----------------------------------------------
  if (guard.state === GUARD_CALM || guard.state === GUARD_SUSPICIOUS) {
    if (guard.suspicion >= 100) {
      guard.state = GUARD_ALERT;
      guard.searchLeft = 0;
      events.push({ type: 'spotted', guard: guard.id });
    } else if (guard.suspicion >= SUSPICIOUS_AT) {
      guard.state = GUARD_SUSPICIOUS;
    } else {
      guard.state = GUARD_CALM;
    }
  }

  // --- Behaviour per state ---------------------------------------------
  if (guard.state === GUARD_ALERT) {
    if (seen > 0) guard.chaseLeft = CHASE_MEMORY;
    else guard.chaseLeft -= dt;
    if (guard.lastSeen) {
      const arrived = walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, dt, guard.speed * 1.55);
      if (arrived && guard.chaseLeft <= 0) {
        guard.state = GUARD_SEARCH;
        guard.searchLeft = SEARCH_TIME;
        guard.searchAngle = guard.facing;
        events.push({ type: 'searching', guard: guard.id });
      }
    }
    if (distance(guard.x, guard.y, player.x, player.y) <= CATCH_DISTANCE) return 'caught';
    if (guard.chaseLeft <= 0 && guard.state === GUARD_ALERT && !guard.lastSeen) {
      guard.state = GUARD_SEARCH;
      guard.searchLeft = SEARCH_TIME;
    }
    return null;
  }

  if (guard.state === GUARD_SEARCH) {
    guard.searchLeft -= dt;
    // Sweep the lantern back and forth over the last-seen spot.
    guard.facing = guard.searchAngle + Math.sin((SEARCH_TIME - guard.searchLeft) * 1.6) * 1.1;
    if (guard.searchLeft <= 0) {
      guard.state = GUARD_CALM;
      guard.suspicion = 0;
      guard.lastSeen = null;
      events.push({ type: 'gave-up', guard: guard.id });
    }
    return null;
  }

  // CALM / SUSPICIOUS: walk the patrol loop, pausing and scanning at each
  // waypoint. A suspicious guard walks the same loop but faster and with a
  // wider, quicker scan — it knows something is wrong, not where.
  const target = guard.waypoints[guard.waypointIndex];
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    const sweep = guard.state === GUARD_SUSPICIOUS ? 1.5 : 0.8;
    const rate = guard.state === GUARD_SUSPICIOUS ? 1.8 : 0.9;
    guard.facing = guard.scanAngle + Math.sin((guard.pause - guard.pauseLeft) * rate) * sweep;
    if (guard.pauseLeft <= 0) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    }
    return null;
  }
  const speed = guard.state === GUARD_SUSPICIOUS ? guard.speed * 1.25 : guard.speed;
  if (walkToward(guard, target.x, target.y, dt, speed)) {
    guard.pauseLeft = guard.pause;
    guard.scanAngle = guard.facing;
  }
  return null;
}

/** The highest suspicion among all guards — the HUD's global meter. */
export function globalSuspicion(guards) {
  let top = 0;
  for (const guard of guards) top = Math.max(top, guard.suspicion);
  return top;
}

/** True when any guard is ALERT right now. */
export function anyAlert(guards) {
  return guards.some((g) => g.state === GUARD_ALERT);
}
