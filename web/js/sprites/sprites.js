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

// ─── KNIFE THROWER ──────────────────────────────────────────────────────────
// Skinny guy in a trench coat — throws knives from a distance
export function drawKnifeThrower(ctx, x, groundY, facing, state, animT, z = 0, hp = 1, maxHp = 1) {
  const sy = groundY - z;
  shadow(ctx, x, groundY, 14);
  ctx.save();
  setFlip(ctx, x, facing);

  const isThrow = state === 'attack';
  const throwT  = isThrow ? Math.min(animT * 2, 1) : 0;

  // Dark boots
  rect(ctx, '#111111', x - 10, sy - 8,  9, 8);
  rect(ctx, '#111111', x + 1,  sy - 8,  9, 8);

  // Skinny dark pants
  rect(ctx, '#2a2a2a', x - 9, sy - 36, 7, 28);
  rect(ctx, '#2a2a2a', x + 2, sy - 36, 7, 28);

  // Trench coat (dark olive/brown — slim)
  rect(ctx, '#4a4a2a', x - 13, sy - 74, 26, 42);
  rect(ctx, '#3a3a1a', x - 13, sy - 74, 5, 42); // left fold
  rect(ctx, '#5a5a3a', x - 3,  sy - 74, 6, 42); // center highlight
  // Belt
  rect(ctx, '#8B7355', x - 13, sy - 52, 26, 4);

  // Arms (slim)
  rect(ctx, '#4a4a2a', x - 18, sy - 70, 7, 26);
  rect(ctx, '#4a4a2a', x + 11, sy - 70, 7, isThrow ? 18 : 26);

  // Throwing arm extended
  if (isThrow) {
    rect(ctx, '#4a4a2a', x + 11, sy - 52, throwT * 20, 7);
    // Knife (silver)
    const kx = x + 11 + throwT * 20;
    rect(ctx, '#CCCCCC', kx, sy - 54, 14, 3);
    rect(ctx, '#AAAAAA', kx + 10, sy - 56, 4, 7); // handle
  }

  // Head
  rect(ctx, '#FDBCB4', x - 10, sy - 90, 20, 18);

  // Slicked dark hair + stubble
  rect(ctx, '#1a1a1a', x - 10, sy - 90, 20, 7);
  rect(ctx, '#111111', x - 11, sy - 89,  3, 10);
  // Stubble shadow on face
  ctx.globalAlpha = 0.3;
  rect(ctx, '#555', x - 8, sy - 78, 16, 6);
  ctx.globalAlpha = 1;

  // Eyes (shifty)
  rect(ctx, '#1a1a1a', x - 7, sy - 80, 4, 3);
  rect(ctx, '#1a1a1a', x + 3, sy - 80, 4, 3);

  // HP bar
  const barW = 28, barH = 4;
  const bx = x - 14, by = sy - 102;
  rect(ctx, '#330000', bx, by, barW, barH);
  rect(ctx, '#FF6633', bx, by, Math.floor(barW * (hp / maxHp)), barH);

  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 13, sy - 92, 26, 92);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// Knife projectile
export function drawKnife(ctx, x, groundY, angle = 0) {
  const sy = groundY;
  ctx.save();
  ctx.translate(x, sy - 30);
  ctx.rotate(angle);
  rect(ctx, '#CCCCCC', -10, -2, 20, 4);
  rect(ctx, '#AAAAAA', 8, -3, 4, 6);
  rect(ctx, '#DDDDDD', -12, -1, 4, 2);
  ctx.restore();
}

