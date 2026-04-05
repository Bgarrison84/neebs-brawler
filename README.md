# Neebs Brawler

Beat 'em up sandbox inspired by Battletoads / Double Dragon, featuring the Neebs Gaming crew.

## Web Version (`/web`)

Open `web/index.html` directly in a browser, or serve with any static server:
```
cd web && python3 -m http.server 8080
```

### Controls
| Key | Action |
|-----|--------|
| WASD / Arrows | Move (8-dir + depth) |
| Z | Punch (3-hit combo) |
| X | Kick (2-hit combo) |
| Space | Jump |
| C | Grab |
| Space + Z/X | Jump attack |

### Features (v1)
- Neebs as playable character (orange hoodie, brown hair)
- 2 enemy types: **Goon** (maroon helmeted) and **Heavy Goon** (purple armored)
- 10 destructible props per wave: trashcans, barrels, crates
- 3 drop types: **Health** (+20 HP), **Speed** (3x speed 5s), **Power** (1.6× damage 5s)
- Combo multiplier up to +50% damage at 10-hit chain
- Hitstop, screen shake, hit sparks, floating damage numbers, hit words
- 5 wave patterns, looping with increasing difficulty
- Perspective floor grid, night city background

---

## C# / MonoGame Version (`/csharp`)

### Prerequisites
```
dotnet-sdk 8.0+
```

### Build & Run
```
cd csharp
dotnet restore
dotnet run
```

> **Note:** MonoGame requires a display. On WSL2, ensure WSLg is enabled or use Windows Terminal with an X server.  
> The first build will download MonoGame NuGet packages and compile the font via MGCB.

### Controls — same as web version (WASD, Z, X, Space, C)

---

## Architecture

Both versions share the same design:
- **Beat 'em up depth plane**: worldX/worldY mapped to screen, z = jump height
- **State machine** per entity: idle → walk/chase → attack → hurt/knockback → die
- **Hitstop**: brief entity freeze on heavy hits for impact feel
- **Draw order**: painter's algorithm sorted by worldY
- **Combo system**: 3-hit light chain, 2-hit kick chain, window-buffered inputs

## Planned (Phase 2+)
- Character select: Appsro, Simon, Dora, Thick44
- Side-scrolling level with checkpoint zones
- Boss battles (Craziest Dave? The Admin?)
- Sound effects & music
- 2-player co-op
