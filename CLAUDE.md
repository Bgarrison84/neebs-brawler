# Neebs Brawler — CLAUDE.md

System Role: You are a Senior Game Developer and character design artist. Your goal build a beat 'em up game like Battle Toads or Double Dragons called Neebs Brawler featuring characters from the Neebs Gaming YouTube channel.

## Project Overview
Beat 'em up game (Battletoads / Double Dragon formula) featuring the Neebs Gaming YouTube crew.
Two parallel implementations that share the same design and mechanics:
- **Web version** — HTML5 Canvas, ES modules, PWA (`/web`)
- **C# version** — MonoGame DesktopGL, publishable as Windows .exe (`/csharp`)
- **Perspective:** 2.5D (XY movement with Z-depth logic)
- **Resolution:** Retro-style pixel art (320x180 upscaled)

**GitHub:** https://github.com/Bgarrison84/neebs-brawler
**Alias:** type `neebs` in terminal to cd + launch Claude

## Coding Standards
- **Architecture:** Use a State Machine for all entities (Idle, Run, Jump, Attack, Hit, Death).
- **Z-Axis Logic:** Use `y` for vertical screen position and a separate `z` variable for jumping/height.
- **Naming:** PascalCase for variables, SCREAMING_SNAKE for Constants/States.
- **Organization:** Keep character logic separate from input handling to facilitate local co-op.

## Project Rules
- All attacks must have "hit-stop" (freeze frames) to emphasize impact.
- Character dialogue/bants should mimic Neebs Gaming humor.
- Never hardcode input keys; use an input mapping system.

---

## Running the Game

### Web (instant, no install)
```bash
cd /home/briston/neebs-brawler/web && python3 -m http.server 8080
# or open web/index.html directly in Windows browser via \\wsl$\Ubuntu\home\briston\neebs-brawler\web\index.html
```

### C# → Windows .exe
```powershell
# In Windows PowerShell:
xcopy /E /I /Y "\\wsl$\Ubuntu\home\briston\neebs-brawler\csharp" "C:\NeebsBrawler"
cd C:\NeebsBrawler
dotnet publish -r win-x64 -c Release --self-contained
# exe at: C:\NeebsBrawler\bin\Release\net8.0\win-x64\publish\NeebsBrawler.exe
```

### Push changes to GitHub
```bash
cd /home/briston/neebs-brawler
git add -A && git commit -m "message" && git push
```

---

## Controls
| Key | Action |
|-----|--------|
| WASD / Arrows | Move (8-dir + depth plane) |
| Z | Punch — 3-hit combo (punch1 → punch2 → punch3) |
| X | Kick — 2-hit combo (kick1 → kick2) |
| Space | Jump |
| C | Grab |
| Space + Z or X | Jump attack |

---

## Architecture