// ─── BIKER ──────────────────────────────────────────────────────────────────
// Stocky biker in leather jacket — fast charging attack
export function drawBiker(ctx, x, groundY, facing, state, animT, z = 0, hp = 1, maxHp = 1) {
  const sy = groundY - z;
  shadow(ctx, x, groundY, 20);
  ctx.save();
  setFlip(ctx, x, facing);

  const isCharge = state === 'attack';
  const chargeLean = isCharge ? 10 : 0;

  // Biker boots (heavy)
  rect(ctx, '#2a1a0a', x - 14, sy - 10, 13, 10);
  rect(ctx, '#2a1a0a', x + 1,  sy - 10, 13, 10);
  rect(ctx, '#1a1208', x - 15, sy - 12, 15, 4);
  rect(ctx, '#1a1208', x + 0,  sy - 12, 15, 4);

  // Jeans
  rect(ctx, '#334499', x - 12, sy - 40, 11, 30);
  rect(ctx, '#4455AA', x + 1,  sy - 40, 11, 30);
  // Chain detail on jeans
  rect(ctx, '#AAAAAA', x - 12, sy - 26, 10, 2);

  // Black leather jacket
  rect(ctx, '#1a1a1a', x - 16, sy - 72, 32, 36);
  rect(ctx, '#2a2a2a', x - 6,  sy - 72, 12, 36); // center panel
  // Jacket details — studs
  rect(ctx, '#888888', x - 14, sy - 70, 3, 3);
  rect(ctx, '#888888', x + 11, sy - 70, 3, 3);
  rect(ctx, '#888888', x - 14, sy - 62, 3, 3);
  rect(ctx, '#888888', x + 11, sy - 62, 3, 3);
  // Skull patch
  rect(ctx, '#FFFFFF', x - 5, sy - 58, 10, 10);
  rect(ctx, '#1a1a1a', x - 3, sy - 54, 6, 4);
  rect(ctx, '#FFFFFF', x - 4, sy - 56, 3, 3);
  rect(ctx, '#FFFFFF', x + 1, sy - 56, 3, 3);

  // Arms (thick leather)
  rect(ctx, '#1a1a1a', x - 23, sy - 68, 9, 28 + (isCharge ? 0 : Math.sin(animT * Math.PI * 2) * 5));
  rect(ctx, '#1a1a1a', x + 14, sy - 68 - chargeLean, 9, 28);
  // Charge fist
  if (isCharge) {
    rect(ctx, '#FDBCB4', x + 20, sy - 56, 12, 12);
  }

  // Head (bandana + shades)
  rect(ctx, '#FDBCB4', x - 12, sy - 90, 24, 20);
  // Bandana (red)
  rect(ctx, '#CC0000', x - 12, sy - 90, 24, 9);
  rect(ctx, '#AA0000', x - 13, sy - 90, 3, 12); // tied knot left
  // Shades
  rect(ctx, '#111111', x - 9, sy - 80, 7, 5);
  rect(ctx, '#111111', x + 2, sy - 80, 7, 5);
  rect(ctx, '#333333', x - 2, sy - 80, 4, 3); // bridge
  // Stubble
  ctx.globalAlpha = 0.4;
  rect(ctx, '#555', x - 8, sy - 70, 16, 8);
  ctx.globalAlpha = 1;

  // HP bar
  const barW = 34, barH = 5;
  const bx = x - 17, by = sy - 104;
  rect(ctx, '#330000', bx, by, barW, barH);
  rect(ctx, '#FF4400', bx, by, Math.floor(barW * (hp / maxHp)), barH);
  outline(ctx, '#550000', bx, by, barW, barH, 1);

  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 16, sy - 92, 32, 92);
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

