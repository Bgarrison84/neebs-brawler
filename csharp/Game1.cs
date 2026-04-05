using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using System;
using System.Collections.Generic;

namespace NeebsBrawler;

public class Game1 : Game
{
    private GraphicsDeviceManager _graphics;
    private SpriteBatch           _sb = null!;
    private Renderer              _r  = null!;
    private PixelFont             _font = null!;
    private Texture2D             _bgTex = null!;

    private InputManager   _input   = new();
    private Player         _player  = null!;
    private List<Enemy>    _enemies = new();
    private List<Prop>     _props   = new();
    private List<Drop>     _drops   = new();
    private CombatSystem   _combat  = new();
    private FxSystem       _fx      = new();
    private HUD            _hud     = null!;

    private int    _waveIdx;
    private string _waveState = "playing";
    private int    _waveClearT;
    private int    _totalScore;

    // Arena bounds in world space
    private static readonly Rectangle Arena = new(60, 0, 680, 280); // x,y = min; w,h = range
    private const int ScreenTop   = 200;
    private const float DepthScale = 1.18f;

    // Wave definitions: (type, count, spawnDelay)
    private static readonly (EnemyType type, int count, int delay)[][] Waves =
    {
        new[] { (EnemyType.Goon, 3, 60) },
        new[] { (EnemyType.Goon, 4, 45), (EnemyType.Heavy, 1, 120) },
        new[] { (EnemyType.Goon, 3, 30), (EnemyType.Heavy, 2, 90)  },
        new[] { (EnemyType.Goon, 5, 30), (EnemyType.Heavy, 2, 60)  },
        new[] { (EnemyType.Goon, 4, 20), (EnemyType.Heavy, 3, 50)  },
    };

    private readonly List<(EnemyType type, int countdown)> _pendingSpawns = new();

    private static readonly (PropType t, float x, float y)[] PropLayout =
    {
        (PropType.Trashcan, 110, 60), (PropType.Barrel,   680, 80),
        (PropType.Crate,    150, 180),(PropType.Trashcan, 620, 200),
        (PropType.Barrel,   400, 20), (PropType.Crate,    400, 260),
        (PropType.Trashcan, 280, 120),(PropType.Trashcan, 520, 140),
        (PropType.Barrel,   700, 240),(PropType.Crate,    100, 250),
    };

    private static readonly Random _rng = new();

    public Game1()
    {
        _graphics = new GraphicsDeviceManager(this);
        _graphics.PreferredBackBufferWidth  = 800;
        _graphics.PreferredBackBufferHeight = 580;
        _graphics.ApplyChanges();
        Content.RootDirectory = "Content";
        IsMouseVisible = false;
        Window.Title = "Neebs Brawler";
    }

    protected override void LoadContent()
    {
        _sb   = new SpriteBatch(GraphicsDevice);
        _r    = new Renderer(_sb, GraphicsDevice);
        _font = new PixelFont(_r);
        _hud  = new HUD(_font, _r);

        _bgTex = BuildBackground();
        _player = new Player(400, 200);
        SpawnProps();
        LoadWave(0);
    }

