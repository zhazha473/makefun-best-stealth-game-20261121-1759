// Shadowtide bootstrap and state machine: title -> map -> playing ->
// level-end -> victory, with pause and a caught flash in between.
// One game object carries all live state; the modules each own one job
// (levels, guards, player, detection, render, audio, input, HUD).

import { buildLevel, LEVEL_DEFS } from './levels.js';
import { makeGuard, updateGuard, globalSuspicion, GUARD_ALERT } from './guards.js';
import { makePlayer, updatePlayer, tryPickupKey, keysHeld, exitOpen, atExit } from './player.js';
import { drawWorld, drawTitle, drawMap, drawLevelEnd, drawVictory, drawPause, drawCaught } from './render.js';
import { SoundEngine } from './audio.js';
import { makeInput, attachKeyboard, attachMouse } from './input.js';
import { updateHud, setMessage, showHud } from './hud.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const input = makeInput();
const sound = new SoundEngine();

const game = {
  screen: 'title', // title | map | playing | levelEnd | victory | paused | caught
  previousScreen: 'playing',
  level: null,
  levelIndex: 0,
  player: null,
  guards: [],
  totalScore: 0,
  levelTime: 0,
  runTime: 0,
  runDetections: 0,
  runCaught: 0,
  ghostPools: 0,
  detections: 0,
  levelCaught: 0,
  hintsLeft: 1,
  hintUntil: 0,
  hintKey: null,
  unlocked: 1,
  globalSuspicion: 0,
  levelStats: null,
  time: 0,
  caughtTimer: 0,
  frozen: false,
  muted: false,
  keysKept: 0,
};
window.__shadowtide = game;

/** Start (or restart) a pool. `keepKeys` preserves moon keys after a catch. */
game.startLevel = function startLevel(index) {
  game.levelIndex = index;
  game.level = buildLevel(index);
  game.player = makePlayer(game.level.playerStart);
  game.guards = game.level.def.guards.map((def, i) => makeGuard(def, i + 1));
  game.levelTime = 0;
  game.detections = 0;
  game.levelCaught = 0;
  game.hintsLeft = 1;
  game.hintUntil = 0;
  game.hintKey = null;
  game.globalSuspicion = 0;
  game.levelStats = null;
  for (let i = 0; i < game.keysKept; i += 1) game.level.keys[i].taken = true;
  game.keysKept = 0;
  game.level.exit.open = exitOpen(game.level);
  game.screen = 'playing';
  showHud(true);
  setMessage(game.level.def.hint);
};

/** Score for a finished pool, before the time penalty is applied. */
function levelScore(time, detections) {
  const completion = 500;
  const timePenalty = Math.min(400, Math.floor(time) * 2);
  const ghostBonus = detections === 0 ? 300 : 0;
  return completion - timePenalty + ghostBonus;
}

function ratingFor(detections) {
  if (detections === 0) return 'GHOST';
  if (detections <= 2) return 'SHADOW';
  return 'SEEN';
}

/** The mouse reached the open gate: close the pool and tally the score. */
function finishLevel() {
  const score = levelScore(game.levelTime, game.detections);
  game.totalScore += score;
  game.runTime += game.levelTime;
  game.runDetections += game.detections;
  game.runCaught += game.levelCaught;
  if (game.detections === 0) game.ghostPools += 1;
  game.unlocked = Math.max(game.unlocked, Math.min(3, game.levelIndex + 2));
  game.levelStats = {
    levelNumber: game.level.def.number,
    levelName: game.level.def.name,
    time: game.levelTime,
    detections: game.detections,
    caught: game.levelCaught,
    score,
    rating: ratingFor(game.detections),
    nextLevel: game.levelIndex < 2,
  };
  game.keysKept = 0;
  game.screen = 'levelEnd';
  showHud(false);
  sound.levelClear();
  setMessage(`Pool ${game.level.def.number} cleared — ${game.levelStats.rating} rating!`);
}

