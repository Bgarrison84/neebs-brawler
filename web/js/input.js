export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._buffer = [];
    this.BUFFER_MS = 220;

    window.addEventListener('keydown', e => this._onDown(e));
    window.addEventListener('keyup',   e => this._onUp(e));
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

  clearFrame() { this.justPressed = {}; }
}
