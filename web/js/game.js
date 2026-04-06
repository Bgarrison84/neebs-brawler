import { drawBackground } from './sprites/sprites.js';
import { audio } from './systems/audio.js';
import { Player } from './entities/player.js';
import { Enemy, Knife }  from './entities/enemy.js';
import { Prop, Drop } from './entities/prop.js';
import { CombatSystem } from './systems/combat.js';
import { FxSystem }     from './systems/fx.js';

// ─── Arena coordinate space ───────────────────────────────────────────────────
// worldX: 50-750  worldY: 0-280 (depth)
// screenX = worldX  screenY = 200 + worldY * 1.18
const ARENA = {
  xMin: 60, xMax: 740,
  yMin: 0,  yMax: 280,
  screenTop: 200,
  depthScale: 1.18,
};

function toScreen(wx, wy) {
  return { sx: wx, sy: ARENA.screenTop + wy * ARENA.depthScale };
}


// Wave configs: array of {type, count, delay} spawn entries
const WAVES = [
  [{ type:'goon',  count:3, delay:60 }],
  [{ type:'goon',  count:4, delay:45 }, { type:'heavy', count:1, delay:120 }],
  [{ type:'goon',  count:3, delay:30 }, { type:'knife', count:2, delay:90  }],
  [{ type:'goon',  count:3, delay:30 }, { type:'heavy', count:2, delay:60  }, { type:'biker', count:1, delay:150 }],
  [{ type:'biker', count:2, delay:60 }, { type:'knife', count:2, delay:80  }, { type:'heavy', count:2, delay:120 }],
  [{ type:'goon',  count:4, delay:20 }, { type:'heavy', count:2, delay:50  }, { type:'knife', count:2, delay:100 }],
  [{ type:'biker', count:3, delay:40 }, { type:'knife', count:3, delay:70  }, { type:'heavy', count:2, delay:120 }],
];

const PROP_LAYOUT = [
  { type:'trashcan', x:110, y:60  }, { type:'barrel',   x:680, y:80  },
  { type:'crate',    x:150, y:180 }, { type:'trashcan', x:620, y:200 },
  { type:'barrel',   x:400, y:20  }, { type:'crate',    x:400, y:260 },
  { type:'trashcan', x:280, y:120 }, { type:'trashcan', x:520, y:140 },
  { type:'barrel',   x:700, y:240 }, { type:'crate',    x:100, y:250 },
];

export class Game {
  constructor(canvas, charDef) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.W       = canvas.width;
    this.H       = canvas.height;
    this.charDef = charDef; // selected character definition

    this.combat = new CombatSystem(this);
    this.fx     = new FxSystem();

    this.player  = new Player(400, 200, charDef);
    this.enemies = [];
    this.props   = [];
    this.drops   = [];
    this.knives  = [];

    this.waveIdx     = 0;
    this.waveSpawns  = [];  // pending spawns: {type, countdown}
    this.waveState   = 'playing'; // 'playing' | 'wave_clear' | 'game_over'
    this.waveClearT  = 0;

    this.totalScore      = 0;
    this.hitCount        = 0;
    this.frame           = 0;
    this.paused          = false;
    this._prevPlayerState = 'idle';

    this._toScreen = toScreen;

    this._bgCanvas   = document.createElement('canvas');
    this._bgCanvas.width  = this.W;
    this._bgCanvas.height = this.H;
    drawBackground(this._bgCanvas.getContext('2d'), this.W, this.H);