    protected override void Update(GameTime gameTime)
    {
        _input.Update();
        if (_input.IsDown(Keys.Escape)) Exit();

        float dt = (float)gameTime.ElapsedGameTime.TotalSeconds;

        // Pending spawns
        for (int i = _pendingSpawns.Count - 1; i >= 0; i--)
        {
            var (type, cd) = _pendingSpawns[i];
            int newCd = cd - 1;
            if (newCd <= 0) { SpawnEnemy(type); _pendingSpawns.RemoveAt(i); }
            else _pendingSpawns[i] = (type, newCd);
        }

        if (_combat.IsFrozen) { _combat.Update(); _fx.Update(dt); base.Update(gameTime); return; }

        _player.Update(_input, Arena);

        var live = new List<Enemy>();
        foreach (var e in _enemies) { if (!e.Dead) live.Add(e); }
        foreach (var e in live) e.Update(_player, live, Arena);

        // Clear per-swing hit flags each frame
        foreach (var e in live)
        {
            if (e.State != "attack") e.HitThisSwing = false;
        }
        // Props: reset when player not in active attack window
        if (!_player.IsAttacking)
        {
            foreach (var p in _props) p.HitThisSwing = false;
        }

        foreach (var p in _props) p.Update();

        // Drops pickup
        foreach (var d in _drops)
        {
            d.Update();
            if (!d.Dead)
            {
                var (px, py) = ToScreen(_player.X, _player.Y);
                var (dx, dy) = ToScreen(d.X, d.Y);
                if (MathF.Sqrt((px-dx)*(px-dx)+(py-dy)*(py-dy)) < 28)
                {
                    ApplyDrop(d);
                    d.Dead = true;
                    _fx.AddPickupFlash(dx, dy - 14, d.GlowColor);
                    _fx.AddBuffText(dx, dy - 40, d.Type.ToString().ToUpper());
                }
            }
        }
        _drops.RemoveAll(d => d.Dead);

        // Spawn drops from dead props (only once per prop via HashSet guard)
        foreach (var p in _props)
        {
            if (p.Dead && _droppedProps.Add(p))
                _drops.Add(new Drop(p.GetDrop(), p.X, p.Y));
        }

        _combat.ResolvePlayerAttacks(_player, live, _props, _fx);
        _combat.ResolveEnemyAttacks(live, _player, _fx);
        _combat.Update();

        foreach (var e in _enemies)
        {
            if (e.Dead && !e.Scored) { e.Scored = true; _totalScore += e.Score; }
        }
        _enemies.RemoveAll(e => e.Dead && e.State != "die");

        _fx.Update(dt);

        // Wave clear check
        if (_waveState == "playing")
        {
            bool allSpawned = _pendingSpawns.Count == 0;
            bool allDead    = _enemies.TrueForAll(e => e.Hp <= 0 || e.Dead);
            if (allSpawned && (allDead || _enemies.Count == 0))
            {
                _waveState = "wave_clear";
                _waveClearT = 180;
            }
        }

        if (_waveState == "wave_clear")
        {
            if (--_waveClearT <= 0)
            {
                _waveIdx++;
                _enemies.Clear();
                _droppedProps.Clear();
                SpawnProps();
                LoadWave(_waveIdx);
            }
        }

        if (_player.Hp <= 0) _waveState = "game_over";

        base.Update(gameTime);
    }

    private readonly HashSet<Prop> _droppedProps = new();

