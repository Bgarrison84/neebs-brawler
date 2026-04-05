import { drawNeebs } from '../sprites/sprites.js';

// ─── Attack definitions ───────────────────────────────────────────────────────
//  type: 'light' | 'heavy' | 'grab'
//  frames: total frames the state lasts
//  activeStart / activeEnd: hitbox live window
//  damage: base damage
//  reach / height / yOff: attack box geometry

const ATTACKS = {
  punch1: { type:'light',  frames:14, activeStart:4,  activeEnd:9,  damage:10, reach:56, height:26, yOff:28 },
  punch2: { type:'light',  frames:14, activeStart:4,  activeEnd:9,  damage:12, reach:58, height:28, yOff:32 },
  punch3: { type:'heavy',  frames:20, activeStart:6,  activeEnd:14, damage:22, reach:64, height:32, yOff:30 },
  kick1:  { type:'light',  frames:16, activeStart:5,  activeEnd:10, damage:14, reach:68, height:30, yOff:36 },
  kick2:  { type:'heavy',  frames:22, activeStart:7,  activeEnd:15, damage:24, reach:72, height:36, yOff:40 },
  jumpAtk:{ type:'light',  frames:18, activeStart:3,  activeEnd:12, damage:18, reach:60, height:40, yOff:20 },
};

// ─── Buffs ────────────────────────────────────────────────────────────────────
const BUFF_DUR = 300; // frames

export class Player {
  constructor(x, y) {
    this.x       = x;
    this.y       = y;
    this.z       = 0;      // jump height
    this.vx      = 0;
    this.vy      = 0;
    this.vz      = 0;
    this.facing  = 1;
    this.hp      = 100;
    this.maxHp   = 100;
    this.score   = 0;

    // State machine
    this.state      = 'idle';
    this.stateTimer = 0;
    this.animT      = 0;

    // Combo tracking
    this.comboCount    = 0;   // consecutive hits
    this.comboTimer    = 0;   // frames until combo resets
    this.punchStep     = 0;   // 0,1,2 → punch1,punch2,punch3
    this.kickStep      = 0;   // 0,1   → kick1,kick2
    this._atkDef       = null; // current attack definition

    // Combat
    this.invFrames      = 0;
    this._hitThisSwing  = false;
    this.attackReach    = 56;
    this.attackHeight   = 26;
    this.attackYOff     = 28;
    this.hitW           = 28;
    this.hitH           = 72;

    // Buffs: {speed, power} each = frames remaining
    this.buffs = { speed: 0, power: 0 };

    // Jump
    this.onGround = true;
    this.JUMP_FORCE = 10;
    this.GRAVITY    = 0.55;
  }

  get speed()      { return this.buffs.speed > 0 ? 3.6 : 2.4; }
  get powerMult()  { return this.buffs.power > 0 ? 1.6 : 1.0; }

  isAttacking() {
    const a = ATTACKS[this.state];
    if (!a) return false;
    const frame = a.frames - this.stateTimer;
    return frame >= a.activeStart && frame <= a.activeEnd && !this._hitThisSwing;
  }

  isHeavyAttack() {
    return ATTACKS[this.state]?.type === 'heavy';
  }

  currentAttackDamage() {
    const base = ATTACKS[this.state]?.damage ?? 10;
    const combo = 1 + Math.min(this.comboCount * 0.05, 0.5); // up to +50% at 10 hits
    return Math.round(base * this.powerMult * combo);
  }

