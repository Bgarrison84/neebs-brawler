import { randomHitWord } from '../sprites/sprites.js';

// ─── Particle & FX System ───────────────────────────────────────────────────

export class FxSystem {
  constructor() {
    this.particles = [];
    this.texts     = [];
    this.shake     = { x: 0, y: 0, dur: 0, strength: 0 };
  }

  // Screen shake
  addShake(strength, dur = 12) {
    if (strength > this.shake.strength) {
      this.shake.strength = strength;
      this.shake.dur = dur;
    }
  }

  // Hit spark burst
  addHitSpark(x, y, color = '#FFD700', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 2 + Math.random() * 4;
      this.particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 2,
        life: 1, maxLife: 0.6 + Math.random() * 0.4,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  // Prop break particles
  addBreakParticles(x, y, color1, color2, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI - Math.random() * Math.PI; // upward arc
      const spd   = 3 + Math.random() * 5;
      this.particles.push({
        type: 'chunk',
        x: x + (Math.random() - 0.5) * 20,
        y: y - Math.random() * 20,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.3,
        life: 1, maxLife: 0.8 + Math.random() * 0.6,
        color: Math.random() > 0.5 ? color1 : color2,
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  // Drop pickup flash
  addPickupFlash(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const spd   = 2 + Math.random() * 3;
      this.particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 3,
        life: 1, maxLife: 0.5,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  // Enemy death burst
  addDeathBurst(x, y) {
    this.addShake(6, 10);
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 2 + Math.random() * 6;
      this.particles.push({
        type: 'chunk',
        x: x + (Math.random() - 0.5) * 10,
        y: y - 40 - Math.random() * 20,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 3,
        gravity: 0.25,
        life: 1, maxLife: 1.0,
        color: Math.random() > 0.5 ? '#FF3333' : '#FF8800',
        size: 5 + Math.random() * 8,
        rot: 0, rotV: (Math.random() - 0.5) * 0.4,
      });
    }
  }

  // Floating hit text
  addHitText(x, y, text = null, color = '#FFD700', scale = 1) {
    this.texts.push({
      x, y,
      text: text || randomHitWord(),
      color,
      life: 1,
      vy: -1.5,
      scale,
    });
  }

  // Damage number
  addDamageNum(x, y, dmg) {
    this.texts.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      text: `-${dmg}`,
      color: '#FF4444',
      life: 1,
      vy: -2,
      scale: 0.8,
    });
  }

  // Buff gained text
  addBuffText(x, y, name) {
    this.texts.push({
      x, y,
      text: `+${name}!`,
      color: '#00FFAA',
      life: 1,
      vy: -2,
      scale: 1.1,
    });
  }

  update(dt) {
    const DECAY = dt * 60; // normalize to 60fps

    // Shake
    if (this.shake.dur > 0) {
      this.shake.dur -= DECAY;
      const s = this.shake.strength * (this.shake.dur / 12);
      this.shake.x = (Math.random() - 0.5) * s;
      this.shake.y = (Math.random() - 0.5) * s;
      if (this.shake.dur <= 0) { this.shake.x = 0; this.shake.y = 0; }
    }

    // Particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.vx *= 0.92;
      p.life -= dt / p.maxLife;
      if (p.rot !== undefined) p.rot += p.rotV;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    // Texts
    for (const t of this.texts) {
      t.y += t.vy;
      t.vy *= 0.94;
      t.life -= dt * 1.2;
    }
    this.texts = this.texts.filter(t => t.life > 0);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.shake.x, this.shake.y);

    // Particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.rot !== undefined) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Hit texts
    for (const t of this.texts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.life * 2);
      ctx.font = `bold ${Math.floor(18 * t.scale)}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