/** A guard caught the mouse: keep the keys, lose 150 points, restart. */
function caughtByGuard() {
  game.keysKept = keysHeld(game.level);
  game.totalScore = Math.max(0, game.totalScore - 150);
  game.levelCaught += 1;
  game.screen = 'caught';
  game.caughtTimer = 1.8;
  showHud(false);
  setMessage('Caught! Your keys stay with you, but the pool costs 150 points.');
}

/** Spend the level's one hint: point at the nearest uncollected key. */
function useHint() {
  if (game.screen !== 'playing' || game.hintsLeft <= 0) return;
  let nearest = null;
  let best = Infinity;
  for (const key of game.level.keys) {
    if (key.taken) continue;
    const d = Math.hypot(key.x - game.player.x, key.y - game.player.y);
    if (d < best) {
      best = d;
      nearest = key;
    }
  }
  if (!nearest) return;
  game.hintsLeft -= 1;
  game.hintKey = nearest;
  game.hintUntil = game.time + 3;
  setMessage('Hint: the nearest moon key glows gold for a few seconds.');
}

/** One simulation step while playing. */
function stepPlaying(dt) {
  game.levelTime += dt;
  updatePlayer(game.player, dt, game.level, input.keys);
  const events = [];
  for (const guard of game.guards) {
    const result = updateGuard(guard, dt, game.level, game.player, events);
    if (result === 'caught') {
      caughtByGuard();
      return;
    }
  }
  for (const event of events) {
    if (event.type === 'spotted') {
      game.detections += 1;
      sound.alarm();
      setMessage(`Spotted! Crab ${event.guard} raised the alarm — hide!`);
    } else if (event.type === 'searching') {
      setMessage(`Crab ${event.guard} is searching the last place it saw you…`);
    } else if (event.type === 'gave-up') {
      setMessage(`Crab ${event.guard} gave up and went back to its patrol.`);
    }
  }
  const key = tryPickupKey(game.player, game.level);
  if (key) {
    game.totalScore += 100;
    sound.keyChime();
    const held = keysHeld(game.level);
    if (held >= game.level.keys.length) {
      game.level.exit.open = true;
      setMessage('All three moon keys! The exit gate is open — go, quietly.');
    } else {
      setMessage(`Moon key ${held} of 3 — ${3 - held} left.`);
    }
  }
  if (atExit(game.player, game.level)) {
    finishLevel();
    return;
  }
  game.globalSuspicion = globalSuspicion(game.guards);
  // Footsteps: tempo and volume follow pace and the nearest guard.
  if (game.player.moving) {
    let nearest = Infinity;
    for (const guard of game.guards) {
      nearest = Math.min(nearest, Math.hypot(guard.x - game.player.x, guard.y - game.player.y));
    }
    sound.footstep(game.player.mode, nearest);
  }
  updateHud(game);
}