// ─── SIMON ──────────────────────────────────────────────────────────────────
// Lean/fast attacker — backwards red cap, spiky hair, green hoodie, blue shorts
export function drawSimon(ctx, x, groundY, facing, state, animT, z = 0) {
  const sy = groundY - z;
  shadow(ctx, x, groundY, 16);
  ctx.save();
  setFlip(ctx, x, facing);

  const isPunch = state === 'punch1' || state === 'punch2' || state === 'punch3';
  const isKick  = state === 'kick1'  || state === 'kick2';
  const walkBob = state === 'walk' ? Math.sin(animT * Math.PI * 2) * 7 : 0;
  const punchExt = isPunch ? Math.min(animT * 2.5, 1) * 16 : 0; // snappy fast
  const kickExt  = isKick  ? Math.min(animT * 2.0, 1) * 18 : 0;

  // White sneakers (narrow)
  rect(ctx, '#FFFFFF', x - 10, sy - 8,  9, 8);
  rect(ctx, '#FFFFFF', x + 1,  sy - 8,  9, 8);
  rect(ctx, '#AAAAAA', x - 11, sy - 10, 11, 3);
  rect(ctx, '#AAAAAA', x,      sy - 10, 11, 3);

  // Light blue shorts (short, lean legs)
  rect(ctx, '#6699FF', x - 9, sy - 30, 8, 22);
  rect(ctx, '#5588EE', x + 1, sy - 30, 8, 22);

  // Green hoodie body (slim)
  rect(ctx, '#22AA44', x - 13, sy - 60, 26, 34);
  rect(ctx, '#1A8836', x - 13, sy - 60, 5, 34); // left shading
  // Small pocket
  rect(ctx, '#1A8836', x - 5, sy - 44, 10, 8);
  rect(ctx, '#22AA44', x - 4, sy - 43, 8, 6);

  // Arms (slim + fast)
  rect(ctx, '#22AA44', x - 17, sy - 56, 6, 22 + walkBob);
  rect(ctx, '#22AA44', x + 11, sy - 56, 6, 22 - kickExt);

  // Punch fist (snaps out fast)
  if (isPunch) {
    rect(ctx, '#22AA44', x + 11, sy - 46, punchExt, 6);
    rect(ctx, '#FDBCB4', x + 11 + punchExt, sy - 50, 10, 10);
  }

  // Kick (fast, high)
  if (isKick) {
    const kx = x + 8  + 24 * Math.min(animT * 1.5, 1);
    const ky = sy - 22 - kickExt;
    rect(ctx, '#6699FF', kx, ky - 8, 14, 14);
    rect(ctx, '#FFFFFF', kx + 2, ky, 12, 8);
  }

  // Head (skin, lean)
  rect(ctx, '#FDBCB4', x - 10, sy - 80, 20, 22);

  // Spiky dark hair peeking under cap
  rect(ctx, '#2a1a0a', x - 10, sy - 80, 20, 8);
  rect(ctx, '#1a0e04', x - 4,  sy - 84, 4, 6); // spike left
  rect(ctx, '#1a0e04', x + 2,  sy - 84, 4, 5); // spike mid
  rect(ctx, '#1a0e04', x + 7,  sy - 83, 3, 4); // spike right

  // Red cap (backwards — brim at back)
  rect(ctx, '#CC2200', x - 10, sy - 82, 20, 8); // cap body
  rect(ctx, '#AA1100', x - 14, sy - 80, 5, 4);  // brim going back (left)
  // Cap button on top
  rect(ctx, '#AA1100', x - 2, sy - 85, 4, 4);

  // Eyes (energetic)
  rect(ctx, '#1a1a1a', x - 6, sy - 70, 4, 5);
  rect(ctx, '#1a1a1a', x + 2, sy - 70, 4, 5);
  rect(ctx, '#FFFFFF', x - 5, sy - 69, 2, 2);
  rect(ctx, '#FFFFFF', x + 3, sy - 69, 2, 2);
  // Grin
  rect(ctx, '#CC7755', x - 4, sy - 62, 8, 2);
  rect(ctx, '#FFFFFF', x - 3, sy - 61, 6, 1);

  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 13, sy - 82, 26, 82);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ─── DORA ───────────────────────────────────────────────────────────────────
