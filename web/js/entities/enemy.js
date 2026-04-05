import { drawGoon, drawHeavyGoon } from '../sprites/sprites.js';

// ─── Enemy ───────────────────────────────────────────────────────────────────

const ENEMY_TYPES = {
  goon: {
    maxHp: 45, speed: 1.4, attackDamage: 8,
    attackRange: 58, aggroRange: 300,
    attackReach: 58, attackHeight: 28, attackYOff: 28,
    hitW: 24, hitH: 60,
    score: 100,
    draw: (ctx, x, gy, facing, state, t, z, hp, maxHp) =>
      drawGoon(ctx, x, gy, facing, state, t, z, hp, maxHp),
  },
  heavy: {
    maxHp: 100, speed: 0.85, attackDamage: 16,
    attackRange: 64, aggroRange: 250,
    attackReach: 64, attackHeight: 36, attackYOff: 36,
    hitW: 36, hitH: 80,
    score: 250,
    draw: (ctx, x, gy, facing, state, t, z, hp, maxHp) =>
      drawHeavyGoon(ctx, x, gy, facing, state, t, z, hp, maxHp),
  },
};

// ─── States ──────────────────────────────────────────────────────────────────
// idle → patrol → chase → attack → hurt/knockback → back to chase

let _eid = 0;

export class Enemy {
  constructor(type, x, y) {
    this.id   = _eid++;
    this.type = type;
    const def = ENEMY_TYPES[type];

    this.x          = x;
    this.y          = y;
    this.z          = 0;   // jump height (knockback air)
    this.vx         = 0;
    this.vy         = 0;
    this.vz         = 0;
    this.facing     = -1;  // start facing left (toward center)
    this.hp         = def.maxHp;
    this.maxHp      = def.maxHp;
    this.speed      = def.speed;
    this.attackDamage = def.attackDamage;
    this.attackRange  = def.attackRange;
    this.aggroRange   = def.aggroRange;
    this.attackReach  = def.attackReach;
    this.attackHeight = def.attackHeight;
    this.attackYOff   = def.attackYOff;
    this.hitW         = def.hitW;
    this.hitH         = def.hitH;
    this.score        = def.score;
    this._draw        = def.draw;

    this.state       = 'idle';
    this.stateTimer  = 30 + Math.random() * 60;
    this.invFrames   = 0;
    this.animT       = 0;
    this.attackCooldown = 0;
    this.attackActive   = false;
    this._hitPlayerThisSwing = false;
    this._hitThisSwing = false;
    this.dead        = false;
    this.dyingT      = 0;
    this.patrolDir   = Math.random() > 0.5 ? 1 : -1;
    this.patrolTimer = 0;
  }

  distTo(player) {
    return Math.hypot(this.x - player.x, this.y - player.y);
  }

  update(player, allEnemies, bounds) {
    if (this.dead) return;

    // Tick invincibility
    if (this.invFrames > 0) this.invFrames--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    this.animT += 0.06;

    // Apply velocity (for knockback)
    if (this.vx !== 0 || this.vy !== 0) {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.82;
      this.vy *= 0.82;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      if (Math.abs(this.vy) < 0.1) this.vy = 0;
    }

    // Jump physics (knocked into air)
    if (this.z > 0 || this.vz > 0) {
      this.z += this.vz;
      this.vz -= 0.5;
      if (this.z <= 0) { this.z = 0; this.vz = 0; }
    }

    this._clampBounds(bounds);
    this._runState(player, allEnemies);
    this._separateFromEnemies(allEnemies);
  }

  _clampBounds(b) {
    if (this.x < b.xMin) this.x = b.xMin;
    if (this.x > b.xMax) this.x = b.xMax;
    if (this.y < b.yMin) this.y = b.yMin;
    if (this.y > b.yMax) this.y = b.yMax;
  }

  _separateFromEnemies(others) {
    for (const o of others) {
      if (o === this || o.dead) continue;
      const dx = this.x - o.x, dy = this.y - o.y;
      const dist = Math.hypot(dx, dy);
      const minDist = 30;
      if (dist < minDist && dist > 0) {
        const push = (minDist - dist) * 0.25;
        this.x += (dx / dist) * push;
        this.y += (dy / dist) * push;
      }
    }
  }

  _runState(player, allEnemies) {
    this.stateTimer--;

    switch (this.state) {
      case 'idle':
        if (this.stateTimer <= 0) this._setState('patrol', 90 + Math.random() * 90);
        this._checkAggro(player);
        break;

      case 'patrol':
        if (this.stateTimer <= 0) this._setState('idle', 40 + Math.random() * 40);
        this._checkAggro(player);
        this.patrolTimer--;
        if (this.patrolTimer <= 0) {
          this.patrolDir = -this.patrolDir;
          this.patrolTimer = 40 + Math.random() * 40;
        }
        this.x += this.patrolDir * this.speed * 0.5;
        this.facing = this.patrolDir;
        break;

      case 'chase': {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        this.facing = dx > 0 ? 1 : -1;

        if (dist > this.attackRange) {
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed * 0.7;
          this._setState('chase', 1); // stay in chase
        } else if (this.attackCooldown <= 0) {
          this._setState('attack', 30);
          this.attackActive = false;
          this._hitPlayerThisSwing = false;
        }
        break;
      }

      case 'attack':
        // Active hitbox window in middle of swing (frames 10-20)
        if (this.stateTimer <= 20 && this.stateTimer >= 10) {
          this.attackActive = true;
        } else {
          this.attackActive = false;
        }
        if (this.stateTimer <= 0) {
          this.attackCooldown = 60 + Math.random() * 40;
          this._hitPlayerThisSwing = false;
          this._setState('chase', 1);
        }
        break;

      case 'hurt':
        if (this.stateTimer <= 0) this._setState('chase', 1);
        break;

      case 'knockback':
        if (this.stateTimer <= 0 && this.z <= 0) this._setState('chase', 1);
        break;

      case 'die':
        this.dyingT++;
        if (this.dyingT > 40) this.dead = true;
        break;
    }

    // Check if dead
    if (this.hp <= 0 && this.state !== 'die') {
      this._setState('die', 999);
    }
  }

  _checkAggro(player) {
    if (player.hp <= 0) return;
    if (this.distTo(player) < this.aggroRange) {
      this._setState('chase', 1);
    }
  }

  _setState(s, dur) {
    this.state = s;
    this.stateTimer = dur;
    if (s === 'attack') { this.attackActive = false; this._hitPlayerThisSwing = false; }
  }

  draw(ctx, toScreen) {
    if (this.dead) return;
    const { sx, sy } = toScreen(this.x, this.y);
    const t = this.animT;

    // State → animation label
    let animState = this.state;
    if (this.state === 'chase') animState = 'walk';

    this._draw(ctx, sx, sy, this.facing, animState, t, this.z, this.hp, this.maxHp);

    // Dying fade
    if (this.state === 'die') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - this.dyingT / 40);
      ctx.restore();
    }
  }
}
