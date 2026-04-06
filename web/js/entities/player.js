import { drawNeebs } from '../sprites/sprites.js';

// ─── Default attack definitions ───────────────────────────────────────────────
//  type: 'light' | 'heavy'
//  frames: total state duration  activeStart/activeEnd: hitbox live window
//  damage, reach, height, yOff: hitbox geometry
const DEFAULT_ATTACKS = {
  punch1: { type:'light',  frames:14, activeStart:4,  activeEnd:9,  damage:10, reach:56, height:26, yOff:28 },
  punch2: { type:'light',  frames:14, activeStart:4,  activeEnd:9,  damage:12, reach:58, height:28, yOff:32 },
  punch3: { type:'heavy',  frames:20, activeStart:6,  activeEnd:14, damage:22, reach:64, height:32, yOff:30 },
  kick1:  { type:'light',  frames:16, activeStart:5,  activeEnd:10, damage:14, reach:68, height:30, yOff:36 },
  kick2:  { type:'heavy',  frames:22, activeStart:7,  activeEnd:15, damage:24, reach:72, height:36, yOff:40 },
  jumpAtk:{ type:'light',  frames:18, activeStart:3,  activeEnd:12, damage:18, reach:60, height:40, yOff:20 },
};

const BUFF_DUR = 300; // frames

// Default charDef — Neebs, used if no charDef passed (backwards-compatible)
const NEEBS_DEF = {
  name: 'NEEBS', color: '#FF6B35',
  maxHp: 100, baseSpeed: 2.4, buffedSpeed: 3.6,
  basePowerMult: 1.0, jumpForce: 10,
  drawFn: drawNeebs,
};

export class Player {
  constructor(x, y, charDef = NEEBS_DEF) {
    this.charDef = charDef;
    this.attacks = charDef.attackOverrides
      ? { ...DEFAULT_ATTACKS, ...charDef.attackOverrides }
      : DEFAULT_ATTACKS;

    this.x       = x;
    this.y       = y;
    this.z       = 0;
    this.vx      = 0;
    this.vy      = 0;
    this.vz      = 0;
    this.facing  = 1;
    this.hp      = charDef.maxHp;
    this.maxHp   = charDef.maxHp;
    this.score   = 0;

    // State machine
    this.state      = 'idle';
    this.stateTimer = 0;
    this.animT      = 0;

    // Combo tracking
    this.comboCount    = 0;
    this.comboTimer    = 0;
    this.punchStep     = 0;
    this.kickStep      = 0;
    this._atkDef       = null;

    // Combat
    this.invFrames      = 0;
    this._hitThisSwing  = false;
    this.attackReach    = 56;
    this.attackHeight   = 26;
    this.attackYOff     = 28;
    this.hitW           = 28;
    this.hitH           = 72;

    this.buffs = { speed: 0, power: 0 };

    // Super meter
    this.superMeter    = 0;
    this.maxSuperMeter = 100;
    this.superFired    = false; // game reads + clears this to execute the super

    // Jump
    this.onGround  = true;
    this.JUMP_FORCE = charDef.jumpForce ?? 10;
    this.GRAVITY    = 0.55;
  }

  fillMeter(amount) {
    this.superMeter = Math.min(this.maxSuperMeter, this.superMeter + amount);
  }

  get speed()     { return this.buffs.speed > 0 ? this.charDef.buffedSpeed : this.charDef.baseSpeed; }
  get powerMult() { return this.buffs.power > 0 ? 1.6 : this.charDef.basePowerMult; }

  isAttacking() {
    const a = this.attacks[this.state];
    if (!a) return false;
    const frame = a.frames - this.stateTimer;
    return frame >= a.activeStart && frame <= a.activeEnd && !this._hitThisSwing;
  }

  isHeavyAttack() {
    return this.attacks[this.state]?.type === 'heavy';
  }

  currentAttackDamage() {
    const base  = this.attacks[this.state]?.damage ?? 10;
    const combo = 1 + Math.min(this.comboCount * 0.05, 0.5);
    return Math.round(base * this.powerMult * combo);
  }