### Coordinate System (Beat 'em up depth plane)
- `worldX` 0–750 → maps 1:1 to screenX
- `worldY` 0–280 (depth) → `screenY = 200 + worldY * 1.18`
- `z` = jump height → `screenY -= z` (visual only, shadow stays at ground)
- Draw order: sort all entities by `worldY` (painter's algorithm)
- Collision uses `worldX/worldY` only; `z` only matters for jump attacks

### State Machines
- **Player states:** idle, walk, jump, punch1/2/3, kick1/2, jumpAtk, hurt, knockback, dead
- **Enemy states:** idle, patrol, chase, attack, hurt, knockback, die
- Each state has a `stateTimer` countdown; transitions happen when it hits 0

### Combat Feel Systems
- **Hitstop** — 3–5 frame entity freeze on hit (makes impacts feel weighty)
- **Input buffering** — 220ms window to queue attacks during recovery frames
- **Combo multiplier** — up to +50% damage at 10-hit chain
- **Invincibility frames** — 10 (light) / 20 (heavy) frames after being hit
- **Screen shake** — scales with hit weight
- **Hit sparks + floating text** — POW / WHAM / CRACK etc.

### File Structure
```
web/
  index.html, css/style.css, sw.js, manifest.json
  js/
    main.js          — game loop entry point
    game.js          — Game class, wave system, draw order, HUD
    input.js         — InputManager (keyboard, input buffer)
    entities/
      player.js      — Player class, combo system, buffs
      enemy.js       — Enemy class, AI state machine
      prop.js        — Prop + Drop classes
    systems/
      combat.js      — CombatSystem (hitbox, damage, hitstop)
      fx.js          — FxSystem (particles, screen shake, text)
    sprites/
      sprites.js     — All draw functions (Neebs, Goon, HeavyGoon, props, drops, BG)

csharp/
  Program.cs, Game1.cs, NeebsBrawler.csproj
  src/
    Player.cs, Enemy.cs, Prop.cs
    CombatSystem.cs, FxSystem.cs, InputManager.cs
    Renderer.cs      — SpriteBatch wrapper (FillRect, OutlineRect, FillEllipse)
    Sprites.cs       — All draw routines (mirrors sprites.js)
    PixelFont.cs     — Self-contained 5×7 pixel font (no MGCB/content pipeline)
    HUD.cs           — HUD rendering using PixelFont
```

---

## Current State — v1 Combat Sandbox (COMPLETE)

### What's working
- Neebs as playable character (orange hoodie, brown hair)
- 2 enemy types: Goon (maroon helmet) and Heavy Goon (purple armored)
- 10 destructible props per wave: trashcans, barrels, crates
- 3 drop types: Health (+20 HP), Speed (3× speed, 5s), Power (1.6× damage, 5s)
- 5 wave patterns looping with increasing enemy counts
- Full combat feel: hitstop, screen shake, particles, combo multiplier, input buffering
- Night city background with perspective grid floor
- HUD: HP bar, score, wave, enemy count, combo display, buff timers
- PWA manifest + service worker (web version)
- Self-contained pixel font renderer — no content pipeline needed (C# version)

### Known Limitations (v1)
- Only 1 playable character (Neebs)
- No sound or music
- No scrolling — single arena only
- No gamepad support yet
- Enemies spawn from edges only (no variety)
- No save/persist (score resets on refresh)

---

## Phase 2 Backlog — Priority Order

### High Priority (gameplay depth)
1. **Character Select** — Add Appsro, Simon, Dora, Thick44 as playable characters
   - Each with unique stats, move sets, and special attacks
   - Appsro: heavy hitter, lab coat, slow but devastating
   - Simon: fast attacker, small hitboxes but rapid combos
   - Dora: agile dodge/counter fighter
   - Thick44: tank — huge HP, slow, ground-pound special
2. **Special Moves / Super Attacks** — Screen-clearing moves (like Battletoads)
   - Meter builds from hits taken and combo count
   - Each character has a unique super (Neebs: "DUDE!" scream stun; Thick44: body slam)
3. **Sound Effects + Music** — Core to beat 'em up feel
   - Punch/kick SFX, enemy grunts, prop smash sounds
   - Chiptune / synth soundtrack with wave-based intensity
   - Web: Web Audio API; C#: MonoGame SoundEffect
4. **Gamepad Support** — Xbox controller mapping (C# version already has MonoGame input)
   - Web: Gamepad API
   - A = jump, X = punch, B = kick, Y = grab, LT = special

### Medium Priority (content + progression)
5. **Side-Scrolling Level** — Move beyond single arena
   - Scrolling alley/street level with checkpoint zones
   - Background layers: buildings, dumpsters, fire escapes
   - Locked camera until area cleared, then advances
6. **Boss Battles** — End-of-level encounters
   - Boss ideas: "The Admin" (corporate villain), "Craziest Dave", enemy commander
   - Multi-phase health bars, special attack patterns, unique weaknesses
7. **More Enemy Types**
   - Knife thrower (ranged), biker (fast charge), armored riot cop (shields)
   - Enemy that grabs and throws the player
8. **Upgrade Shop Between Waves** — Spend score on permanent upgrades
   - Max HP up, combo damage boost, special move unlock
9. **More Prop Variety**
   - Throwable weapons picked up from props (pipe, bottle, chair)
   - Environmental hazards: manhole steam, broken glass, puddles
   - Vehicles: kick a car door open as a shield

### Long Term / Polish
10. **2-Player Co-op** — Local co-op (web: two keyboards; C#: two gamepads)
11. **Story Mode** — Chapter-based progression with Neebs Gaming lore
    - Intro cutscene: the crew gets jumped outside their recording studio
    - Each chapter = new environment (alley → warehouse → rooftop → villain HQ)
12. **Animated Sprites** — Replace canvas-shape characters with frame-by-frame pixel art
    - Proper walk cycles, hit animations, victory poses
    - Consistent 32×48 pixel art style across all characters
13. **Online Leaderboard** — Score submission + top 10 display
14. **Achievement System** — Combo milestones, no-hit waves, speedrun times
15. **Neebs Gaming Easter Eggs**
    - Secret character: "Doraleous" unlocked by entering a code
    - Enemies shout Neebs Gaming catchphrases when defeated
    - Hidden GTA reference level

---

## Design Principles
- **Feel first** — Combat impact (hitstop, shake, sparks) matters more than graphics
- **Neebs Gaming tone** — Goofy, chaotic, self-aware. Not grimdark. Characters should feel like the YouTube personas.
- **Parallel parity** — Web and C# versions should stay feature-equivalent. New mechanics go into both.
- **No external assets for builds** — C# version must build with `dotnet publish` only, no MGCB, no asset downloads.
- **Progressive enhancement** — Each phase adds depth without breaking v1 sandbox fun.