// Agile counter-fighter — purple jacket, black leggings, dark ponytail
export function drawDora(ctx, x, groundY, facing, state, animT, z = 0) {
  const sy = groundY - z;
  shadow(ctx, x, groundY, 18);
  ctx.save();
  setFlip(ctx, x, facing);

  const isPunch = state === 'punch1' || state === 'punch2' || state === 'punch3';
  const isKick  = state === 'kick1'  || state === 'kick2';
  const walkBob = state === 'walk' ? Math.sin(animT * Math.PI * 2) * 7 : 0;
  const punchExt = isPunch ? Math.min(animT * 2, 1) * 15 : 0;
  const kickExt  = isKick  ? Math.min(animT * 1.6, 1) * 20 : 0;

  // White sneakers
  rect(ctx, '#FFFFFF', x - 11, sy - 8,  10, 8);
  rect(ctx, '#FFFFFF', x + 1,  sy - 8,  10, 8);
  rect(ctx, '#CCCCCC', x - 12, sy - 10, 12, 3);
  rect(ctx, '#CCCCCC', x,      sy - 10, 12, 3);

  // Black leggings
  rect(ctx, '#111111', x - 10, sy - 36, 9, 28);
  rect(ctx, '#1a1a1a', x + 1,  sy - 36, 9, 28);

  // Purple jacket (athletic cut)
  rect(ctx, '#8844CC', x - 14, sy - 68, 28, 36);
  rect(ctx, '#6633AA', x - 14, sy - 68, 6, 36); // left panel
  rect(ctx, '#6633AA', x + 8,  sy - 68, 6, 36); // right panel
  // Jacket zipper
  rect(ctx, '#AAAAAA', x - 1, sy - 68, 2, 30);
  // Collar
  rect(ctx, '#5522AA', x - 6, sy - 68, 12, 6);

  // Arms
  rect(ctx, '#8844CC', x - 20, sy - 64, 8, 26 + walkBob);
  rect(ctx, '#8844CC', x + 12, sy - 64, 8, 26 - kickExt);

  // Punch fist
  if (isPunch) {
    rect(ctx, '#8844CC', x + 12, sy - 52, punchExt, 8);
    rect(ctx, '#FDBCB4', x + 12 + punchExt, sy - 56, 10, 10);
  }

  // Kick
  if (isKick) {
    const kx = x + 8 + 22 * Math.min(animT * 1.4, 1);
    const ky = sy - 26 - kickExt;
    rect(ctx, '#111111', kx, ky - 8, 14, 16);
    rect(ctx, '#FFFFFF', kx + 2, ky, 12, 8);
  }

  // Head
  rect(ctx, '#FDBCB4', x - 11, sy - 90, 22, 24);

  // Dark hair (bun/ponytail base)
  rect(ctx, '#1a1210', x - 11, sy - 90, 22, 10);
  rect(ctx, '#111010', x - 12, sy - 88,  4, 14); // left side
  // Ponytail (goes to the right — back of head)
  rect(ctx, '#1a1210', x - 15, sy - 88, 4, 18); // ponytail body
  rect(ctx, '#111010', x - 16, sy - 85, 3, 12); // ponytail detail
  rect(ctx, '#CC4488', x - 15, sy - 80, 4, 4);  // hair tie (pink)

  // Eyes (sharp, focused)
  rect(ctx, '#1a1a1a', x - 7, sy - 78, 5, 4);
  rect(ctx, '#1a1a1a', x + 2, sy - 78, 5, 4);
  rect(ctx, '#FFFFFF', x - 6, sy - 77, 2, 2);
  rect(ctx, '#FFFFFF', x + 3, sy - 77, 2, 2);
  // Determined mouth (slight smirk)
  rect(ctx, '#CC7755', x - 3, sy - 70, 7, 2);

  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 14, sy - 92, 28, 92);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ─── THICK44 ────────────────────────────────────────────────────────────────
