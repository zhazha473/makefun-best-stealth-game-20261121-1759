// Keyboard and mouse input for Shadowtide. WASD or arrows move, Shift
// sneaks, Space runs, E is unused (keys are picked up by touch), H spends
// the level's one hint, R restarts the level, 1-3 pick a level, M mutes,
// P or Escape pauses. Clicking the playfield sets a walk target.

export function makeInput() {
  return {
    keys: { up: false, down: false, left: false, right: false, sneak: false, run: false },
    pressed: new Set(),
    click: null, // {x, y} in canvas pixels, consumed by the game loop
    clickScreen: null, // {x, y} in page pixels, for menu buttons
  };
}

const KEY_MAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
  Space: 'run',
};

/** Wire keyboard listeners onto the window; returns a cleanup function. */
export function attachKeyboard(input, onAction) {
  function down(event) {
    const mapped = KEY_MAP[event.code];
    if (mapped) {
      input.keys[mapped] = true;
      event.preventDefault();
    }
    if (!event.repeat) {
      input.pressed.add(event.code);
      onAction(event.code);
    }
  }
  function up(event) {
    const mapped = KEY_MAP[event.code];
    if (mapped) input.keys[mapped] = false;
  }
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}

/** Wire a click listener onto the canvas; stores the point in canvas pixels. */
export function attachMouse(input, canvas) {
  function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    input.clickScreen = { x: event.clientX, y: event.clientY };
  }
  canvas.addEventListener('click', onClick);
  return () => canvas.removeEventListener('click', onClick);
}
