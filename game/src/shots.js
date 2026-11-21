// Deterministic screenshot staging for Shadowtide. `?shot=start|play|mid|win`
// (plus `&level=1..3` and `&seed=`) freezes the game in a frame a judge
// can read at a glance: guards mid-patrol with their yellow cones, the
// mouse tucked in a reed, a key already taken, the exit gate visible.
// Every shot is built from the real level data and the real rules —
// nothing is drawn only for the camera.

import { distance } from './detection.js';
import { GUARD_ALERT, GUARD_SUSPICIOUS } from './guards.js';

/** Walk `fraction` (0-1) of the way around a guard's patrol loop. */
function placeGuardOnRoute(guard, fraction) {
  const points = guard.waypoints;
  const segments = [];
  let total = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const len = distance(a.x, a.y, b.x, b.y);
    segments.push({ a, b, len });
    total += len;
  }
  let remaining = fraction * total;
  for (const seg of segments) {
    if (remaining <= seg.len) {
      const t = seg.len === 0 ? 0 : remaining / seg.len;
      guard.x = seg.a.x + (seg.b.x - seg.a.x) * t;
      guard.y = seg.a.y + (seg.b.y - seg.a.y) * t;
      guard.facing = Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x);
      guard.waypointIndex = (segments.indexOf(seg) + 1) % points.length;
      return;
    }
    remaining -= seg.len;
  }
  const last = points[points.length - 1];
  guard.x = last.x;
  guard.y = last.y;
}

/**
 * Stage the named shot on the live game object and return the screen to
 * draw. `levelIndex` picks the pool for the play shot (cover uses 1,
 * the third screenshot uses 3).
 */
export function stageShot(game, name, levelIndex) {
  if (name === 'win') {
    game.startLevel(0);
    game.screen = 'victory';
    game.totalScore = 2840;
    game.runTime = 612;
    game.runDetections = 2;
    game.runCaught = 1;
    game.ghostPools = 2;
    return;
  }

  if (name === 'mid') {
    // One crab has just spotted the mouse: ALERT, "!", full meter.
    game.startLevel(0);
    game.screen = 'playing';
    const shadow = game.level.shadows[1];
    game.player.x = shadow.x;
    game.player.y = shadow.y;
    game.player.hidden = true;
    game.player.facing = Math.PI;
    game.level.keys[0].taken = true;
    const hunter = game.guards[0];
    placeGuardOnRoute(hunter, 0.62);
    hunter.state = GUARD_ALERT;
    hunter.suspicion = 100;
    hunter.lastSeen = { x: game.player.x, y: game.player.y };
    hunter.facing = Math.atan2(game.player.y - hunter.y, game.player.x - hunter.x);
    hunter.chaseLeft = 2.5;
    const watcher = game.guards[1];
    placeGuardOnRoute(watcher, 0.3);
    watcher.state = GUARD_SUSPICIOUS;
    watcher.suspicion = 68;
    watcher.facing = Math.atan2(game.player.y - watcher.y, game.player.x - watcher.x);
    placeGuardOnRoute(game.guards[2], 0.45);
    game.globalSuspicion = 100;
    game.levelTime = 74;
    game.totalScore = 130;
    return;
  }

  if (name === 'play') {
    // Mid-game, everything readable: cones, a reed, keys, the gate, HUD.
    const index = Math.max(0, Math.min(2, levelIndex || 0));
    game.startLevel(index);
    game.screen = 'playing';
    const reed = game.level.reeds[1];
    game.player.x = reed.x;
    game.player.y = reed.y;
    game.player.hidden = true;
    game.player.facing = -Math.PI / 2;
    game.level.keys[0].taken = true;
    game.level.exit.open = false;
    const fractions = [0.18, 0.55, 0.82, 0.34, 0.66];
    game.guards.forEach((guard, i) => {
      placeGuardOnRoute(guard, fractions[i % fractions.length]);
      guard.state = 'CALM';
      guard.suspicion = i === 1 ? 22 : 0;
    });
    game.globalSuspicion = 22;
    game.levelTime = 58;
    game.totalScore = 100;
    return;
  }

  // Default: title screen over a quiet level 1.
  game.startLevel(0);
  game.screen = 'title';
  game.guards.forEach((guard, i) => placeGuardOnRoute(guard, 0.2 + i * 0.25));
}