// Tank — massive frame, navy cap, gray tee straining at the seams
export function drawThick44(ctx, x, groundY, facing, state, animT, z = 0) {
  const sy = groundY - z;
  shadow(ctx, x, groundY, 30);
  ctx.save();
  setFlip(ctx, x, facing);

  const isPunch = state === 'punch1' || state === 'punch2' || state === 'punch3';
  const isKick  = state === 'kick1'  || state === 'kick2';
  const walkBob = state === 'walk' ? Math.sin(animT * Math.PI * 2) * 4 : 0;
  const punchExt = isPunch ? Math.min(animT * 0.9, 1) * 20 : 0; // very slow
  const kickExt  = isKick  ? Math.min(animT * 0.8, 1) * 18 : 0;

  // Big dark boots
  rect(ctx, '#1a1a1a', x - 20, sy - 10, 18, 10);
  rect(ctx, '#1a1a1a', x + 2,  sy - 10, 18, 10);
  rect(ctx, '#2a2a2a', x - 22, sy - 13, 20, 5);
  rect(ctx, '#2a2a2a', x + 2,  sy - 13, 20, 5);

  // Wide blue jeans
  rect(ctx, '#3355CC', x - 18, sy - 44, 16, 34);
  rect(ctx, '#4466DD', x - 2,  sy - 44, 16, 34); // lighter right leg
  // Belt
  rect(ctx, '#5C4A2A', x - 18, sy - 46, 36, 5);
  rect(ctx, '#8B7355', x - 4,  sy - 46, 8, 5); // buckle

  // Huge gray t-shirt (straining)
  rect(ctx, '#888888', x - 24, sy - 84, 48, 44);
  rect(ctx, '#999999', x - 12, sy - 84, 24, 44); // lighter center highlight
  // Shirt wrinkle lines (straining seams)
  rect(ctx, '#666666', x - 24, sy - 68, 48, 3);
  rect(ctx, '#666666', x - 24, sy - 54, 48, 2);
  // Neckline
  rect(ctx, '#777777', x - 10, sy - 84, 20, 6);

  // Massive arms
  rect(ctx, '#888888', x - 34, sy - 80, 12, 36 + walkBob);
  rect(ctx, '#888888', x + 22, sy - 80, 12, 36 - kickExt);

  // HUGE fist
  if (isPunch) {
    rect(ctx, '#888888', x + 22, sy - 64, punchExt, 12);
    rect(ctx, '#FDBCB4', x + 22 + punchExt, sy - 70, 18, 18);
  }

  // Ground stomp kick
  if (isKick) {
    const kx = x + 8 + 20 * Math.min(animT * 0.9, 1);
    const ky = sy - 18 - kickExt;
    rect(ctx, '#3355CC', kx - 2, ky - 10, 24, 22);
    rect(ctx, '#1a1a1a', kx, ky, 20, 12);
  }

  // Big head
  rect(ctx, '#FDBCB4', x - 16, sy - 104, 32, 24);

  // Short dark hair (sides shaved, bit on top)
  rect(ctx, '#2a1a0a', x - 16, sy - 104, 32, 8);
  rect(ctx, '#1a0e04', x - 14, sy - 106, 8, 6); // left top tuft
  rect(ctx, '#1a0e04', x + 6,  sy - 106, 8, 4); // right top tuft

  // Navy blue baseball cap (forward)
  rect(ctx, '#1a3a6a', x - 16, sy - 106, 32, 10);
  rect(ctx, '#0a2a5a', x + 12, sy - 102, 10, 5); // brim (forward)
  // Cap button
  rect(ctx, '#0a2a5a', x - 2, sy - 109, 4, 4);

  // Eyes (small relative to huge head)
  rect(ctx, '#1a1a1a', x - 8, sy - 90, 5, 5);
  rect(ctx, '#1a1a1a', x + 3, sy - 90, 5, 5);
  rect(ctx, '#FFFFFF', x - 7, sy - 89, 2, 2);
  rect(ctx, '#FFFFFF', x + 4, sy - 89, 2, 2);
  // Big wide grin
  rect(ctx, '#CC7755', x - 7, sy - 80, 14, 3);
  rect(ctx, '#FFFFFF', x - 6, sy - 79, 12, 2);

  // HP bar above head
  const barW = 48, barH = 6;

  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 24, sy - 108, 48, 108);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ─── APPSRO ─────────────────────────────────────────────────────────────────