  applyBuff(type) {
    this.buffs[type] = BUFF_DUR;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  update(input, bounds) {
    if (this.hp <= 0) { this.state = 'dead'; return; }

    // Tick timers
    if (this.stateTimer  > 0) this.stateTimer--;
    if (this.invFrames   > 0) this.invFrames--;
    if (this.comboTimer  > 0) this.comboTimer--;
    else this.comboCount = 0;
    for (const k of Object.keys(this.buffs)) {
      if (this.buffs[k] > 0) this.buffs[k]--;
    }
    this.animT += 0.07;

    // Mark swing done when active window passes
    if (this.state in ATTACKS) {
      const a = ATTACKS[this.state];
      const frame = a.frames - this.stateTimer;
      if (frame > a.activeEnd) this._hitThisSwing = true;
      // Update attack geometry from current attack
      this.attackReach  = a.reach;
      this.attackHeight = a.height;
      this.attackYOff   = a.yOff;
    }

    // State machine
    switch (this.state) {
      case 'idle':
      case 'walk':
        this._handleMovement(input, bounds);
        this._handleAttackInput(input);
        this._handleJumpInput(input);
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
        // Can't act, just wait
        if (this.stateTimer <= 0) this.state = 'idle';
        // Apply knockback velocity
        this.x += this.vx; this.vx *= 0.8;
        this.y += this.vy; this.vy *= 0.8;
        break;

      default: // punch1,2,3,kick1,2
        if (this.stateTimer <= 0) {
          this.state = 'idle';
        } else {
          // Can buffer next attack during recovery
          this._handleAttackInput(input);
        }
        break;
    }

    // Jump physics
    this._updateJump(bounds);
    this._clampBounds(bounds);
  }

  _handleMovement(input, bounds) {
    const m = input.movement();
    if (m.x !== 0 || m.y !== 0) {
      const len = Math.hypot(m.x, m.y);
      this.x += (m.x / len) * this.speed;
      this.y += (m.y / len) * this.speed * 0.6; // depth movement is slower
      this.facing = m.x !== 0 ? Math.sign(m.x) : this.facing;
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }
  }

  _handleAirMovement(input, bounds) {
    const m = input.movement();
    if (m.x !== 0) {
      this.x += m.x * this.speed * 0.8;
      this.facing = Math.sign(m.x);
    }
    if (m.y !== 0) {
      this.y += m.y * this.speed * 0.5;
    }
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
      (this.state in ATTACKS && this.stateTimer < 6);

    if (input.consume('KeyZ') && canAttack) {
      this.punchStep = (this.punchStep + 1) % 3;
      const atk = ['punch1','punch2','punch3'][this.punchStep];
      this._startAttack(atk);
    } else if (input.consume('KeyX') && canAttack) {
      this.kickStep = (this.kickStep + 1) % 2;
      const atk = ['kick1','kick2'][this.kickStep];
      this._startAttack(atk);
    } else if (input.consume('KeyC') && canAttack) {
      // Grab - strong single hit, no heavy flag (but high damage)
      this._startAttack('punch3'); // use punch3 hitbox for now
    }
  }

  _startAttack(name) {
    const def = ATTACKS[name];
    this.state      = name;
    this.stateTimer = def.frames;
    this._hitThisSwing = false;
    this.comboTimer = 45;
    this.comboCount++;
  }

  _updateJump(bounds) {
    if (!this.onGround) {
      this.z += this.vz;
      this.vz -= this.GRAVITY;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
        this.onGround = true;
        if (this.state === 'jump' || this.state === 'jumpAtk') {
          this.state = 'idle';
        }
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

    // Draw buffs aura
    if (this.buffs.speed > 0) {
      ctx.save();
      ctx.globalAlpha = 0.2 + Math.sin(this.animT * 5) * 0.1;
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 40, 28, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (this.buffs.power > 0) {
      ctx.save();
      ctx.globalAlpha = 0.2 + Math.sin(this.animT * 5) * 0.1;
      ctx.strokeStyle = '#FF8800';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 40, 28, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Map game state to sprite state
    let spriteState = this.state;
    if (this.state === 'walk') spriteState = 'walk';
    else if (this.state === 'idle') spriteState = 'idle';

    drawNeebs(ctx, sx, sy, this.facing, spriteState, this.animT, this.z);
  }
}
