// The three tide-pool levels of Shadowtide. Each level is plain data: walls
// (solid rock rectangles), reed beds and shadow pools (hiding places), the
// three moon keys, the exit gate, the mouse's start, and every lantern
// crab's patrol route with a pause at each waypoint. Difficulty rises with
// the level: more guards, longer routes, wider and longer vision cones.
//
// Coordinates live in the 960 x 640 playfield. Nothing here moves; the
// runtime copies this data into live state when a level starts.

export const FIELD_WIDTH = 960;
export const FIELD_HEIGHT = 640;

export const LEVEL_DEFS = [
  {
    name: 'Low Tide',
    number: 1,
    seed: 101,
    par: 150,
    hint: 'The crabs walk the same loop every time. Watch one full loop, then move.',
    playerStart: { x: 80, y: 560 },
    exit: { x: 872, y: 36, w: 52, h: 52 },
    keys: [
      { x: 480, y: 118 },
      { x: 150, y: 196 },
      { x: 806, y: 486 },
    ],
    walls: [
      { x: 300, y: 0, w: 40, h: 180 },
      { x: 300, y: 300, w: 40, h: 200 },
      { x: 620, y: 140, w: 40, h: 220 },
      { x: 620, y: 470, w: 180, h: 40 },
      { x: 120, y: 380, w: 160, h: 40 },
    ],
    reeds: [
      { x: 200, y: 480, r: 38 },
      { x: 480, y: 330, r: 38 },
      { x: 762, y: 200, r: 38 },
      { x: 556, y: 548, r: 36 },
    ],
    shadows: [
      { x: 430, y: 92, rx: 96, ry: 42 },
      { x: 856, y: 360, rx: 72, ry: 52 },
    ],
    pools: [
      { x: 120, y: 110, rx: 86, ry: 46 },
      { x: 700, y: 590, rx: 90, ry: 36 },
    ],
    guards: [
      {
        waypoints: [
          { x: 470, y: 180 },
          { x: 470, y: 420 },
          { x: 700, y: 420 },
          { x: 700, y: 180 },
        ],
        pause: 1.4,
        speed: 52,
        coneRange: 168,
        coneHalfAngle: 0.58,
      },
      {
        waypoints: [
          { x: 180, y: 120 },
          { x: 180, y: 320 },
          { x: 380, y: 320 },
        ],
        pause: 1.6,
        speed: 46,
        coneRange: 158,
        coneHalfAngle: 0.55,
      },
      {
        waypoints: [
          { x: 760, y: 520 },
          { x: 886, y: 520 },
          { x: 886, y: 300 },
        ],
        pause: 1.0,
        speed: 50,
        coneRange: 162,
        coneHalfAngle: 0.56,
      },
    ],
  },
  {
    name: 'Half Moon',
    number: 2,
    seed: 202,
    par: 210,
    hint: 'Two cones cross the middle pool. Cross only when both turn away.',
    playerStart: { x: 76, y: 566 },
    exit: { x: 872, y: 36, w: 52, h: 52 },
    keys: [
      { x: 250, y: 110 },
      { x: 700, y: 120 },
      { x: 480, y: 500 },
    ],
    walls: [
      { x: 200, y: 0, w: 40, h: 150 },
      { x: 200, y: 260, w: 40, h: 220 },
      { x: 470, y: 90, w: 40, h: 190 },
      { x: 470, y: 400, w: 40, h: 170 },
      { x: 720, y: 200, w: 40, h: 200 },
      { x: 80, y: 460, w: 200, h: 40 },
      { x: 640, y: 520, w: 200, h: 40 },
    ],
    reeds: [
      { x: 120, y: 300, r: 38 },
      { x: 350, y: 120, r: 36 },
      { x: 590, y: 300, r: 40 },
      { x: 830, y: 430, r: 38 },
      { x: 350, y: 550, r: 36 },
    ],
    shadows: [
      { x: 610, y: 110, rx: 88, ry: 40 },
      { x: 130, y: 560, rx: 80, ry: 40 },
      { x: 830, y: 130, rx: 66, ry: 44 },
    ],
    pools: [
      { x: 360, y: 330, rx: 90, ry: 50 },
      { x: 830, y: 560, rx: 80, ry: 34 },
    ],
    guards: [
      {
        waypoints: [
          { x: 330, y: 190 },
          { x: 330, y: 460 },
          { x: 580, y: 460 },
          { x: 580, y: 190 },
        ],
        pause: 1.2,
        speed: 60,
        coneRange: 182,
        coneHalfAngle: 0.62,
      },
      {
        waypoints: [
          { x: 120, y: 140 },
          { x: 120, y: 400 },
          { x: 120, y: 140 },
        ],
        pause: 1.8,
        speed: 54,
        coneRange: 172,
        coneHalfAngle: 0.6,
      },
      {
        waypoints: [
          { x: 820, y: 180 },
          { x: 820, y: 500 },
          { x: 640, y: 500 },
        ],
        pause: 1.1,
        speed: 62,
        coneRange: 180,
        coneHalfAngle: 0.62,
      },
      {
        waypoints: [
          { x: 480, y: 580 },
          { x: 700, y: 580 },
          { x: 700, y: 420 },
          { x: 480, y: 420 },
        ],
        pause: 1.0,
        speed: 58,
        coneRange: 176,
        coneHalfAngle: 0.6,
      },
    ],
  },
  {
    name: 'High Tide',
    number: 3,
    seed: 303,
    par: 280,
    hint: 'Five crabs, crossing cones, one long reed run. Patience wins.',
    playerStart: { x: 76, y: 566 },
    exit: { x: 872, y: 36, w: 52, h: 52 },
    keys: [
      { x: 180, y: 96 },
      { x: 480, y: 90 },
      { x: 800, y: 540 },
    ],
    walls: [
      { x: 150, y: 0, w: 40, h: 140 },
      { x: 150, y: 250, w: 40, h: 200 },
      { x: 380, y: 120, w: 40, h: 200 },
      { x: 380, y: 430, w: 40, h: 150 },
      { x: 600, y: 0, w: 40, h: 150 },
      { x: 600, y: 260, w: 40, h: 200 },
      { x: 800, y: 120, w: 40, h: 200 },
      { x: 60, y: 440, w: 180, h: 40 },
      { x: 700, y: 470, w: 180, h: 40 },
    ],
    reeds: [
      { x: 110, y: 240, r: 38 },
      { x: 270, y: 120, r: 36 },
      { x: 490, y: 260, r: 40 },
      { x: 720, y: 200, r: 36 },
      { x: 270, y: 520, r: 38 },
      { x: 490, y: 540, r: 36 },
    ],
    shadows: [
      { x: 480, y: 330, rx: 90, ry: 44 },
      { x: 880, y: 330, rx: 60, ry: 48 },
      { x: 110, y: 560, rx: 76, ry: 38 },
    ],
    pools: [
      { x: 270, y: 330, rx: 80, ry: 46 },
      { x: 700, y: 80, rx: 84, ry: 36 },
    ],
    guards: [
      {
        waypoints: [
          { x: 265, y: 180 },
          { x: 265, y: 480 },
          { x: 490, y: 480 },
          { x: 490, y: 180 },
        ],
        pause: 1.0,
        speed: 70,
        coneRange: 196,
        coneHalfAngle: 0.66,
      },
      {
        waypoints: [
          { x: 90, y: 110 },
          { x: 90, y: 380 },
          { x: 90, y: 110 },
        ],
        pause: 1.6,
        speed: 64,
        coneRange: 188,
        coneHalfAngle: 0.64,
      },
      {
        waypoints: [
          { x: 700, y: 160 },
          { x: 700, y: 420 },
          { x: 880, y: 420 },
          { x: 880, y: 160 },
        ],
        pause: 0.9,
        speed: 72,
        coneRange: 198,
        coneHalfAngle: 0.67,
      },
      {
        waypoints: [
          { x: 540, y: 560 },
          { x: 760, y: 560 },
          { x: 760, y: 420 },
          { x: 540, y: 420 },
        ],
        pause: 1.1,
        speed: 66,
        coneRange: 190,
        coneHalfAngle: 0.65,
      },
      {
        waypoints: [
          { x: 480, y: 340 },
          { x: 640, y: 340 },
          { x: 640, y: 220 },
          { x: 480, y: 220 },
        ],
        pause: 1.3,
        speed: 62,
        coneRange: 186,
        coneHalfAngle: 0.64,
      },
    ],
  },
];

/** Total guards across all levels (12) and total hiding spots (15 reeds). */
export const TOTAL_GUARDS = LEVEL_DEFS.reduce((sum, level) => sum + level.guards.length, 0);
export const TOTAL_REEDS = LEVEL_DEFS.reduce((sum, level) => sum + level.reeds.length, 0);

/** Deep-copy one level definition into fresh runtime state. */
export function buildLevel(index) {
  const def = LEVEL_DEFS[index];
  return {
    def,
    index,
    walls: def.walls.map((w) => ({ ...w })),
    reeds: def.reeds.map((r) => ({ ...r })),
    shadows: def.shadows.map((s) => ({ ...s })),
    pools: def.pools.map((p) => ({ ...p })),
    keys: def.keys.map((k) => ({ x: k.x, y: k.y, taken: false, bob: 0 })),
    exit: { ...def.exit, open: false },
    playerStart: { ...def.playerStart },
  };
}
