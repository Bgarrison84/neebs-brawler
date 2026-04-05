import { drawTrashcan, drawBarrel, drawCrate } from '../sprites/sprites.js';

// ─── Prop types ──────────────────────────────────────────────────────────────
export const PROP_TYPES = {
  trashcan: {
    maxHp: 30, hitW: 24, hitH: 42,
    color1: '#2E7D32', color2: '#4CAF50',
    drop: () => Math.random() < 0.8 ? 'health' : 'speed',
    draw: drawTrashcan,
  },
  barrel: {
    maxHp: 50, hitW: 30, hitH: 48,
    color1: '#8B4513', color2: '#FFD700',
    drop: () => Math.random() < 0.5 ? 'health' : Math.random() < 0.5 ? 'speed' : 'power',
    draw: drawBarrel,
  },
  crate: {
    maxHp: 40, hitW: 36, hitH: 36,
    color1: '#8B7355', color2: '#5C4A2A',
    drop: () => Math.random() < 0.4 ? 'health' : Math.random() < 0.5 ? 'power' : 'speed',
    draw: drawCrate,
  },
};

export class Prop {
  constructor(type, x, y) {
    const def = PROP_TYPES[type];
    this.type   = type;
    this.x      = x;
    this.y      = y;   // world depth
    this.hp     = def.maxHp;
    this.maxHp  = def.maxHp;
    this.hitW   = def.hitW;
    this.hitH   = def.hitH;
    this.color1 = def.color1;
    this.color2 = def.color2;
    this.dropFn = def.drop;
    this._drawFn = def.draw;
    this.dead   = false;
    this.shakeT = 0;
    this._hitThisSwing = false;
  }

  getDrop() { return this.dropFn(); }

  update() {
    if (this.shakeT > 0) this.shakeT--;
  }

  draw(ctx, toScreen) {
    const { sx, sy } = toScreen(this.x, this.y);
    const ox = this.shakeT > 0 ? (Math.random() - 0.5) * 4 : 0;
    this._drawFn(ctx, sx + ox, sy, this.hp, this.maxHp);
  }
}

// ─── Drop item ───────────────────────────────────────────────────────────────
import { drawHealthDrop, drawSpeedDrop, drawPowerDrop } from '../sprites/sprites.js';

export const DROP_DEFS = {
  health: { color: '#FF3333', draw: drawHealthDrop, label: 'HEALTH' },
  speed:  { color: '#00FFFF', draw: drawSpeedDrop,  label: 'SPEED'  },
  power:  { color: '#FF8800', draw: drawPowerDrop,  label: 'POWER'  },
};

export class Drop {
  constructor(type, x, y) {
    this.type  = type;
    this.x     = x;
    this.y     = y;
    this.def   = DROP_DEFS[type];
    this.life  = 600; // frames before despawn
    this.bobT  = Math.random() * 100;
    this.dead  = false;
    this.hitW  = 28;
    this.hitH  = 28;
  }

  update() {
    this.bobT++;
    this.life--;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx, toScreen) {
    const { sx, sy } = toScreen(this.x, this.y);
    // Blink when about to despawn
    if (this.life < 120 && Math.floor(this.bobT / 6) % 2 === 0) return;
    this.def.draw(ctx, sx, sy, this.bobT);
  }
}
