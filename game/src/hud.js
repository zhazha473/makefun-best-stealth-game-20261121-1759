// The DOM heads-up display: level name, moon keys, the global suspicion
// meter, score, timer, the hidden badge and the message line. The canvas
// draws the world; this file only keeps the bar above it honest.

import { formatTime } from './render.js';

const KEY_MOON = '☾';

function byId(id) {
  return document.getElementById(id);
}

export function updateHud(game) {
  const level = game.level;
  if (!level) return;
  byId('hud-level').textContent = `Pool ${level.def.number} · ${level.def.name}`;
  const held = level.keys.filter((k) => k.taken).length;
  byId('hud-keys').textContent = `${KEY_MOON} ${held} / ${level.keys.length}`;
  byId('hud-keys').classList.toggle('keys-full', held === level.keys.length);
  const suspicion = game.globalSuspicion;
  const meter = byId('hud-meter-fill');
  meter.style.width = `${Math.round(suspicion)}%`;
  meter.className = 'meter-fill' + (suspicion >= 100 ? ' meter-alert' : suspicion >= 55 ? ' meter-warn' : '');
  byId('hud-meter-label').textContent =
    suspicion >= 100 ? 'ALERT!' : suspicion >= 55 ? 'SUSPICIOUS…' : suspicion > 2 ? 'noticed…' : 'unseen';
  byId('hud-score').textContent = `Score ${game.totalScore}`;
  byId('hud-time').textContent = formatTime(game.levelTime);
  const badge = byId('hud-hidden');
  badge.style.visibility = game.player && game.player.hidden ? 'visible' : 'hidden';
  byId('hud-hint').textContent = `Hints: ${game.hintsLeft}`;
}

/** Write one line into the message strip under the canvas. */
export function setMessage(text) {
  byId('hud-message').textContent = text;
}

/** Show the HUD bar only while a level is being played. */
export function showHud(show) {
  byId('hud').style.display = show ? 'flex' : 'none';
}