/** Keyboard actions that are not held movement keys. */
function onAction(code) {
  sound.ensure();
  if (code === 'KeyM') {
    game.muted = !game.muted;
    sound.setMuted(game.muted);
    setMessage(game.muted ? 'Sound muted.' : 'Sound on.');
    return;
  }
  if (game.screen === 'title') {
    if (code === 'Enter' || code === 'Space') {
      game.keysKept = 0;
      game.startLevel(0);
    }
    if (code === 'KeyL') game.screen = 'map';
    return;
  }
  if (game.screen === 'map') {
    if (code === 'Digit1' || code === 'Numpad1') game.keysKept = 0, game.startLevel(0);
    if (code === 'Digit2' || code === 'Numpad2') {
      if (game.unlocked >= 2) game.keysKept = 0, game.startLevel(1);
      else setMessage('Pool 2 is locked — finish Low Tide first.');
    }
    if (code === 'Digit3' || code === 'Numpad3') {
      if (game.unlocked >= 3) game.keysKept = 0, game.startLevel(2);
      else setMessage('Pool 3 is locked — finish Half Moon first.');
    }
    if (code === 'Escape') game.screen = 'title';
    return;
  }
  if (game.screen === 'playing') {
    if (code === 'KeyP' || code === 'Escape') {
      game.previousScreen = 'playing';
      game.screen = 'paused';
      showHud(false);
      return;
    }
    if (code === 'KeyR') {
      game.keysKept = 0;
      game.startLevel(game.levelIndex);
      setMessage('Pool restarted.');
      return;
    }
    if (code === 'KeyH') useHint();
    return;
  }
  if (game.screen === 'paused') {
    if (code === 'KeyP' || code === 'Escape') {
      game.screen = 'playing';
      showHud(true);
    }
    if (code === 'KeyR') {
      game.keysKept = 0;
      game.startLevel(game.levelIndex);
    }
    return;
  }
  if (game.screen === 'levelEnd') {
    if (code === 'Enter') {
      if (game.levelStats.nextLevel) {
        game.keysKept = 0;
        game.startLevel(game.levelIndex + 1);
      } else {
        game.screen = 'victory';
      }
    }
    if (code === 'KeyR') {
      game.keysKept = 0;
      game.startLevel(game.levelIndex);
    }
    return;
  }
  if (game.screen === 'victory' || game.screen === 'caught') {
    if (code === 'Enter') {
      game.totalScore = 0;
      game.runTime = 0;
      game.runDetections = 0;
      game.runCaught = 0;
      game.ghostPools = 0;
      game.unlocked = 1;
      game.keysKept = 0;
      game.screen = 'title';
      showHud(false);
    }
  }
}

attachKeyboard(input, onAction);
attachMouse(input, canvas);

/** Canvas clicks: menus on title/map, walk targets while playing. */
canvas.addEventListener('click', () => {
  sound.ensure();
  if (!input.click) return;
  const point = input.click;
  input.click = null;
  if (game.screen === 'title') {
    game.keysKept = 0;
    game.startLevel(0);
    return;
  }
  if (game.screen === 'map') {
    const cards = [
      { x: 90, index: 0, unlocked: true },
      { x: 350, index: 1, unlocked: game.unlocked >= 2 },
      { x: 610, index: 2, unlocked: game.unlocked >= 3 },
    ];
    for (const card of cards) {
      if (point.x >= card.x && point.x <= card.x + 260 && point.y >= 210 && point.y <= 430) {
        if (card.unlocked) {
          game.keysKept = 0;
          game.startLevel(card.index);
        } else {
          setMessage('That pool is locked — finish the one before it.');
        }
        return;
      }
    }
    return;
  }
  if (game.screen === 'playing') {
    game.player.clickTarget = { x: point.x, y: point.y };
  }
});