  applyBuff(type) { this.buffs[type] = BUFF_DUR; }

  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }

  update(input, bounds) {
    if (this.hp <= 0) { this.state = 'dead'; return; }

    if (this.stateTimer  > 0) this.stateTimer--;
    if (this.invFrames   > 0) this.invFrames--;
    if (this.comboTimer  > 0) this.comboTimer--;
    else this.comboCount = 0;
    for (const k of Object.keys(this.buffs)) {
      if (this.buffs[k] > 0) this.buffs[k]--;
    }
    this.animT += 0.07;

    if (this.state in this.attacks) {
      const a = this.attacks[this.state];
      const frame = a.frames - this.stateTimer;
      if (frame > a.activeEnd) this._hitThisSwing = true;
      this.attackReach  = a.reach;
      this.attackHeight = a.height;
      this.attackYOff   = a.yOff;
    }

    switch (this.state) {
      case 'idle':
      case 'walk':
        this._handleMovement(input, bounds);
        this._handleAttackInput(input);
        this._handleJumpInput(input);
        this._handleSuperInput(input);
        break;

      case 'super':
        // Locked — fire effect at frame 20, then idle
        if (this.stateTimer === 55) this.superFired = true; // 75 - 20 = 55
        if (this.stateTimer <= 0)   this.state = 'idle';
        break;

      case 'jump':
        this._handleAirMovement(input, bounds);
        if (input.consume('KeyZ') || input.consume('KeyX')) {
          this._startAttack('jumpAtk');
        }
        break;

      case 'jumpAtk':
        this._handleAirMovement(input, bounds);
        if (this.stateTimer <= 0) {
          this.state = this.onGround ? 'idle' : 'jump';
        }
        break;

      case 'hurt':
      case 'knockback':
        if (this.stateTimer <= 0) this.state = 'idle';
        this.x += this.vx; this.vx *= 0.8;
        this.y += this.vy; this.vy *= 0.8;
        break;

      default:
        if (this.stateTimer <= 0) {
          this.state = 'idle';
        } else {
          this._handleAttackInput(input);
        }
        break;
    }

    this._updateJump(bounds);
    this._clampBounds(bounds);
  }

  _handleMovement(input, bounds) {
    const m = input.movement();
    if (m.x !== 0 || m.y !== 0) {
      const len = Math.hypot(m.x, m.y);
      this.x += (m.x / len) * this.speed;
      this.y += (m.y / len) * this.speed * 0.6;
      this.facing = m.x !== 0 ? Math.sign(m.x) : this.facing;
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }
  }

  _handleAirMovement(input, bounds) {
    const m = input.movement();
    if (m.x !== 0) { this.x += m.x * this.speed * 0.8; this.facing = Math.sign(m.x); }
    if (m.y !== 0) { this.y += m.y * this.speed * 0.5; }
  }

  _handleJumpInput(input) {
    if (input.consume('Space') && this.onGround) {
      this.vz = this.JUMP_FORCE;
      this.onGround = false;
      this.state = 'jump';
    }
  }

  _handleAttackInput(input) {
    const canAttack = this.state === 'idle' || this.state === 'walk' ||
      (this.state in this.attacks && this.stateTimer < 6);

    if (input.consume('KeyZ') && canAttack) {
      this.punchStep = (this.punchStep + 1) % 3;
      this._startAttack(['punch1','punch2','punch3'][this.punchStep]);
    } else if (input.consume('KeyX') && canAttack) {
      this.kickStep = (this.kickStep + 1) % 2;
      this._startAttack(['kick1','kick2'][this.kickStep]);
    } else if (input.consume('KeyC') && canAttack) {
      this._startAttack('punch3');
    }
  }

  _handleSuperInput(input) {
    if (input.consume('KeyV') && this.superMeter >= this.maxSuperMeter) {
      this.state      = 'super';
      this.stateTimer = 75;
      this.superMeter = 0;
      this.superFired = false;
      this.invFrames  = 75; // invincible during super
    }
  }

  _startAttack(name) {
    const def = this.attacks[name];
    this.state         = name;
    this.stateTimer    = def.frames;
    this._hitThisSwing = false;
    this.comboTimer    = 45;
    this.comboCount++;
  }

  _updateJump(bounds) {
    if (!this.onGround) {
      this.z  += this.vz;
      this.vz -= this.GRAVITY;
      if (this.z <= 0) {
        this.z = 0; this.vz = 0; this.onGround = true;
        if (this.state === 'jump' || this.state === 'jumpAtk') this.state = 'idle';
      }
    }
  }

  _clampBounds(b) {
    if (this.x < b.xMin) this.x = b.xMin;
    if (this.x > b.xMax) this.x = b.xMax;
    if (this.y < b.yMin) this.y = b.yMin;
    if (this.y > b.yMax) this.y = b.yMax;
  }

  draw(ctx, toScreen) {
    if (this.state === 'dead') return;
    const { sx, sy } = toScreen(this.x, this.y);

    // Buff auras
    for (const [buffKey, color] of [['speed','#00FFFF'],['power','#FF8800']]) {
      if (this.buffs[buffKey] > 0) {
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(this.animT * 5) * 0.1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(sx, sy - 40, 28, 50, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Super activation aura
    if (this.state === 'super') {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.animT * 12) * 0.2;
      ctx.strokeStyle = this.charDef.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 45, 34, 58, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = this.charDef.color;
      ctx.fill();
      ctx.restore();
    }

    this.charDef.drawFn(ctx, sx, sy, this.facing, this.state, this.animT, this.z);
  }
}
