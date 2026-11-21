// All drawing for Shadowtide: the moonlit tide-pool floor, rocks, reed
// beds, shadow pools, moon keys, the exit gate, lantern crabs with their
// yellow vision cones, the reef mouse, and the title, map, level-end,
// victory and pause screens. Everything is drawn with Canvas 2D —
// no image files, no fonts beyond the system stack.

import { FIELD_WIDTH, FIELD_HEIGHT } from './levels.js';
import { makeRng, floatBetween, intBetween } from './random.js';
import { GUARD_ALERT, GUARD_SEARCH, GUARD_SUSPICIOUS } from './guards.js';

// Cached decoration per level seed, so speckles never jump between frames.
const decorCache = new Map();

function decorFor(level) {
  const seed = level.def.seed;
  if (decorCache.has(seed)) return decorCache.get(seed);
  const rng = makeRng(seed);
  const pebbles = [];
  for (let i = 0; i < 90; i += 1) {
    pebbles.push({
      x: floatBetween(rng, 12, FIELD_WIDTH - 12),
      y: floatBetween(rng, 12, FIELD_HEIGHT - 12),
      r: floatBetween(rng, 1.5, 4),
      tone: intBetween(rng, 0, 2),
    });
  }
  const shells = [];
  for (let i = 0; i < 14; i += 1) {
    shells.push({
      x: floatBetween(rng, 30, FIELD_WIDTH - 30),
      y: floatBetween(rng, 30, FIELD_HEIGHT - 30),
      r: floatBetween(rng, 4, 7),
      hue: intBetween(rng, 0, 2),
    });
  }
  const stars = [];
  for (let i = 0; i < 26; i += 1) {
    stars.push({ x: floatBetween(rng, 0, FIELD_WIDTH), y: floatBetween(rng, 0, 90), r: floatBetween(rng, 0.6, 1.8) });
  }
  const decor = { pebbles, shells, stars };
  decorCache.set(seed, decor);
  return decor;
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

/** The moonlit floor: indigo sand, speckles, shells, tide pools. */
function drawFloor(ctx, level) {
  const grad = ctx.createLinearGradient(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  grad.addColorStop(0, '#232c52');
  grad.addColorStop(0.5, '#1b2342');
  grad.addColorStop(1, '#141a33');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

  const decor = decorFor(level);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (const star of decor.stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  const pebbleTones = ['rgba(255,255,255,0.10)', 'rgba(0,0,0,0.16)', 'rgba(190,200,255,0.10)'];
  for (const pebble of decor.pebbles) {
    ctx.fillStyle = pebbleTones[pebble.tone];
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, pebble.r, 0, Math.PI * 2);
    ctx.fill();
  }
  const shellHues = ['#d9c7a7', '#c9a7b8', '#a7c9d9'];
  for (const shell of decor.shells) {
    ctx.fillStyle = shellHues[shell.hue];
    ctx.beginPath();
    ctx.arc(shell.x, shell.y, shell.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(shell.x, shell.y, shell.r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Tide pools: still, moonlit water.
  for (const pool of level.pools) {
    const water = ctx.createRadialGradient(pool.x, pool.y, 4, pool.x, pool.y, pool.rx);
    water.addColorStop(0, '#2e6d8f');
    water.addColorStop(1, '#1d4a68');
    ctx.fillStyle = water;
    ellipse(ctx, pool.x, pool.y, pool.rx, pool.ry);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,220,255,0.45)';
    ctx.lineWidth = 2;
    ellipse(ctx, pool.x, pool.y, pool.rx, pool.ry);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ellipse(ctx, pool.x - pool.rx * 0.2, pool.y - pool.ry * 0.25, pool.rx * 0.45, pool.ry * 0.4);
    ctx.stroke();
  }
}

function drawWalls(ctx, level) {
  for (const wall of level.walls) {
    ctx.fillStyle = '#10142a';
    ctx.fillRect(wall.x + 3, wall.y + 4, wall.w, wall.h);
    const rock = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
    rock.addColorStop(0, '#5a628c');
    rock.addColorStop(1, '#333a5e');
    ctx.fillStyle = rock;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = '#7c86b3';
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(wall.x + 4, wall.y + 4, wall.w - 8, 5);
  }
}

function drawReeds(ctx, level, time) {
  for (const reed of level.reeds) {
    ctx.fillStyle = 'rgba(20,60,40,0.55)';
    ctx.beginPath();
    ctx.arc(reed.x, reed.y, reed.r, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 11; i += 1) {
      const a = (i / 11) * Math.PI * 2;
      const sway = Math.sin(time * 1.4 + i * 1.7) * 3;
      const bx = reed.x + Math.cos(a) * reed.r * 0.55;
      const by = reed.y + Math.sin(a) * reed.r * 0.55;
      ctx.strokeStyle = i % 3 === 0 ? '#4f9a68' : '#2f7a4e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + sway, by - reed.r * 0.5, bx + sway * 1.6, by - reed.r * 0.95);
      ctx.stroke();
    }
  }
}

function drawShadows(ctx, level) {
  for (const shadow of level.shadows) {
    ctx.fillStyle = 'rgba(4,7,20,0.58)';
    ellipse(ctx, shadow.x, shadow.y, shadow.rx, shadow.ry);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,160,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ellipse(ctx, shadow.x, shadow.y, shadow.rx, shadow.ry);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(170,190,255,0.55)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW — SAFE', shadow.x, shadow.y + 4);
  }
}

function drawExit(ctx, level, time) {
  const exit = level.exit;
  const open = exit.open;
  const cx = exit.x + exit.w / 2;
  const cy = exit.y + exit.h / 2;
  if (open) {
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 70 + Math.sin(time * 3) * 6);
    glow.addColorStop(0, 'rgba(125,255,154,0.55)');
    glow.addColorStop(1, 'rgba(125,255,154,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 76, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#4a4f6e';
  ctx.fillRect(exit.x - 4, exit.y - 4, exit.w + 8, exit.h + 8);
  ctx.fillStyle = open ? '#1f5c33' : '#241f2e';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = open ? '#7dff9a' : '#8a7a5a';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4);
  ctx.fillStyle = open ? '#c9ffd6' : '#d8c690';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', cx, cy - 26);
  if (!open) {
    ctx.strokeStyle = '#d8c690';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(exit.x + 8, exit.y + 8);
    ctx.lineTo(exit.x + exit.w - 8, exit.y + exit.h - 8);
    ctx.moveTo(exit.x + exit.w - 8, exit.y + 8);
    ctx.lineTo(exit.x + 8, exit.y + exit.h - 8);
    ctx.stroke();
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('NEEDS 3 KEYS', cx, cy + exit.h / 2 + 16);
  } else {
    ctx.fillStyle = '#eaffef';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('➜', cx, cy + 8);
  }
}

function drawKeys(ctx, level, time) {
  for (const key of level.keys) {
    if (key.taken) continue;
    const bob = Math.sin(time * 2 + key.x) * 3;
    const y = key.y + bob;
    const glow = ctx.createRadialGradient(key.x, y, 2, key.x, y, 34);
    glow.addColorStop(0, 'rgba(255,217,74,0.6)');
    glow.addColorStop(1, 'rgba(255,217,74,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(key.x, y, 34, 0, Math.PI * 2);
    ctx.fill();
    // Crescent moon key.
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(key.x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b2342';
    ctx.beginPath();
    ctx.arc(key.x + 6, y - 3, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath();
    ctx.arc(key.x - 5, y - 8, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPatrolPaths(ctx, guards) {
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 7]);
  for (const guard of guards) {
    ctx.beginPath();
    guard.waypoints.forEach((wp, i) => {
      if (i === 0) ctx.moveTo(wp.x, wp.y);
      else ctx.lineTo(wp.x, wp.y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

/** A guard's vision cone: bright yellow, cut short by nothing (walls are checked in logic). */
function drawCone(ctx, guard) {
  const half = guard.coneHalfAngle;
  ctx.fillStyle =
    guard.state === GUARD_ALERT
      ? 'rgba(255,80,60,0.34)'
      : guard.state === GUARD_SUSPICIOUS
        ? 'rgba(255,190,80,0.30)'
        : 'rgba(255,214,90,0.26)';
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, guard.coneRange, guard.facing - half, guard.facing + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,120,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing - half) * guard.coneRange, guard.y + Math.sin(guard.facing - half) * guard.coneRange);
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing + half) * guard.coneRange, guard.y + Math.sin(guard.facing + half) * guard.coneRange);
  ctx.stroke();
}

function drawGuard(ctx, guard, time) {
  drawCone(ctx, guard);
  // Lantern glow around the crab.
  const glow = ctx.createRadialGradient(guard.x, guard.y, 2, guard.x, guard.y, 44);
  glow.addColorStop(0, 'rgba(255,200,80,0.5)');
  glow.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 44, 0, Math.PI * 2);
  ctx.fill();
  // Claws.
  ctx.fillStyle = '#c85a2e';
  const lx = guard.x + Math.cos(guard.facing + 0.9) * 16;
  const ly = guard.y + Math.sin(guard.facing + 0.9) * 16;
  const rx = guard.x + Math.cos(guard.facing - 0.9) * 16;
  const ry = guard.y + Math.sin(guard.facing - 0.9) * 16;
  ctx.beginPath();
  ctx.arc(lx, ly, 6, 0, Math.PI * 2);
  ctx.arc(rx, ry, 6, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  const body = ctx.createRadialGradient(guard.x - 4, guard.y - 5, 2, guard.x, guard.y, 15);
  body.addColorStop(0, '#f08a4b');
  body.addColorStop(1, '#c85a2e');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7e3418';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Legs.
  ctx.strokeStyle = '#8a3d1e';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(guard.x + Math.cos(guard.facing + Math.PI / 2) * 10, guard.y + Math.sin(guard.facing + Math.PI / 2) * 10);
    ctx.lineTo(
      guard.x + Math.cos(guard.facing + Math.PI / 2) * 20 + i * 6,
      guard.y + Math.sin(guard.facing + Math.PI / 2) * 20 + i * 4,
    );
    ctx.stroke();
  }
  // Lantern on its back.
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 4, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87c1e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Eyes toward facing.
  const ex = guard.x + Math.cos(guard.facing) * 7;
  const ey = guard.y + Math.sin(guard.facing) * 7;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(ex + Math.cos(guard.facing) * 1.4, ey + Math.sin(guard.facing) * 1.4, 1.7, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion mark and meter.
  if (guard.state === GUARD_ALERT) {
    ctx.fillStyle = '#ff5a40';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 26);
  } else if (guard.state === GUARD_SUSPICIOUS) {
    ctx.fillStyle = '#ffb84d';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 26);
  } else if (guard.state === GUARD_SEARCH) {
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('…', guard.x, guard.y - 26);
  }
  if (guard.suspicion > 2 && guard.state !== GUARD_ALERT) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(guard.x - 16, guard.y - 24, 32, 5);
    ctx.fillStyle = guard.suspicion > 55 ? '#ff9a3d' : '#ffd65a';
    ctx.fillRect(guard.x - 16, guard.y - 24, 32 * (guard.suspicion / 100), 5);
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : Math.sin(time * 2) * 0.8;
  ctx.save();
  ctx.translate(player.x, player.y + bob * 0.3);
  if (player.hidden) ctx.globalAlpha = 0.55;
  // Tail.
  ctx.strokeStyle = '#d9a0a8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-Math.cos(player.facing) * 10, -Math.sin(player.facing) * 10);
  ctx.quadraticCurveTo(
    -Math.cos(player.facing) * 22 + Math.sin(time * 3) * 3,
    -Math.sin(player.facing) * 22,
    -Math.cos(player.facing) * 30,
    -Math.sin(player.facing) * 30 + 4,
  );
  ctx.stroke();
  // Ears.
  const ex1 = Math.cos(player.facing - 0.6) * 8;
  const ey1 = Math.sin(player.facing - 0.6) * 8;
  const ex2 = Math.cos(player.facing + 0.6) * 8;
  const ey2 = Math.sin(player.facing + 0.6) * 8;
  ctx.fillStyle = '#8f887c';
  ctx.beginPath();
  ctx.arc(ex1, ey1, 5, 0, Math.PI * 2);
  ctx.arc(ex2, ey2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a0a8';
  ctx.beginPath();
  ctx.arc(ex1, ey1, 2.6, 0, Math.PI * 2);
  ctx.arc(ex2, ey2, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  const body = ctx.createRadialGradient(-3, -4, 2, 0, 0, 14);
  body.addColorStop(0, '#cfc8ba');
  body.addColorStop(1, '#8f887c');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5d574c';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Nose and eyes.
  const nx = Math.cos(player.facing) * 12;
  const ny = Math.sin(player.facing) * 12;
  ctx.fillStyle = '#e87a8a';
  ctx.beginPath();
  ctx.arc(nx, ny, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing - 0.5) * 7, Math.sin(player.facing - 0.5) * 7, 1.8, 0, Math.PI * 2);
  ctx.arc(Math.cos(player.facing + 0.5) * 7, Math.sin(player.facing + 0.5) * 7, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.hidden) {
    ctx.fillStyle = '#9fe8b0';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 24);
  }
  if (player.clickTarget) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.clickTarget.x, player.clickTarget.y, 8 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Draw the live level: floor, cover, keys, exit, cones, crabs, mouse. */
export function drawWorld(ctx, game) {
  const { level, guards, player } = game;
  drawFloor(ctx, level);
  drawShadows(ctx, level);
  drawWalls(ctx, level);
  drawReeds(ctx, level, game.time);
  drawExit(ctx, level, game.time);
  drawKeys(ctx, level, game.time);
  drawPatrolPaths(ctx, guards);
  for (const guard of guards) drawGuard(ctx, guard, game.time);
  drawPlayer(ctx, player, game.time);
  // Moonlight vignette.
  const vignette = ctx.createRadialGradient(
    FIELD_WIDTH / 2, FIELD_HEIGHT / 2, FIELD_HEIGHT * 0.42,
    FIELD_WIDTH / 2, FIELD_HEIGHT / 2, FIELD_HEIGHT * 0.85,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(2,4,14,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(8,12,30,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffd94a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function centreText(ctx, text, x, y, font, colour) {
  ctx.fillStyle = colour;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

/** Title screen over a quiet, moonlit level. */
export function drawTitle(ctx, game) {
  drawWorld(ctx, game);
  ctx.fillStyle = 'rgba(4,7,20,0.62)';
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  centreText(ctx, 'S H A D O W T I D E', FIELD_WIDTH / 2, 190, 'bold 64px system-ui, sans-serif', '#ffe98a');
  centreText(ctx, 'a reef mouse, three moon keys, twelve lantern crabs', FIELD_WIDTH / 2, 232, '20px system-ui, sans-serif', '#cdd6ff');
  centreText(ctx, 'Sneak unseen. Wait for the cones to turn. Take the keys. Reach the gate.', FIELD_WIDTH / 2, 264, '17px system-ui, sans-serif', '#9fb0e8');
  panel(ctx, FIELD_WIDTH / 2 - 330, 300, 660, 150);
  centreText(ctx, 'WASD / arrows — move      Shift — sneak (silent, slow)', FIELD_WIDTH / 2, 332, '16px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, 'Space — run (fast, noisy)      Click — walk to a point', FIELD_WIDTH / 2, 360, '16px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, 'H — hint (1 per level)      R — restart level      M — mute      P — pause', FIELD_WIDTH / 2, 388, '16px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, 'Hide in reeds and shadow. A guard that sees you gives you a chance to run.', FIELD_WIDTH / 2, 424, '15px system-ui, sans-serif', '#9fe8b0');
  centreText(ctx, 'Press ENTER or click START to play', FIELD_WIDTH / 2, 510, 'bold 20px system-ui, sans-serif', '#ffd94a');
}

/** Level map: three tide pools, locked ones greyed out. */
export function drawMap(ctx, game) {
  ctx.fillStyle = '#141a33';
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  centreText(ctx, 'CHOOSE A TIDE POOL', FIELD_WIDTH / 2, 110, 'bold 40px system-ui, sans-serif', '#ffe98a');
  centreText(ctx, 'Press 1, 2 or 3 — or click a pool', FIELD_WIDTH / 2, 150, '17px system-ui, sans-serif', '#cdd6ff');
  const cards = [
    { x: 90, name: '1 · LOW TIDE', guards: '3 crabs · 4 reeds', unlocked: true },
    { x: 350, name: '2 · HALF MOON', guards: '4 crabs · 5 reeds', unlocked: game.unlocked >= 2 },
    { x: 610, name: '3 · HIGH TIDE', guards: '5 crabs · 6 reeds', unlocked: game.unlocked >= 3 },
  ];
  for (const card of cards) {
    panel(ctx, card.x, 210, 260, 220);
    centreText(ctx, card.name, card.x + 130, 260, 'bold 22px system-ui, sans-serif', card.unlocked ? '#ffe98a' : '#6a7194');
    centreText(ctx, card.guards, card.x + 130, 300, '16px system-ui, sans-serif', card.unlocked ? '#cdd6ff' : '#6a7194');
    centreText(ctx, '3 moon keys', card.x + 130, 330, '16px system-ui, sans-serif', card.unlocked ? '#cdd6ff' : '#6a7194');
    centreText(ctx, card.unlocked ? 'OPEN' : 'LOCKED — finish the pool before it', card.x + 130, 380, '15px system-ui, sans-serif', card.unlocked ? '#9fe8b0' : '#8a7a5a');
  }
  centreText(ctx, 'Esc — back to title', FIELD_WIDTH / 2, 500, '15px system-ui, sans-serif', '#9fb0e8');
}

/** Level-end panel: time, detections, score, Ghost / Shadow / Seen rating. */
export function drawLevelEnd(ctx, game) {
  drawWorld(ctx, game);
  ctx.fillStyle = 'rgba(4,7,20,0.6)';
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  const s = game.levelStats;
  panel(ctx, FIELD_WIDTH / 2 - 300, 130, 600, 380);
  centreText(ctx, `POOL ${s.levelNumber} CLEARED — ${s.levelName.toUpperCase()}`, FIELD_WIDTH / 2, 190, 'bold 28px system-ui, sans-serif', '#ffe98a');
  centreText(ctx, `Rating: ${s.rating}`, FIELD_WIDTH / 2, 240, 'bold 24px system-ui, sans-serif', s.rating === 'GHOST' ? '#9fe8b0' : s.rating === 'SHADOW' ? '#ffd94a' : '#ff9a7a');
  centreText(ctx, `Time ${formatTime(s.time)}   ·   Keys 3 / 3`, FIELD_WIDTH / 2, 284, '18px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, `Times spotted: ${s.detections}   ·   Times caught: ${s.caught}`, FIELD_WIDTH / 2, 316, '18px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, `Level score ${s.score}   ·   Total score ${game.totalScore}`, FIELD_WIDTH / 2, 348, '18px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, s.nextLevel ? 'Press ENTER for the next tide pool' : 'Press ENTER for the final tally', FIELD_WIDTH / 2, 420, 'bold 18px system-ui, sans-serif', '#ffd94a');
  centreText(ctx, 'M — replay this pool', FIELD_WIDTH / 2, 456, '15px system-ui, sans-serif', '#9fb0e8');
}

/** Victory screen: total score and the whole run's statistics. */
export function drawVictory(ctx, game) {
  ctx.fillStyle = '#141a33';
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  const decor = decorFor(game.level);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (const star of decor.stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y + 40, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  centreText(ctx, 'THE TIDE IS YOURS', FIELD_WIDTH / 2, 130, 'bold 48px system-ui, sans-serif', '#ffe98a');
  centreText(ctx, 'All three moon keys in every pool — the reef mouse slips home unseen.', FIELD_WIDTH / 2, 172, '18px system-ui, sans-serif', '#cdd6ff');
  panel(ctx, FIELD_WIDTH / 2 - 300, 210, 600, 260);
  centreText(ctx, `TOTAL SCORE  ${game.totalScore}`, FIELD_WIDTH / 2, 268, 'bold 30px system-ui, sans-serif', '#9fe8b0');
  centreText(ctx, `Total time ${formatTime(game.runTime)}`, FIELD_WIDTH / 2, 312, '18px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, `Times spotted ${game.runDetections}   ·   Times caught ${game.runCaught}`, FIELD_WIDTH / 2, 344, '18px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, `Ghost pools (never spotted): ${game.ghostPools} of 3`, FIELD_WIDTH / 2, 376, '18px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, '12 lantern crabs outwaited · 15 reed beds · 9 moon keys', FIELD_WIDTH / 2, 408, '17px system-ui, sans-serif', '#ffd94a');
  centreText(ctx, 'Press ENTER to play again', FIELD_WIDTH / 2, 520, 'bold 18px system-ui, sans-serif', '#ffd94a');
}

/** Pause overlay. */
export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(4,7,20,0.55)';
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  centreText(ctx, 'PAUSED', FIELD_WIDTH / 2, 300, 'bold 44px system-ui, sans-serif', '#ffe98a');
  centreText(ctx, 'P or Esc — resume      R — restart this pool', FIELD_WIDTH / 2, 344, '17px system-ui, sans-serif', '#cdd6ff');
}

/** Caught flash: the moment a guard reaches the mouse. */
export function drawCaught(ctx, game) {
  drawWorld(ctx, game);
  ctx.fillStyle = 'rgba(60,8,8,0.45)';
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  panel(ctx, FIELD_WIDTH / 2 - 300, 230, 600, 180);
  centreText(ctx, 'CAUGHT!', FIELD_WIDTH / 2, 290, 'bold 40px system-ui, sans-serif', '#ff8a7a');
  centreText(ctx, 'The crab found you. Your moon keys stay with you,', FIELD_WIDTH / 2, 330, '17px system-ui, sans-serif', '#e8ecff');
  centreText(ctx, 'but the pool costs you 150 points. Back to the start of the pool.', FIELD_WIDTH / 2, 356, '17px system-ui, sans-serif', '#e8ecff');
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