    protected override void Draw(GameTime gameTime)
    {
        GraphicsDevice.Clear(Color.Black);

        // Background
        _sb.Begin(samplerState: SamplerState.PointClamp);
        _sb.Draw(_bgTex, Vector2.Zero, Color.White);
        _sb.End();

        // World entities — sorted by Y (depth)
        _sb.Begin(samplerState: SamplerState.PointClamp);

        var drawOrder = new List<(float y, Action draw)>();

        foreach (var p in _props)
        {
            var cp = p; // capture
            var (sx, sy) = ToScreen(cp.X, cp.Y);
            drawOrder.Add((cp.Y, () => cp.Draw(_r, sx, sy)));
        }
        foreach (var d in _drops)
        {
            var cd = d;
            var (sx, sy) = ToScreen(cd.X, cd.Y);
            drawOrder.Add((cd.Y, () => cd.Draw(_r, sx, sy)));
        }
        foreach (var e in _enemies)
        {
            if (e.Dead) continue;
            var ce = e;
            var (sx, sy) = ToScreen(ce.X, ce.Y);
            drawOrder.Add((ce.Y, () => ce.Draw(_r, sx, sy)));
        }
        {
            var (sx, sy) = ToScreen(_player.X, _player.Y);
            drawOrder.Add((_player.Y, () => _player.Draw(_r, sx, sy)));
        }

        drawOrder.Sort((a, b) => a.y.CompareTo(b.y));
        foreach (var (_, draw) in drawOrder) draw();

        // FX
        _fx.Draw(_r, _font);

        // HUD
        int living = 0;
        foreach (var e in _enemies) if (e.Hp > 0) living++;
        _hud.Draw(_player, _waveIdx, living, _totalScore, _waveState, _waveClearT);

        _sb.End();

        base.Draw(gameTime);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    static (int sx, int sy) ToScreen(float wx, float wy)
        => ((int)wx, (int)(ScreenTop + wy * DepthScale));

    void SpawnProps()
    {
        _props.Clear();
        foreach (var (t, x, y) in PropLayout)
            _props.Add(new Prop(t, x, y));
    }

    void LoadWave(int idx)
    {
        var wave = Waves[idx % Waves.Length];
        int countdown = 30;
        foreach (var (type, count, delay) in wave)
        {
            for (int i = 0; i < count; i++)
            {
                _pendingSpawns.Add((type, countdown + delay * i));
            }
            countdown += delay * count;
        }
        _waveState = "playing";
    }

    void SpawnEnemy(EnemyType type)
    {
        float side = _rng.NextSingle() > 0.5f ? 1 : -1;
        float x    = side > 0 ? Arena.Right - 10 : Arena.Left + 10;
        float y    = Arena.Top + 30 + _rng.NextSingle() * (Arena.Height - 60);
        var e = new Enemy(type, x, y);
        _enemies.Add(e);
    }

    void ApplyDrop(Drop d)
    {
        switch (d.Type)
        {
            case DropType.Health: _player.Heal(20);               break;
            case DropType.Speed:  _player.ApplyBuff("speed");     break;
            case DropType.Power:  _player.ApplyBuff("power");     break;
        }
    }

    // ── background ───────────────────────────────────────────────────────────
    Texture2D BuildBackground()
    {
        int W = 800, H = 580;
        var data = new Color[W * H];

        // Sky gradient
        for (int y = 0; y < 180; y++)
        {
            float t = y / 179f;
            var c = Color.Lerp(new Color(10, 0, 16, 255), new Color(26, 0, 48, 255), t);
            for (int x = 0; x < W; x++) data[y * W + x] = c;
        }

        // Building silhouettes
        var buildings = new[] {
            new Rectangle(0,   60,  80,  120), new Rectangle(70,  90, 60, 90),
            new Rectangle(120, 40,  50,  140), new Rectangle(160, 70, 70, 110),
            new Rectangle(250, 55,  90,  125), new Rectangle(370, 30, 80, 150),
            new Rectangle(490, 50,  70,  130), new Rectangle(600, 40, 90, 140),
            new Rectangle(680, 65,  75,  115),
        };
        var bldColor = new Color(13, 0, 32, 255);
        foreach (var b in buildings)
            for (int y = b.Top; y < b.Bottom && y < 180; y++)
                for (int x = b.Left; x < b.Right && x < W; x++)
                    data[y * W + x] = bldColor;

        // Windows
        var winColor = new Color(255, 238, 136, 255);
        var windows  = new[] { new Point(15,80), new Point(15,100), new Point(40,80),
                                new Point(130,60),new Point(155,90), new Point(265,70),
                                new Point(290,100),new Point(385,50),new Point(410,80),
                                new Point(500,65), new Point(615,55),new Point(645,85) };
        foreach (var w in windows)
            for (int dy = 0; dy < 5; dy++)
            for (int dx = 0; dx < 6; dx++)
            {
                int px = w.X + dx, py = w.Y + dy;
                if (px < W && py >= 0 && py < 180) data[py * W + px] = winColor;
            }

        // Arena floor
        for (int y = 180; y < H; y++)
        {
            float t = (y - 180f) / (H - 180f);
            var c = Color.Lerp(new Color(26, 26, 46, 255), new Color(15, 28, 53, 255), t);
            for (int x = 0; x < W; x++) data[y * W + x] = c;
        }

        // Wall strip
        var wallC = new Color(13, 0, 37, 255);
        for (int y = 175; y < 195; y++)
            for (int x = 0; x < W; x++)
                data[y * W + x] = wallC;

        // Perspective grid lines (faint)
        var gridC = new Color(255, 255, 255, 12);
        int vanX = W / 2;
        for (int i = 0; i <= 12; i++)
        {
            float bx = W / 12f * i;
            // Draw line from vanishing point to bottom
            for (int y = 195; y < H; y++)
            {
                float t = (y - 195f) / (H - 195f);
                int lx = (int)(vanX + (bx - vanX) * t);
                if (lx >= 0 && lx < W) data[y * W + lx] = Color.Lerp(data[y * W + lx], gridC, 0.3f);
            }
        }

        var tex = new Texture2D(GraphicsDevice, W, H);
        tex.SetData(data);
        return tex;
    }
}
