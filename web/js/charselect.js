import { drawNeebs, drawAppsro, drawSimon, drawDora, drawThick44 } from './sprites/sprites.js';

// ─── Character roster ─────────────────────────────────────────────────────────
// charDef fields used by Player: name, color, maxHp, baseSpeed, buffedSpeed,
//   basePowerMult, jumpForce, drawFn, attackOverrides (optional)
export const CHARACTER_ROSTER = [
  {
    id: 'neebs',
    name: 'NEEBS',
    tagline: '"DUDE!"',
    color: '#FF6B35',
    locked: false,
    maxHp: 100,
    baseSpeed: 2.4,
    buffedSpeed: 3.6,
    basePowerMult: 1.0,
    jumpForce: 10,
    drawFn: drawNeebs,
    stats: { power: 3, speed: 4, defense: 3, reach: 3 },
    desc: ['All-rounder. Fast combos,', 'big heart. What he lacks in', 'power he makes up in DUDE.'],
  },
  {
    id: 'appsro',
    name: 'APPSRO',
    tagline: '"SCIENCE!"',
    color: '#44AAFF',
    locked: false,
    maxHp: 130,
    baseSpeed: 1.8,
    buffedSpeed: 2.7,
    basePowerMult: 1.4,
    jumpForce: 8,
    drawFn: drawAppsro,
    stats: { power: 5, speed: 2, defense: 4, reach: 4 },
    desc: ['Heavy hitter. Slow wind-up but', 'each hit is absolutely', 'devastating. Lab coat: optimal.'],
    // Slower startup, bigger payoff
    attackOverrides: {
      punch1: { type:'light',  frames:17, activeStart:6,  activeEnd:12, damage:14, reach:62, height:28, yOff:30 },
      punch2: { type:'light',  frames:17, activeStart:6,  activeEnd:12, damage:16, reach:64, height:30, yOff:34 },
      punch3: { type:'heavy',  frames:26, activeStart:9,  activeEnd:18, damage:32, reach:70, height:34, yOff:32 },
      kick1:  { type:'light',  frames:20, activeStart:7,  activeEnd:13, damage:18, reach:72, height:32, yOff:38 },
      kick2:  { type:'heavy',  frames:28, activeStart:10, activeEnd:20, damage:30, reach:76, height:38, yOff:42 },
      jumpAtk:{ type:'heavy',  frames:20, activeStart:4,  activeEnd:14, damage:24, reach:64, height:42, yOff:22 },
    },
  },
  {
    id: 'simon',
    name: 'SIMON',
    tagline: '"TOO FAST!"',
    color: '#FF44AA',
    locked: false,
    maxHp: 80,
    baseSpeed: 3.0,
    buffedSpeed: 4.2,
    basePowerMult: 0.8,
    jumpForce: 12,
    drawFn: drawSimon,
    stats: { power: 2, speed: 5, defense: 2, reach: 2 },
    desc: ['Speed demon. Rapid combos,', 'small hitboxes — quantity', 'over quality. Mostly.'],
    attackOverrides: {
      punch1: { type:'light', frames:10, activeStart:3, activeEnd:7,  damage:8,  reach:52, height:22, yOff:26 },
      punch2: { type:'light', frames:10, activeStart:3, activeEnd:7,  damage:9,  reach:54, height:24, yOff:28 },
      punch3: { type:'heavy', frames:13, activeStart:4, activeEnd:9,  damage:16, reach:58, height:26, yOff:28 },
      kick1:  { type:'light', frames:12, activeStart:3, activeEnd:8,  damage:10, reach:62, height:28, yOff:32 },
      kick2:  { type:'heavy', frames:16, activeStart:5, activeEnd:11, damage:18, reach:66, height:32, yOff:36 },
      jumpAtk:{ type:'light', frames:13, activeStart:2, activeEnd:9,  damage:14, reach:56, height:36, yOff:18 },
    },
  },
  {
    id: 'dora',
    name: 'DORA',
    tagline: '"COUNTER!"',
    color: '#FFD700',
    locked: false,
    maxHp: 90,
    baseSpeed: 2.6,
    buffedSpeed: 3.8,
    basePowerMult: 1.1,
    jumpForce: 11,
    drawFn: drawDora,
    stats: { power: 3, speed: 4, defense: 5, reach: 3 },
    desc: ['Agile counter-fighter.', 'Gets hit? Gets angry.', 'Defense is the best offense.'],
  },
  {
    id: 'thick44',
    name: 'THICK44',
    tagline: '"GROUND POUND!"',
    color: '#AA44FF',
    locked: false,
    maxHp: 180,
    baseSpeed: 1.4,
    buffedSpeed: 2.2,
    basePowerMult: 1.65,
    jumpForce: 7,
    drawFn: drawThick44,
    stats: { power: 5, speed: 1, defense: 5, reach: 3 },
    desc: ['Walking tank. Slow as', 'continental drift but each', 'hit rearranges the scenery.'],
    attackOverrides: {
      punch1: { type:'light', frames:22, activeStart:8,  activeEnd:16, damage:18, reach:60, height:30, yOff:32 },
      punch2: { type:'light', frames:22, activeStart:8,  activeEnd:16, damage:20, reach:62, height:32, yOff:34 },
      punch3: { type:'heavy', frames:32, activeStart:12, activeEnd:24, damage:42, reach:68, height:36, yOff:34 },
      kick1:  { type:'light', frames:24, activeStart:9,  activeEnd:17, damage:22, reach:66, height:34, yOff:40 },
      kick2:  { type:'heavy', frames:32, activeStart:12, activeEnd:24, damage:36, reach:74, height:40, yOff:44 },
      jumpAtk:{ type:'heavy', frames:22, activeStart:6,  activeEnd:18, damage:32, reach:64, height:44, yOff:24 },
    },
  },
];

