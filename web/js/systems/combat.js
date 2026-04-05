// ─── Combat System ───────────────────────────────────────────────────────────
// Handles hitbox overlap, damage resolution, knockback, and hitstop.

export class CombatSystem {
  constructor(game) {
    this.game = game;
    this.hitstopFrames = 0;
  }

  // Axis-aligned bounding box check
  overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx &&
           ay < by + bh && ay + ah > by;
  }

  // Returns {x, y, w, h} hitbox for an entity in world space
  hitbox(e) {
    const hw = e.hitW ?? 28;
    const hh = e.hitH ?? 60;
    return { x: e.x - hw / 2, y: e.y - hh, w: hw, h: hh };
  }

  // Returns {x, y, w, h} attack box for an entity (in front of them)
  attackBox(e) {
    const reach = e.attackReach ?? 56;
    const height = e.attackHeight ?? 30;
    const yOff   = e.attackYOff  ?? 30;   // offset from feet upward
    const ax = e.facing > 0 ? e.x : e.x - reach;
    return { x: ax, y: e.y - yOff - height, w: reach, h: height };
  }

  // Depth-plane hit check: entities must be within DEPTH_RANGE of each other
  depthOverlap(a, b, range = 32) {
    return Math.abs(a.y - b.y) < range;
  }

  // Apply a hit from attacker to target
  applyHit(attacker, target, damage, opts = {}) {
    if (target.invFrames > 0) return false;
    if (target.hp <= 0)       return false;

    const { heavy = false, grab = false } = opts;

    target.hp = Math.max(0, target.hp - damage);

    // Hitstop (freeze effect)
    this.hitstopFrames = heavy ? 5 : 3;

    // Knockback velocity
    const kbX = heavy ? attacker.facing * 6 : attacker.facing * 3;
    const kbY = heavy ? (Math.random() - 0.5) * 3 : 0;
    target.vx = kbX;
    target.vy = kbY;
    if (heavy) target.vz = 4; // brief air launch on heavy

    // Stagger state
    target.state     = heavy ? 'knockback' : 'hurt';
    target.stateTimer = heavy ? 28 : 14;
    target.invFrames  = heavy ? 20 : 10;

    return true;
  }

  // Check all player attacks against enemies + props
  resolvePlayerAttacks(player, enemies, props, fx) {
    if (!player.isAttacking()) return;

    const atk = this.attackBox(player);

    // vs enemies
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      if (!this.depthOverlap(player, e)) continue;
      const hb = this.hitbox(e);
      if (!this.overlap(atk.x, atk.y, atk.w, atk.h, hb.x, hb.y, hb.w, hb.h)) continue;
      if (e._hitThisSwing) continue; // don't double-hit same swing

      const dmg = player.currentAttackDamage();
      const heavy = player.isHeavyAttack();
      const hit = this.applyHit(player, e, dmg, { heavy });
      if (hit) {
        e._hitThisSwing = true;
        fx.addHitSpark(e.x + player.facing * 16, e.y - 40, heavy ? '#FF8800' : '#FFD700', heavy ? 12 : 7);
        fx.addHitText(e.x, e.y - 80, null, heavy ? '#FF8800' : '#FFD700', heavy ? 1.4 : 1.0);
        fx.addDamageNum(e.x, e.y - 90, dmg);
        if (heavy) fx.addShake(5, 8);
        else       fx.addShake(2, 4);
      }
    }

    // vs props
    for (const p of props) {
      if (p.hp <= 0) continue;
      if (!this.depthOverlap(player, p, 36)) continue;
      const hb = this.hitbox(p);
      if (!this.overlap(atk.x, atk.y, atk.w, atk.h, hb.x, hb.y, hb.w, hb.h)) continue;
      if (p._hitThisSwing) continue;

      const dmg = player.currentAttackDamage();
      p.hp -= dmg;
      p._hitThisSwing = true;
      p.shakeT = 8;
      fx.addHitSpark(p.x, p.y - 20, '#AAAAAA', 5);
      if (p.hp <= 0) {
        p.dead = true;
        fx.addBreakParticles(p.x, p.y, p.color1, p.color2);
        fx.addShake(4, 8);
      }
    }
  }

  // Check all enemy attacks against player
  resolveEnemyAttacks(enemies, player, fx) {
    if (player.invFrames > 0) return;

    for (const e of enemies) {
      if (e.state !== 'attack') continue;
      if (!e.attackActive) continue;
      if (e._hitPlayerThisSwing) continue;
      if (!this.depthOverlap(e, player)) continue;

      const atk = this.attackBox(e);
      const hb  = this.hitbox(player);
      if (!this.overlap(atk.x, atk.y, atk.w, atk.h, hb.x, hb.y, hb.w, hb.h)) continue;

      const dmg = e.attackDamage ?? 8;
      const hit = this.applyHit(e, player, dmg);
      if (hit) {
        e._hitPlayerThisSwing = true;
        fx.addHitSpark(player.x - e.facing * 10, player.y - 40, '#FF3333', 7);
        fx.addDamageNum(player.x, player.y - 100, dmg);
        fx.addShake(3, 6);
      }
    }
  }

  update() {
    if (this.hitstopFrames > 0) this.hitstopFrames--;
  }

  get isFrozen() { return this.hitstopFrames > 0; }
}
