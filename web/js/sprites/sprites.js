// ─── Sprite drawing library ─────────────────────────────────────────────────
// All draw functions take (ctx, x, y) where x,y is the character's FOOT position.
// Facing: +1 = right, -1 = left. animT is a 0-1 cycle value for animation.

function setFlip(ctx, x, facing) {
  if (facing === -1) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
}

function shadow(ctx, x, groundY, w = 20) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, groundY, w, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Utility ────────────────────────────────────────────────────────────────
function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function outline(ctx, color, x, y, w, h, t = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = t;
  ctx.strokeRect(x + t/2, y + t/2, w - t, h - t);
}

// ─── NEEBS ──────────────────────────────────────────────────────────────────
// Orange hoodie, brown messy hair, jeans, cheerful idiot energy
export function drawNeebs(ctx, x, groundY, facing, state, animT, z = 0) {
  const sy = groundY - z;
  shadow(ctx, x, groundY);
  ctx.save();
  setFlip(ctx, x, facing);

  // Legs / walk cycle
  const legSwing = state === 'walk' ? Math.sin(animT * Math.PI * 2) * 8 : 0;

  // Shoes
  rect(ctx, '#FFFFFF', x - 13, sy - 8,  12, 8);  // left shoe
  rect(ctx, '#CCCCCC', x + 1,  sy - 8,  12, 8);  // right shoe
  rect(ctx, '#333333', x - 14, sy - 10, 14, 4);  // sole left
  rect(ctx, '#333333', x,      sy - 10, 14, 4);  // sole right

  // Jeans
  rect(ctx, '#3355CC', x - 12, sy - 36, 10, 28); // left leg
  rect(ctx, '#4169E1', x + 2,  sy - 36, 10, 28); // right leg

  // Hoodie body (orange)
  rect(ctx, '#FF6B35', x - 16, sy - 68, 32, 36);
  // Hoodie pocket
  rect(ctx, '#CC5520', x - 7,  sy - 44, 14, 10);
  rect(ctx, '#FF6B35', x - 6,  sy - 43, 12, 8);

  // Arms
  const punchReach = (state === 'punch1' || state === 'punch2' || state === 'punch3') ? 14 * animT : 0;
  const kickLift = state === 'kick1' ? 16 * animT : 0;

  rect(ctx, '#FF6B35', x - 20, sy - 64, 8, 24 + legSwing); // left arm
  rect(ctx, '#FF6B35', x + 12, sy - 64 - kickLift, 8, 24 - kickLift); // right arm (kick lift)

  // Fist on punch
  if (state === 'punch1' || state === 'punch2' || state === 'punch3') {
    rect(ctx, '#FDBCB4', x + 16 + punchReach, sy - 52, 10, 10);
  }

  // Kick foot
  if (state === 'kick1' || state === 'kick2') {
    const kx = x + 10 + 20 * animT;
    const ky = sy - 28 - 20 * animT;
    rect(ctx, '#4169E1', kx, ky - 8, 16, 16);
    rect(ctx, '#FFFFFF', kx + 2, ky, 14, 8);
  }

  // Head (skin)
  rect(ctx, '#FDBCB4', x - 13, sy - 90, 26, 24);
  // Hair (brown, messy)
  rect(ctx, '#8B4513', x - 13, sy - 90, 26, 10);
  rect(ctx, '#6B3410', x - 15, sy - 88,  6, 14);
  rect(ctx, '#6B3410', x + 11, sy - 88,  6, 10);
  // Eyes
  rect(ctx, '#1a1a1a', x - 8, sy - 78, 5, 5);
  rect(ctx, '#1a1a1a', x + 3, sy - 78, 5, 5);
  // Pupils
  rect(ctx, '#FFFFFF', x - 7, sy - 77, 2, 2);
  rect(ctx, '#FFFFFF', x + 4, sy - 77, 2, 2);
  // Mouth (goofy grin)
  rect(ctx, '#CC7755', x - 5, sy - 70, 10, 3);
  rect(ctx, '#FFFFFF', x - 4, sy - 69, 8, 2);

  // Hurt flash
  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 16, sy - 92, 32, 92);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── GOON (basic enemy) ─────────────────────────────────────────────────────