// ─── Character Select Screen ──────────────────────────────────────────────────
export class CharSelectScreen {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.W      = canvas.width;
    this.H      = canvas.height;

    this.cursor       = 0;
    this.confirmed    = false;
    this.selectedChar = null;
    this.animT        = 0;
    this.confirmDelay = 0; // frames after confirm before isDone fires
    this.flashBlink   = 0;
  }

  update(input) {
    this.animT     += 0.05;
    this.flashBlink++;

    if (this.confirmDelay > 0) {
      this.confirmDelay--;
      if (this.confirmDelay <= 0) this.confirmed = true;
      input.clearFrame();
      return;
    }

    // Navigate — use wasPressed (justPressed cleared each frame)
    if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
      this.cursor = (this.cursor - 1 + CHARACTER_ROSTER.length) % CHARACTER_ROSTER.length;
    }
    if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
      this.cursor = (this.cursor + 1) % CHARACTER_ROSTER.length;
    }

    const sel = CHARACTER_ROSTER[this.cursor];

    // Confirm — Z is buffered, Enter uses wasPressed
    const confirm = input.consume('KeyZ') || input.wasPressed('Enter');
    if (confirm && !sel.locked) {
      this.selectedChar = sel;
      this.confirmDelay = 45;
    }

    input.clearFrame();
  }

  draw() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#000010');
    bg.addColorStop(1, '#0a001a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Scanline texture
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let iy = 0; iy < H; iy += 3) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, iy, W, 1);
    }
    ctx.restore();

    // ── Title ──
    ctx.save();
    ctx.font = 'bold 26px Courier New';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF6B35';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('SELECT YOUR FIGHTER', W / 2, 28);
    ctx.shadowBlur = 0;
    ctx.font = '10px Courier New';
    ctx.fillStyle = '#886600';
    ctx.fillText('← → to browse   Z / Enter to select', W / 2, 42);
    ctx.restore();

    // ── Character slots ──
    const slotW = 108, slotH = 132, gap = 6;
    const totalW = CHARACTER_ROSTER.length * (slotW + gap) - gap;
    const startX = Math.floor((W - totalW) / 2);
    const slotTop = 50;

    CHARACTER_ROSTER.forEach((char, i) => {
      const sx = startX + i * (slotW + gap);
      const isCursor = i === this.cursor;
      const isLocked = char.locked;

      // Slot bg + border
      ctx.save();
      if (isCursor && !isLocked) {
        ctx.shadowColor = char.color;
        ctx.shadowBlur  = 14;
      }
      ctx.fillStyle   = isCursor ? '#12122a' : '#08080f';
      ctx.fillRect(sx, slotTop, slotW, slotH);
      ctx.strokeStyle = isCursor ? (char.color || '#FF6B35') : '#22224a';
      ctx.lineWidth   = isCursor ? 2 : 1;
      ctx.strokeRect(sx, slotTop, slotW, slotH);
      ctx.restore();

      if (isLocked) {
        // Question mark silhouette
        ctx.font = 'bold 34px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#22224a';
        ctx.fillText('?', sx + slotW / 2, slotTop + 76);
        ctx.font = 'bold 8px Courier New';
        ctx.fillStyle = '#22224a';
        ctx.fillText('COMING SOON', sx + slotW / 2, slotTop + 98);
        ctx.font = 'bold 10px Courier New';
        ctx.fillStyle = '#33335a';
        ctx.fillText(char.name, sx + slotW / 2, slotTop + 118);
      } else {
        // Draw character sprite at 0.6 scale inside slot
        const charX = sx + slotW / 2;
        const charY = slotTop + slotH - 10;
        ctx.save();
        const scale = 0.6;
        ctx.scale(scale, scale);
        char.drawFn(
          ctx,
          Math.round(charX / scale),
          Math.round(charY / scale),
          1,
          'idle',
          this.animT,
          0
        );
        ctx.restore();

        // Name tag
        ctx.font = `bold 11px Courier New`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isCursor ? char.color : '#5a5a8a';
        ctx.fillText(char.name, sx + slotW / 2, slotTop + slotH - 4);
      }
    });

    // ── Info panel for selected char ──
    const sel = CHARACTER_ROSTER[this.cursor];
    const panelY = slotTop + slotH + 10;
    const panelH = H - panelY - 22;
    const panelX = 20;
    const panelW = W - 40;

    ctx.fillStyle = '#08080f';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = sel.locked ? '#22224a' : sel.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    if (sel.locked) {
      ctx.font = 'bold 13px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#33335a';
      ctx.fillText(`${sel.name} — LOCKED`, W / 2, panelY + panelH / 2 + 5);
    } else {
      // Name + tagline
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'left';
      ctx.fillStyle = sel.color;
      ctx.fillText(sel.name, panelX + 12, panelY + 22);

      ctx.font = 'bold 10px Courier New';
      ctx.fillStyle = '#8888AA';
      ctx.fillText(sel.tagline, panelX + 12, panelY + 36);

      // Description lines
      ctx.font = '9px Courier New';
      ctx.fillStyle = '#7777AA';
      sel.desc.forEach((line, li) => {
        ctx.fillText(line, panelX + 12, panelY + 52 + li * 12);
      });

      // Stat bars
      const statsX   = panelX + panelW - 160;
      const statDefs = [
        { label: 'PWR', key: 'power'   },
        { label: 'SPD', key: 'speed'   },
        { label: 'DEF', key: 'defense' },
        { label: 'RCH', key: 'reach'   },
      ];
      statDefs.forEach(({ label, key }, si) => {
        const val = sel.stats[key] || 0;
        const bx  = statsX;
        const by  = panelY + 10 + si * 18;
        ctx.font = '9px Courier New';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#8888AA';
        ctx.fillText(label, bx - 4, by + 9);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#111128';
        ctx.fillRect(bx, by, 120, 10);
        ctx.fillStyle = sel.color;
        ctx.fillRect(bx, by, val * 24, 10);
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 120, 10);
      });
    }

    // ── Confirm prompt (blinking) ──
    if (!sel.locked) {
      const visible = this.confirmDelay > 0 || Math.floor(this.flashBlink / 20) % 2 === 0;
      if (visible) {
        ctx.font = 'bold 13px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.confirmDelay > 0 ? '#FFFFFF' : '#FFD700';
        ctx.fillText(
          this.confirmDelay > 0 ? `${sel.name} — LET'S GO!` : 'PRESS Z TO FIGHT!',
          W / 2,
          H - 6
        );
      }
    }
  }

  get isDone() { return this.confirmed; }
}