// Lab coat, wild dark hair, glasses, heavy frame — devastating slow puncher
export function drawAppsro(ctx, x, groundY, facing, state, animT, z = 0) {
  const sy = groundY - z;
  shadow(ctx, x, groundY, 22);
  ctx.save();
  setFlip(ctx, x, facing);

  const isPunch = state === 'punch1' || state === 'punch2' || state === 'punch3';
  const isKick  = state === 'kick1'  || state === 'kick2';
  const walkBob = state === 'walk' ? Math.sin(animT * Math.PI * 2) * 6 : 0;
  const punchExt = isPunch ? Math.min(animT * 1.5, 1) * 18 : 0;
  const kickExt  = isKick  ? Math.min(animT * 1.2, 1) * 20 : 0;

  // Dark dress shoes
  rect(ctx, '#1a1212', x - 16, sy - 8,  14, 8);
  rect(ctx, '#1a1212', x + 2,  sy - 8,  14, 8);
  rect(ctx, '#2a2020', x - 18, sy - 10, 16, 4);
  rect(ctx, '#2a2020', x + 2,  sy - 10, 16, 4);

  // Charcoal slacks (show below coat hem)
  rect(ctx, '#2a2a3a', x - 14, sy - 40, 12, 30);
  rect(ctx, '#2a2a3a', x + 2,  sy - 40, 12, 30);

  // Lab coat body (wide, off-white)
  rect(ctx, '#E8E8E8', x - 20, sy - 78, 40, 44);
  rect(ctx, '#D0D0D0', x - 20, sy - 78, 8, 32);   // left lapel shadow
  rect(ctx, '#D0D0D0', x + 12, sy - 78, 8, 32);   // right lapel shadow
  // Inner shirt + tie
  rect(ctx, '#224488', x - 6,  sy - 74, 12, 20);
  rect(ctx, '#CC2200', x - 2,  sy - 74, 4, 14);
  // Buttons
  rect(ctx, '#AAAAAA', x - 1, sy - 56, 2, 2);
  rect(ctx, '#AAAAAA', x - 1, sy - 50, 2, 2);
  // Breast pocket + pen
  rect(ctx, '#CCCCCC', x + 10, sy - 68, 8, 10);
  rect(ctx, '#333388', x + 13, sy - 68, 2, 8);

  // Arms (coat sleeves)
  rect(ctx, '#E0E0E0', x - 28, sy - 74, 10, 32 + walkBob);
  rect(ctx, '#E0E0E0', x + 18, sy - 74, 10, 32 - kickExt);

  // Punch — arm extends, heavy fist
  if (isPunch) {
    rect(ctx, '#E0E0E0', x + 18, sy - 60, punchExt, 10); // extending sleeve
    rect(ctx, '#FDBCB4', x + 18 + punchExt, sy - 64, 14, 14); // big fist
  }

  // Kick — slow heavy boot
  if (isKick) {
    const kx = x + 8  + 22 * Math.min(animT, 1);
    const ky = sy - 24 - kickExt;
    rect(ctx, '#2a2a3a', kx, ky - 8,  18, 18);
    rect(ctx, '#1a1212', kx + 2, ky,  14, 10);
  }

  // Head
  rect(ctx, '#FDBCB4', x - 14, sy - 98, 28, 22);

  // Wild dark hair
  rect(ctx, '#1a1a1a', x - 14, sy - 98, 28, 10);
  rect(ctx, '#111111', x - 16, sy - 96,  6, 16);
  rect(ctx, '#111111', x + 10, sy - 96,  6, 14);
  rect(ctx, '#222222', x - 18, sy - 92,  4, 8);
  rect(ctx, '#222222', x + 14, sy - 92,  4, 6);
  rect(ctx, '#111111', x - 6,  sy - 102, 4, 6);
  rect(ctx, '#111111', x + 2,  sy - 102, 4, 4);

  // Eyes
  rect(ctx, '#1a1a1a', x - 9, sy - 84, 5, 4);
  rect(ctx, '#1a1a1a', x + 4, sy - 84, 5, 4);
  rect(ctx, '#FFFFFF', x - 8, sy - 83, 2, 2);
  rect(ctx, '#FFFFFF', x + 5, sy - 83, 2, 2);

  // Glasses (rectangular frames)
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 11, sy - 88, 9, 7);
  ctx.strokeRect(x + 2,  sy - 88, 9, 7);
  rect(ctx, '#111111', x - 2,  sy - 86, 4, 2); // bridge
  rect(ctx, '#111111', x - 13, sy - 86, 2, 3); // left temple
  rect(ctx, '#111111', x + 11, sy - 86, 2, 3); // right temple

  // Smirk
  rect(ctx, '#CC7755', x - 4, sy - 78, 8, 2);

  // HP bar above head
  if (ctx._showHpBar) {
    // Called from charselect preview — skip hp bar
  }

  // Hurt flash
  if (state === 'hurt') {
    ctx.globalAlpha = 0.5;
    rect(ctx, '#FFFFFF', x - 20, sy - 104, 40, 104);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── HIT TEXT ────────────────────────────────────────────────────────────────
const HIT_WORDS = ['POW!', 'WHAM!', 'CRACK!', 'SMASH!', 'BAM!', 'KAPOW!', 'THUD!'];
export function randomHitWord() {
  return HIT_WORDS[Math.floor(Math.random() * HIT_WORDS.length)];
}