// Dark maroon jumpsuit, helmet, mean face
export function drawGoon(ctx, x, groundY, facing, state, animT, z = 0, hp = 1, maxHp = 1) {
  const sy = groundY - z;
  shadow(ctx, x, groundY, 18);
  ctx.save();
  setFlip(ctx, x, facing);

  const walkBob = state === 'walk' ? Math.sin(animT * Math.PI * 2) * 6 : 0;
  const atk = state === 'attack' ? 10 * animT : 0;

  // Boots
  rect(ctx, '#1a1a1a', x - 12, sy - 8,  11, 8);
  rect(ctx, '#1a1a1a', x + 1,  sy - 8,  11, 8);

  // Pants (dark)
  rect(ctx, '#4a0000', x - 11, sy - 34, 9, 26);
  rect(ctx, '#4a0000', x + 2,  sy - 34, 9, 26);

  // Jumpsuit body
  rect(ctx, '#8B0000', x - 14, sy - 62, 28, 32);
  outline(ctx, '#CC0000', x - 14, sy - 62, 28, 32, 2);

  // Arms
  rect(ctx, '#8B0000', x - 20, sy - 60, 8, 22 + walkBob); // left
  rect(ctx, '#8B0000', x + 12, sy - 60, 8, 22);            // right
  // Attack fist
  if (state === 'attack') {
    rect(ctx, '#5a0000', x + 16 + atk, sy - 48, 10, 10);
  }

  // Helmet
  rect(ctx, '#333333', x - 13, sy - 88, 26, 28);
  rect(ctx, '#555555', x - 11, sy - 86, 22, 10); // visor strip
  rect(ctx, '#CC3300', x - 11, sy - 86, 22, 10); // visor red tint
  ctx.globalAlpha = 0.4;
  rect(ctx, '#FF6600', x - 11, sy - 86, 22, 10);
  ctx.globalAlpha = 1;

  // Angry eyes under visor
  rect(ctx, '#FF0000', x - 8, sy - 82, 5, 3);
  rect(ctx, '#FF0000', x + 3, sy - 82, 5, 3);

  // HP bar above head
  const barW = 32, barH = 5;
  const bx = x - 16, by = sy - 102;
  rect(ctx, '#330000', bx, by, barW, barH);
  rect(ctx, '#FF3333', bx, by, Math.floor(barW * (hp / maxHp)), barH);
  outline(ctx, '#550000', bx, by, barW, barH, 1);

  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 14, sy - 90, 28, 90);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── HEAVY GOON ─────────────────────────────────────────────────────────────
export function drawHeavyGoon(ctx, x, groundY, facing, state, animT, z = 0, hp = 1, maxHp = 1) {
  const sy = groundY - z;
  shadow(ctx, x, groundY, 26);
  ctx.save();
  setFlip(ctx, x, facing);

  const atk = state === 'attack' ? 12 * animT : 0;

  // Big boots
  rect(ctx, '#111111', x - 18, sy - 10, 16, 10);
  rect(ctx, '#111111', x + 2,  sy - 10, 16, 10);

  // Wide pants
  rect(ctx, '#2a0020', x - 16, sy - 40, 14, 30);
  rect(ctx, '#2a0020', x + 2,  sy - 40, 14, 30);

  // Huge torso
  rect(ctx, '#6B006B', x - 22, sy - 80, 44, 44);
  outline(ctx, '#AA00AA', x - 22, sy - 80, 44, 44, 3);

  // Shoulder pads
  rect(ctx, '#440044', x - 28, sy - 80, 10, 16);
  rect(ctx, '#440044', x + 18, sy - 80, 10, 16);

  // Arms (thick)
  rect(ctx, '#6B006B', x - 28, sy - 76, 10, 30);
  rect(ctx, '#6B006B', x + 18, sy - 76, 10, 30);
  // Punch fist
  if (state === 'attack') {
    rect(ctx, '#440033', x + 24 + atk, sy - 60, 14, 14);
  }

  // Big helmet
  rect(ctx, '#222222', x - 18, sy - 108, 36, 32);
  rect(ctx, '#FF4400', x - 14, sy - 102, 28, 8); // red visor
  ctx.globalAlpha = 0.35;
  rect(ctx, '#FF8800', x - 14, sy - 102, 28, 8);
  ctx.globalAlpha = 1;

  // HP bar
  const barW = 42, barH = 6;
  const bx = x - 21, by = sy - 120;
  rect(ctx, '#330000', bx, by, barW, barH);
  rect(ctx, '#AA0000', bx, by, Math.floor(barW * (hp / maxHp)), barH);
  outline(ctx, '#550000', bx, by, barW, barH, 1);

  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 22, sy - 110, 44, 110);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── PROPS ──────────────────────────────────────────────────────────────────
