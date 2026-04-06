import { drawGoon, drawHeavyGoon, drawKnifeThrower, drawBiker } from '../sprites/sprites.js';

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
  knife: {
    maxHp: 30, speed: 1.0, attackDamage: 10,
    attackRange: 260, aggroRange: 350, // ranged — keeps distance
    attackReach: 8, attackHeight: 8, attackYOff: 30, // tiny melee box (backup)
    hitW: 20, hitH: 55,
    score: 150,
    ranged: true, // flag for AI to use projectile attack
    preferredDist: 200, // tries to stay this far from player
    draw: (ctx, x, gy, facing, state, t, z, hp, maxHp) =>
      drawKnifeThrower(ctx, x, gy, facing, state, t, z, hp, maxHp),
  },
  biker: {
    maxHp: 70, speed: 2.8, attackDamage: 18,
    attackRange: 80, aggroRange: 400,
    attackReach: 80, attackHeight: 32, attackYOff: 36,
    hitW: 28, hitH: 68,
    score: 200,
    chargeEnemy: true, // flag for charge-state AI
    draw: (ctx, x, gy, facing, state, t, z, hp, maxHp) =>
      drawBiker(ctx, x, gy, facing, state, t, z, hp, maxHp),
  },
};

// ─── States ──────────────────────────────────────────────────────────────────
// idle → patrol → chase → attack → hurt/knockback → back to chase

// ─── Knife Projectile ────────────────────────────────────────────────────────
import { drawKnife } from '../sprites/sprites.js';

export class Knife {
  constructor(x, y, targetX, targetY, damage) {
    this.x = x; this.y = y;
    const dx = targetX - x, dy = targetY - y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    this.vx = (dx / dist) * 5;
    this.vy = (dy / dist) * 2.5;
    this.angle = Math.atan2(dy, dx);
    this.damage = damage;
    this.dead = false;
    this.life = 120; // auto-expire
    this.hitW = 16; this.hitH = 8;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.angle += 0.25;
    this.life--;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx, toScreen) {
    if (this.dead) return;
    const { sx, sy } = toScreen(this.x, this.y);
    drawKnife(ctx, sx, sy, this.angle);
  }
}

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

    // Knife thrower
    this.ranged       = !!ENEMY_TYPES[type].ranged;
    this.preferredDist = ENEMY_TYPES[type].preferredDist ?? 0;
    this.onThrowKnife = null; // set by game: fn(x, y, tx, ty, dmg)

    // Biker charge
    this.chargeEnemy  = !!ENEMY_TYPES[type].chargeEnemy;
    this.chargeVx     = 0;
    this.isCharging   = false;
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

        if (this.ranged) {
          // Knife thrower: maintain preferred distance
          if (dist < this.preferredDist - 30) {
            // Back away
            this.x -= (dx / dist) * this.speed * 0.6;
            this.y -= (dy / dist) * this.speed * 0.4;
          } else if (dist > this.preferredDist + 40) {
            this.x += (dx / dist) * this.speed * 0.5;
            this.y += (dy / dist) * this.speed * 0.3;
          }
          if (this.attackCooldown <= 0 && dist < this.attackRange) {
            this._setState('attack', 35);
            this.attackActive = false;
            this._hitPlayerThisSwing = false;
          } else {
            this._setState('chase', 1);
          }
        } else if (this.chargeEnemy) {
          // Biker: close in fast, then charge
          if (dist > this.attackRange) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed * 0.7;
            this._setState('chase', 1);
            this.isCharging = false;
          } else if (this.attackCooldown <= 0) {
            // Wind-up charge
            this._setState('attack', 40);
            this.chargeVx  = this.facing * 8;
            this.isCharging = false;
            this.attackActive = false;
            this._hitPlayerThisSwing = false;
          }
        } else {
          // Standard melee
          if (dist > this.attackRange) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed * 0.7;
            this._setState('chase', 1);
          } else if (this.attackCooldown <= 0) {
            this._setState('attack', 30);
            this.attackActive = false;
            this._hitPlayerThisSwing = false;
          }
        }
        break;
      }

      case 'attack':
        if (this.ranged) {
          // Throw knife at frame 20 (stateTimer hits 15)
          if (this.stateTimer === 15 && this.onThrowKnife) {
            this.onThrowKnife(this.x, this.y, player.x, player.y, this.attackDamage);
          }
          this.attackActive = false;
          if (this.stateTimer <= 0) {
            this.attackCooldown = 90 + Math.random() * 60;
            this._setState('chase', 1);
          }
        } else if (this.chargeEnemy) {
          // Charge phase: frames 25-35 = active dash
          if (this.stateTimer <= 25 && this.stateTimer >= 10) {
            this.x += this.chargeVx;
            this.attackActive = true;
            this.isCharging = true;
          } else {
            this.attackActive = false;
            this.isCharging = false;
          }
          if (this.stateTimer <= 0) {
            this.chargeVx = 0;
            this.isCharging = false;
            this.attackCooldown = 80 + Math.random() * 60;
            this._hitPlayerThisSwing = false;
            this._setState('chase', 1);
          }
        } else {
          // Standard melee attack window frames 10-20
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