/** Draw the current screen. */
function draw() {
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'map') drawMap(ctx, game);
  else if (game.screen === 'levelEnd') drawLevelEnd(ctx, game);
  else if (game.screen === 'victory') drawVictory(ctx, game);
  else if (game.screen === 'paused') {
    drawWorld(ctx, game);
    drawPause(ctx);
  } else if (game.screen === 'caught') drawCaught(ctx, game);
  else drawWorld(ctx, game);

  // Hint glow: the nearest key pulses while a hint is active.
  if (game.screen === 'playing' && game.hintKey && game.time < game.hintUntil && !game.hintKey.taken) {
    const key = game.hintKey;
    ctx.strokeStyle = `rgba(255,217,74,${0.5 + 0.4 * Math.sin(game.time * 8)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(key.x, key.y, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) {
    game.time += dt;
    if (game.screen === 'playing') stepPlaying(dt);
    else if (game.screen === 'caught') {
      game.caughtTimer -= dt;
      if (game.caughtTimer <= 0) {
        game.startLevel(game.levelIndex);
        setMessage('Back at the start of the pool — keys kept, 150 points lost.');
      }
    }
    for (const key of game.level ? game.level.keys : []) key.bob += dt;
  }
  draw();
  requestAnimationFrame(frame);
}

// --- Screenshot staging ---------------------------------------------------
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const levelParam = Number(params.get('level') || 1);
  stageShot(game, shot, levelParam - 1);
  game.frozen = true;
  showHud(game.screen === 'playing');
  if (game.screen === 'playing') updateHud(game);
} else {
  game.startLevel(0);
  game.screen = 'title';
  showHud(false);
}

// --- Headless self-test (?selftest=1) -------------------------------------
// Runs the real rules through scripted steps and writes PASS/FAIL lines
// into #selftest, so a headless run can verify the game without a mouse.
function selfTest() {
  const lines = [];
  const check = (name, ok) => lines.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  try {
    game.startLevel(0);
    game.frozen = true;
    const idle = { up: false, down: false, left: false, right: false, sneak: false, run: false };
    const guard = game.guards[0];
    // 1. Sneaking inside a reed: the guard cannot see the mouse.
    const reed = game.level.reeds[1];
    game.player.x = reed.x;
    game.player.y = reed.y;
    game.player.mode = 'sneak';
    guard.x = reed.x + 100;
    guard.y = reed.y;
    guard.facing = Math.atan2(reed.y - guard.y, reed.x - guard.x);
    guard.suspicion = 0;
    updateGuard(guard, 1, game.level, game.player, []);
    check('sneak in reed hides from guard', guard.suspicion === 0 && guard.state === 'CALM');
    // 2. Running close by raises suspicion even out of the cone.
    game.player.x = guard.x + 90;
    game.player.y = guard.y + 60;
    game.player.mode = 'run';
    updateGuard(guard, 1, game.level, game.player, []);
    check('running near guard raises suspicion', guard.suspicion > 0);
    // 3. Standing in the open inside the cone triggers ALERT.
    // (Open water at the bottom of pool 1: no wall, no reed, no shadow.)
    guard.x = 650;
    guard.y = 580;
    game.player.x = 730;
    game.player.y = 580;
    game.player.mode = 'walk';
    guard.facing = 0;
    guard.suspicion = 99;
    const events = [];
    updateGuard(guard, 0.5, game.level, game.player, events);
    check('seen in open triggers ALERT', guard.state === GUARD_ALERT);
    check('spotted event fired', events.some((e) => e.type === 'spotted'));
    // 4. Hiding long enough lets the guard give up and calm down.
    game.player.x = reed.x;
    game.player.y = reed.y;
    game.player.mode = 'sneak';
    guard.lastSeen = { x: 700, y: 500 };
    for (let i = 0; i < 40; i += 1) updateGuard(guard, 0.25, game.level, game.player, []);
    check('guard recovers to CALM after searching', guard.state === 'CALM' && guard.suspicion === 0);
    // 5. Three keys open the exit; reaching it ends the level.
    for (const key of game.level.keys) key.taken = true;
    game.level.exit.open = exitOpen(game.level);
    check('3 keys open the exit', game.level.exit.open === true);
    game.player.x = game.level.exit.x + 10;
    game.player.y = game.level.exit.y + 10;
    check('at exit with keys open', atExit(game.player, game.level) === true);
    // 6. Key pickup works by touch.
    game.startLevel(0);
    const first = game.level.keys[0];
    game.player.x = first.x;
    game.player.y = first.y;
    check('touch picks up a key', tryPickupKey(game.player, game.level) === first);
    check('keys held counts 1', keysHeld(game.level) === 1);
    // 7. Level data matches the advertised counts.
    const totalGuards = LEVEL_DEFS.reduce((n, d) => n + d.guards.length, 0);
    const totalReeds = LEVEL_DEFS.reduce((n, d) => n + d.reeds.length, 0);
    check('12 guards total', totalGuards === 12);
    check('15 reed beds total', totalReeds === 15);
    check('3 keys per level', LEVEL_DEFS.every((d) => d.keys.length === 3));
  } catch (error) {
    lines.push(`FAIL self-test threw: ${error.message}`);
  }
  const pre = document.getElementById('selftest');
  if (pre) pre.textContent = lines.join('\n');
  document.title = lines.every((l) => l.startsWith('PASS')) ? 'SELFTEST PASS' : 'SELFTEST FAIL';
}

if (params.get('selftest') === '1') selfTest();
requestAnimationFrame(frame);
