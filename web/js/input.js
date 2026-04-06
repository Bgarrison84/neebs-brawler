// Gamepad button mapping (Xbox layout)
// 0=A(jump) 1=B(kick) 2=X(punch) 3=Y(grab) 4=LB(super) 5=RB
// Axes: 0=leftX 1=leftY
const GP_MAP = {
  0: 'Space',   // A → jump
  1: 'KeyX',    // B → kick
  2: 'KeyZ',    // X → punch
  3: 'KeyC',    // Y → grab
  4: 'KeyV',    // LB → super
};
const GP_AXIS_DEAD = 0.25;

export class InputManager {
  constructor() {
    this.keys        = {};
    this.justPressed = {};
    this._buffer     = [];
    this.BUFFER_MS   = 220;
    this._gpPrev     = {}; // previous gamepad button states

    window.addEventListener('keydown', e => this._onDown(e));
    window.addEventListener('keyup',   e => this._onUp(e));
  }

  // Call once per frame to sync gamepad state
  _pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp   = pads[0];
    if (!gp) return;

    // Buttons
    gp.buttons.forEach((btn, i) => {
      const code = GP_MAP[i];
      if (!code) return;
      const pressed = btn.pressed;
      if (pressed && !this._gpPrev[i]) {
        this._onDown({ code, preventDefault: () => {} });
      } else if (!pressed && this._gpPrev[i]) {
        this._onUp({ code });
      }
      this._gpPrev[i] = pressed;
    });

    // Left stick → synthesize key state (not buffered, held)
    const ax = gp.axes[0] ?? 0;
    const ay = gp.axes[1] ?? 0;
    this.keys['ArrowLeft']  = ax < -GP_AXIS_DEAD;
    this.keys['ArrowRight'] = ax >  GP_AXIS_DEAD;
    this.keys['ArrowUp']    = ay < -GP_AXIS_DEAD;
    this.keys['ArrowDown']  = ay >  GP_AXIS_DEAD;
  }

  _onDown(e) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!this.keys[e.code]) {
      this.justPressed[e.code] = true;
      if (['KeyZ','KeyX','KeyC','Space','KeyV'].includes(e.code)) {
        this._buffer.push({ code: e.code, t: performance.now() });
      }
    }
    this.keys[e.code] = true;
  }

  _onUp(e) { this.keys[e.code] = false; }

  // Returns true and consumes one buffered press of `code`
  consume(code) {
    const now = performance.now();
    this._buffer = this._buffer.filter(b => now - b.t < this.BUFFER_MS);
    const idx = this._buffer.findIndex(b => b.code === code);
    if (idx >= 0) { this._buffer.splice(idx, 1); return true; }
    return false;
  }

  isDown(code) { return !!this.keys[code]; }
  wasPressed(code) { return !!this.justPressed[code]; }

  movement() {
    const right = (this.isDown('KeyD') || this.isDown('ArrowRight')) ? 1 : 0;
    const left  = (this.isDown('KeyA') || this.isDown('ArrowLeft'))  ? 1 : 0;
    const down  = (this.isDown('KeyS') || this.isDown('ArrowDown'))  ? 1 : 0;
    const up    = (this.isDown('KeyW') || this.isDown('ArrowUp'))    ? 1 : 0;
    return { x: right - left, y: down - up };
  }

  clearFrame() {
    this._pollGamepad();
    this.justPressed = {};
  }
}