    this._spawnProps();
    this._loadWave(0);
  }

  _spawnProps() {
    this.props = PROP_LAYOUT.map(p => new Prop(p.type, p.x, p.y));
  }

  _loadWave(idx) {
    const wave = WAVES[idx % WAVES.length];
    let countdown = 30;
    for (const entry of wave) {
      for (let i = 0; i < entry.count; i++) {
        this.waveSpawns.push({ type: entry.type, countdown: countdown + entry.delay * i });
      }
      countdown += entry.delay * entry.count;
    }
    this.waveState = 'playing';
  }

  _spawnEnemy(type) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = side > 0 ? ARENA.xMax - 10 : ARENA.xMin + 10;
    const y = ARENA.yMin + 30 + Math.random() * (ARENA.yMax - 60);
    const e = new Enemy(type, x, y);
    e.facing = side > 0 ? -1 : 1;
    // Give knife throwers their throw callback
    if (e.ranged) {
      e.onThrowKnife = (ex, ey, tx, ty, dmg) => {
        this.knives.push(new Knife(ex, ey, tx, ty, dmg));
        audio.punchLight(); // whoosh sound for knife
      };
    }
    this.enemies.push(e);
  }

  update(input, dt) {
    if (this.paused) return;
    this.frame++;

    // Pending spawns
    for (const s of this.waveSpawns) {
      s.countdown--;
      if (s.countdown <= 0) { this._spawnEnemy(s.type); s.done = true; }
    }
    this.waveSpawns = this.waveSpawns.filter(s => !s.done);

    if (this.combat.isFrozen) {
      // Only update FX during hitstop
      this.fx.update(dt);
      input.clearFrame();
      return;
    }

    // Unlock audio on first input
    audio.unlock();

    // Player
    this.player.update(input, ARENA);

    // Jump sound on state transition
    if (this._prevPlayerState !== 'jump' && this.player.state === 'jump') {
      audio.jump();
    }
    this._prevPlayerState = this.player.state;

    // Super execution
    if (this.player.superFired) {
      this.player.superFired = false;
      this._executeSuper();
    }

    // Enemies
    const liveEnemies = this.enemies.filter(e => !e.dead);
    for (const e of liveEnemies) e.update(this.player, liveEnemies, ARENA);
    this.enemies = this.enemies.filter(e => !e.dead || e.state === 'die');

    // Clear per-swing hit flags each frame
    for (const e of liveEnemies) {
      if (e.state !== 'attack') e._hitThisSwing = false;
    }
    // Props: reset hit flag when player is not in an active attack window
    if (!this.player.isAttacking()) {
      for (const p of this.props) p._hitThisSwing = false;
    }

    // Props
    for (const p of this.props) p.update();

    // Drops
    for (const d of this.drops) {
      d.update();
      // Player pickup
      if (!d.dead) {
        const { sx: px, sy: py } = toScreen(this.player.x, this.player.y);
        const { sx: dx, sy: dy } = toScreen(d.x, d.y);
        if (Math.hypot(px - dx, py - dy) < 28) {
          this._applyDrop(d);
          d.dead = true;
          this.fx.addPickupFlash(dx, dy - 14, d.def.color);
          this.fx.addBuffText(dx, dy - 40, d.def.label);
        }
      }
    }
    this.drops = this.drops.filter(d => !d.dead);

    // Knives
    for (const k of this.knives) {
      k.update();
      if (!k.dead && this.player.invFrames <= 0) {
        const dx = Math.abs(k.x - this.player.x);
        const dy = Math.abs(k.y - this.player.y);
        if (dx < 16 && dy < 40) {
          k.dead = true;
          this.player.hp = Math.max(0, this.player.hp - k.damage);
          this.player.invFrames = 20;
          this.player.state = 'hurt';
          this.player.stateTimer = 14;
          this.fx.addHitSpark(k.x, k.y, '#CCCCCC', 6);
          this.fx.addDamageNum(this.player.x, this.player.y - 100, k.damage);
          this.fx.addShake(3, 6);
          audio.playerHurt();
          this.player.fillMeter(5);
        }
      }
    }
    this.knives = this.knives.filter(k => !k.dead);

    // Spawn drops from dead props
    for (const p of this.props) {
      if (p.dead && !p._dropped) {
        p._dropped = true;
        const { sx, sy } = toScreen(p.x, p.y);
        this.drops.push(new Drop(p.getDrop(), p.x, p.y));
      }
    }

    // Combat resolution
    // Clear per-swing hit flags for player if new attack started
    this.combat.resolvePlayerAttacks(this.player, liveEnemies, this.props, this.fx);
    this.combat.resolveEnemyAttacks(liveEnemies, this.player, this.fx);
    this.combat.update();

    // Score dead enemies
    for (const e of this.enemies) {
      if (e.dead && !e._scored) {
        e._scored = true;
        this.totalScore += e.score;
      }
    }
    this.enemies = this.enemies.filter(e => !(e.dead && e.state !== 'die'));

    this.fx.update(dt);
    input.clearFrame();

    // Wave clear check
    if (this.waveState === 'playing') {
      const allSpawned  = this.waveSpawns.length === 0;
      const allDead     = this.enemies.every(e => e.hp <= 0 || e.dead);
      if (allSpawned && allDead) {
        this.waveState = 'wave_clear';
        this.waveClearT = 180; // 3 seconds
        audio.waveClear();
      }
    }

    if (this.waveState === 'wave_clear') {
      this.waveClearT--;
      if (this.waveClearT <= 0) {
        this.waveIdx++;
        this.enemies = [];
        this._spawnProps(); // respawn props each wave
        this._loadWave(this.waveIdx);
      }
    }

    if (this.player.hp <= 0 && this.waveState !== 'game_over') {
      this.waveState = 'game_over';
      audio.gameOver();
    }
  }

  _executeSuper() {
    const liveEnemies = this.enemies.filter(e => e.hp > 0 && !e.dead);
    const id = this.charDef.id;

    if (id === 'neebs') {
      // "DUDE!" — scream stun: all enemies stunned + 25 damage
      audio.neebsSuper();
      this.fx.addScreenFlash('#00FF44', 0.5);
      this.fx.addSuperText('DUDE!', '#00FF44');
      this.fx.addShake(10, 20);
      for (const e of liveEnemies) {
        e.hp = Math.max(0, e.hp - 25);
        e.state     = 'hurt';
        e.stateTimer = 90;
        e.invFrames  = 0;
        this.fx.addHitSpark(e.x, e.y - 40, '#FF6B35', 14);
      }
    } else if (id === 'simon') {
      // "TOO FAST!" — rapid-fire hits on all enemies
      audio.simonSuper();
      this.fx.addScreenFlash('#22DD55', 0.4);
      this.fx.addSuperText('TOO FAST!', '#22DD55');
      this.fx.addShake(8, 16);
      for (const e of liveEnemies) {
        e.hp = Math.max(0, e.hp - 30);
        e.state = 'hurt'; e.stateTimer = 40; e.invFrames = 0;
        // Rapid spark burst at 3 different spots
        for (let i = 0; i < 3; i++) {
          this.fx.addHitSpark(
            e.x + (Math.random() - 0.5) * 30,
            e.y - 20 - Math.random() * 40,
            '#22DD55', 8
          );
        }
      }

    } else if (id === 'dora') {
      // "COUNTER!" — massive close-range counter hit
      audio.doraSuper();
      this.fx.addScreenFlash('#CC44FF', 0.45);
      this.fx.addSuperText('COUNTER!', '#CC44FF');
      this.fx.addShake(10, 18);
      for (const e of liveEnemies) {
        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        const dmg  = dist < 140 ? 55 : 20; // massive up close, less at range
        e.hp = Math.max(0, e.hp - dmg);
        const dx = e.x - this.player.x, dy = e.y - this.player.y;
        const d  = Math.max(1, Math.hypot(dx, dy));
        e.vx = (dx / d) * 8; e.vy = (dy / d) * 4; e.vz = 5;
        e.state = 'knockback'; e.stateTimer = 32; e.invFrames = 0;
        this.fx.addHitSpark(e.x, e.y - 40, '#CC44FF', dmg > 30 ? 18 : 10);
      }

    } else if (id === 'appsro') {
      // "SCIENCE!" — lab explosion: heavy damage + outward knockback
      audio.appsroSuper();
      this.fx.addScreenFlash('#44AAFF', 0.5);
      this.fx.addSuperText('SCIENCE!', '#44AAFF');
      this.fx.addShake(14, 24);
      const { sx: px, sy: py } = this._toScreen(this.player.x, this.player.y);
      this.fx.addShockwave(px, py - 40, 320, '#44AAFF');
      this.fx.addShockwave(px, py - 40, 200, '#FFFFFF');
      this.fx.addShockwave(px, py,      120, '#88DDFF');
      for (const e of liveEnemies) {
        e.hp = Math.max(0, e.hp - 50);
        // Knockback away from Appsro
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        e.vx = (dx / dist) * 10;
        e.vy = (dy / dist) * 5;
        e.vz = 6;
        e.state     = 'knockback';
        e.stateTimer = 35;
        e.invFrames  = 0;
        this.fx.addHitSpark(e.x, e.y - 40, '#44AAFF', 16);
      }

    } else if (id === 'thick44') {
      // "GROUND POUND!" — floor shockwave, massive damage + knockback
      audio.thick44Super();
      this.fx.addScreenFlash('#FFAA44', 0.55);
      this.fx.addSuperText('GROUND POUND!', '#FFAA44');
      this.fx.addShake(18, 28);
      const { sx: px, sy: py } = this._toScreen(this.player.x, this.player.y);
      // Ground-level shockwaves (horizontal)
      for (let i = 1; i <= 3; i++) {
        this.fx.addShockwave(px, py, 100 * i, '#FFAA44');
      }
      for (const e of liveEnemies) {
        e.hp = Math.max(0, e.hp - 60);
        const dx = e.x - this.player.x, dy = e.y - this.player.y;
        const d  = Math.max(1, Math.hypot(dx, dy));
        e.vx = (dx / d) * 12; e.vy = (dy / d) * 6; e.vz = 8;
        e.state = 'knockback'; e.stateTimer = 45; e.invFrames = 0;
        this.fx.addHitSpark(e.x, e.y - 20, '#FFAA44', 20);
      }
    }
  }

  _applyDrop(drop) {
    audio.pickup();
    switch (drop.type) {
      case 'health': this.player.heal(20); break;
      case 'speed':  this.player.applyBuff('speed'); break;
      case 'power':  this.player.applyBuff('power'); break;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.drawImage(this._bgCanvas, 0, 0);

    // Draw order: sort all visible entities by worldY (painter's algorithm)
    const drawList = [
      ...this.props.filter(p => !p.dead),
      ...this.drops,
      ...this.enemies.filter(e => !e.dead),
      this.player,
    ].sort((a, b) => a.y - b.y);

    for (const e of drawList) e.draw(ctx, toScreen);

    // Knives (drawn above entities)
    for (const k of this.knives) k.draw(ctx, toScreen);

    // FX layer
    this.fx.draw(ctx);

    this._drawHUD(ctx);

    if (this.waveState === 'wave_clear') this._drawWaveClear(ctx);
    if (this.waveState === 'game_over')  this._drawGameOver(ctx);
  }

  _drawHUD(ctx) {
    const W = this.W;

    // Player HP bar
    const hpBarW = 220, hpBarH = 18;
    const hpX = 20, hpY = 20;
    ctx.fillStyle = '#111';
    ctx.fillRect(hpX - 2, hpY - 2, hpBarW + 4, hpBarH + 4);
    // HP fill color
    const hpRatio = this.player.hp / this.player.maxHp;
    const hpColor = hpRatio > 0.5 ? '#22DD44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpX, hpY, Math.floor(hpBarW * hpRatio), hpBarH);
    ctx.strokeStyle = this.charDef.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(hpX, hpY, hpBarW, hpBarH);

    // HP label
    ctx.font = 'bold 12px Courier New';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'left';
    ctx.fillText(`HP  ${this.player.hp}/${this.player.maxHp}`, hpX + 6, hpY + 13);

    // Character name label
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = this.charDef.color;
    ctx.fillText(this.charDef.name, hpX, hpY - 4);

    // Score
    ctx.textAlign = 'right';
    ctx.font = 'bold 20px Courier New';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(String(this.totalScore).padStart(7, '0'), W - 20, 36);
    ctx.font = 'bold 11px Courier New';
    ctx.fillStyle = '#AA8800';
    ctx.fillText('SCORE', W - 20, 18);

    // Wave counter
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Courier New';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText(`WAVE ${this.waveIdx + 1}`, W / 2, 20);

    // Enemy count
    const living = this.enemies.filter(e => e.hp > 0).length;
    ctx.fillStyle = '#FF6666';
    ctx.fillText(`ENEMIES: ${living}`, W / 2, 36);

    // Combo display
    if (this.player.comboCount >= 3) {
      const combo = this.player.comboCount;
      ctx.font = `bold ${Math.min(32, 18 + combo)}px Courier New`;
      ctx.fillStyle = combo >= 8 ? '#FF0000' : combo >= 5 ? '#FF8800' : '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText(`${combo} COMBO!`, W / 2, 68);
    }

    // Active buffs
    let buffX = 20;
    ctx.textAlign = 'left';
    if (this.player.buffs.speed > 0) {
      ctx.font = 'bold 13px Courier New';
      ctx.fillStyle = '#00FFFF';
      ctx.fillText(`⚡SPEED ${Math.ceil(this.player.buffs.speed / 60)}s`, buffX, 56);
      buffX += 110;
    }
    if (this.player.buffs.power > 0) {
      ctx.font = 'bold 13px Courier New';
      ctx.fillStyle = '#FF8800';
      ctx.fillText(`💥POWER ${Math.ceil(this.player.buffs.power / 60)}s`, buffX, 56);
    }

    // Super meter bar
    const superRatio = this.player.superMeter / this.player.maxSuperMeter;
    const isFull     = superRatio >= 1;
    const superBarW  = 220, superBarH = 10;
    const superX = 20, superY = 44;
    const pulse  = isFull ? 0.5 + Math.sin(this.frame * 0.2) * 0.5 : 1;

    ctx.fillStyle = '#111';
    ctx.fillRect(superX - 2, superY - 2, superBarW + 4, superBarH + 4);
    // Fill gradient
    const grad = ctx.createLinearGradient(superX, 0, superX + superBarW, 0);
    grad.addColorStop(0, this.charDef.color);
    grad.addColorStop(1, isFull ? '#FFFFFF' : this.charDef.color);
    ctx.fillStyle = grad;
    ctx.globalAlpha = isFull ? pulse : 1;
    ctx.fillRect(superX, superY, Math.floor(superBarW * superRatio), superBarH);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = isFull ? '#FFFFFF' : '#333355';
    ctx.lineWidth = 1;
    ctx.strokeRect(superX, superY, superBarW, superBarH);

    // Label
    ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'left';
    ctx.fillStyle = isFull ? '#FFFFFF' : '#888899';
    ctx.fillText(isFull ? 'SUPER READY — press V!' : 'SUPER', superX, superY - 2);
  }

  _drawWaveClear(ctx) {
    const W = this.W, H = this.H;
    const alpha = Math.min(1, (180 - this.waveClearT) / 30) * Math.min(1, this.waveClearT / 30);
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = '#000';
    ctx.fillRect(W/2 - 200, H/2 - 50, 400, 100);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 40px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('WAVE CLEAR!', W/2, H/2 + 8);
    ctx.fillText('WAVE CLEAR!', W/2, H/2 + 8);
    ctx.font = 'bold 18px Courier New';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`WAVE ${this.waveIdx + 1} INCOMING...`, W/2, H/2 + 36);
    ctx.restore();
  }

  _drawGameOver(ctx) {
    const W = this.W, H = this.H;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 60px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF3333';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText('GAME OVER', W/2, H/2 - 20);
    ctx.fillText('GAME OVER', W/2, H/2 - 20);
    ctx.font = 'bold 22px Courier New';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`FINAL SCORE: ${this.totalScore}`, W/2, H/2 + 24);
    ctx.font = 'bold 16px Courier New';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('Press F5 to play again', W/2, H/2 + 58);
    ctx.restore();
  }
}