export function drawTrashcan(ctx, x, groundY, hp, maxHp) {
  const sy = groundY;
  shadow(ctx, x, sy + 2, 16);

  // Can body
  rect(ctx, '#2E7D32', x - 12, sy - 42, 24, 40);
  outline(ctx, '#1B5E20', x - 12, sy - 42, 24, 40, 2);
  // Ribs
  rect(ctx, '#1B5E20', x - 12, sy - 34, 24, 3);
  rect(ctx, '#1B5E20', x - 12, sy - 22, 24, 3);
  // Lid
  rect(ctx, '#388E3C', x - 14, sy - 44, 28, 6);
  rect(ctx, '#4CAF50', x - 10, sy - 46, 20, 4);

  // Damage dents
  if (hp < maxHp * 0.6) {
    rect(ctx, '#1B5E20', x - 8, sy - 30, 6, 8);
  }
  if (hp < maxHp * 0.3) {
    rect(ctx, '#1B5E20', x + 2, sy - 38, 5, 6);
  }

  // HP pip
  const pips = 3;
  for (let i = 0; i < pips; i++) {
    const full = (hp / maxHp) > (i / pips);
    rect(ctx, full ? '#66FF66' : '#1B5E20', x - 8 + i * 7, sy - 50, 5, 4);
  }
}

export function drawBarrel(ctx, x, groundY, hp, maxHp) {
  const sy = groundY;
  shadow(ctx, x, sy + 2, 18);

  // Barrel body
  rect(ctx, '#8B4513', x - 15, sy - 48, 30, 46);
  // Barrel curve (fake with lighter strip)
  rect(ctx, '#A0522D', x - 10, sy - 48, 20, 46);
  // Metal bands
  rect(ctx, '#8B8B00', x - 15, sy - 44, 30, 5);
  rect(ctx, '#8B8B00', x - 15, sy - 20, 30, 5);
  rect(ctx, '#8B8B00', x - 15, sy - 4,  30, 5);
  // Top cap
  rect(ctx, '#6B3410', x - 15, sy - 50, 30, 6);

  if (hp < maxHp * 0.5) rect(ctx, '#5a2d00', x - 8, sy - 32, 8, 10);

  // Hazard symbol for barrel
  rect(ctx, '#FFD700', x - 6, sy - 28, 12, 12);
  rect(ctx, '#FF4400', x - 4, sy - 26, 8, 8);
  rect(ctx, '#FFD700', x - 2, sy - 24, 4, 4);
}

export function drawCrate(ctx, x, groundY, hp, maxHp) {
  const sy = groundY;
  shadow(ctx, x, sy + 2, 20);

  // Wood crate
  rect(ctx, '#8B7355', x - 18, sy - 36, 36, 34);
  outline(ctx, '#5C4A2A', x - 18, sy - 36, 36, 34, 2);
  // Wood planks
  rect(ctx, '#5C4A2A', x - 18, sy - 24, 36, 3);
  rect(ctx, '#5C4A2A', x - 6,  sy - 36, 3, 34);
  rect(ctx, '#5C4A2A', x + 3,  sy - 36, 3, 34);
  // Corner brackets
  rect(ctx, '#8B8B8B', x - 20, sy - 38, 6, 6);
  rect(ctx, '#8B8B8B', x + 14, sy - 38, 6, 6);
  rect(ctx, '#8B8B8B', x - 20, sy - 4,  6, 6);
  rect(ctx, '#8B8B8B', x + 14, sy - 4,  6, 6);

  if (hp < maxHp * 0.4) rect(ctx, '#3a2800', x - 12, sy - 28, 16, 12);
}

// ─── DROPS ──────────────────────────────────────────────────────────────────
export function drawHealthDrop(ctx, x, groundY, bobT) {
  const sy = groundY - 8 - Math.sin(bobT * 0.08) * 5;
  // Glowing red cross
  ctx.save();
  ctx.shadowColor = '#FF3333';
  ctx.shadowBlur = 12;
  rect(ctx, '#FF3333', x - 14, sy - 14, 28, 28);
  rect(ctx, '#FF6666', x - 10, sy - 10, 20, 20);
  // Cross symbol
  rect(ctx, '#FFFFFF', x - 3,  sy - 12, 6, 24);
  rect(ctx, '#FFFFFF', x - 12, sy - 3,  24, 6);
  ctx.restore();
}

export function drawSpeedDrop(ctx, x, groundY, bobT) {
  const sy = groundY - 8 - Math.sin(bobT * 0.08) * 5;
  ctx.save();
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 12;
  rect(ctx, '#006688', x - 14, sy - 14, 28, 28);
  rect(ctx, '#0099BB', x - 10, sy - 10, 20, 20);
  // Lightning bolt
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.moveTo(x + 4,  sy - 12);
  ctx.lineTo(x - 4,  sy - 2);
  ctx.lineTo(x + 2,  sy - 2);
  ctx.lineTo(x - 4,  sy + 12);
  ctx.lineTo(x + 4,  sy + 2);
  ctx.lineTo(x - 2,  sy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawPowerDrop(ctx, x, groundY, bobT) {
  const sy = groundY - 8 - Math.sin(bobT * 0.08) * 5;
  ctx.save();
  ctx.shadowColor = '#FF8800';
  ctx.shadowBlur = 12;
  rect(ctx, '#663300', x - 14, sy - 14, 28, 28);
  rect(ctx, '#994400', x - 10, sy - 10, 20, 20);
  // Fist icon
  rect(ctx, '#FFAA00', x - 7,  sy - 10, 14, 18);
  rect(ctx, '#FFAA00', x - 9,  sy - 4,  18, 4);
  ctx.restore();
}

// ─── BACKGROUND ELEMENTS ────────────────────────────────────────────────────
export function drawBackground(ctx, W, H) {
  // Night sky / building silhouettes
  const grad = ctx.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, '#0a0010');
  grad.addColorStop(1, '#1a0030');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 180);

  // Building silhouettes
  ctx.fillStyle = '#0d0020';
  const buildings = [
    [0, 60, 80, 120], [70, 90, 60, 90], [120, 40, 50, 140],
    [160, 70, 70, 110], [220, 100, 40, 80], [250, 55, 90, 125],
    [330, 80, 50, 100], [370, 30, 80, 150], [440, 75, 60, 105],
    [490, 50, 70, 130], [550, 85, 60, 95], [600, 40, 90, 140],
    [680, 65, 75, 115], [740, 90, 60, 90],
  ];
  buildings.forEach(([bx, by, bw, bh]) => ctx.fillRect(bx, by, bw, bh));

  // Building windows (random lights)
  ctx.fillStyle = '#FFEE88';
  const windows = [
    [15,80],[15,100],[15,120],[40,80],[40,100],[40,120],
    [130,60],[130,90],[155,60],[155,90],[155,120],
    [265,70],[265,100],[290,70],[290,100],[290,130],
    [385,50],[385,80],[385,110],[410,50],[410,80],
    [500,65],[500,95],[525,65],[525,95],[525,125],
    [615,55],[615,85],[615,115],[645,55],[645,85],
    [695,80],[695,110],[720,80],[720,110],
  ];
  windows.forEach(([wx, wy]) => ctx.fillRect(wx, wy, 6, 5));

  // Arena floor (alley / street)
  const floorGrad = ctx.createLinearGradient(0, 180, 0, H);
  floorGrad.addColorStop(0, '#1a1a2e');
  floorGrad.addColorStop(0.3, '#16213e');
  floorGrad.addColorStop(1, '#0f1c35');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 180, W, H - 180);

  // Perspective floor grid lines (depth lines)
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 1;
  const vanishX = W / 2, vanishY = 195;
  for (let i = 0; i <= 12; i++) {
    const bx = (W / 12) * i;
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }
  // Horizontal lines
  for (let i = 0; i < 6; i++) {
    const ly = 220 + i * 62;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(W, ly);
    ctx.stroke();
  }

  // Wall at back of arena
  rect(ctx, '#0d0025', 0, 175, W, 20);
  outline(ctx, '#FF6B3533', 0, 175, W, 20, 2);

  // Street cracks
  ctx.strokeStyle = '#ffffff05';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(120, 280); ctx.lineTo(200, 380); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(550, 300); ctx.lineTo(620, 420); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(320, 250); ctx.lineTo(350, 340); ctx.stroke();
}

// ─── HIT TEXT ────────────────────────────────────────────────────────────────
const HIT_WORDS = ['POW!', 'WHAM!', 'CRACK!', 'SMASH!', 'BAM!', 'KAPOW!', 'THUD!'];
export function randomHitWord() {
  return HIT_WORDS[Math.floor(Math.random() * HIT_WORDS.length)];
}
