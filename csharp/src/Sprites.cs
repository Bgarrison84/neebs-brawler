using Microsoft.Xna.Framework;

namespace NeebsBrawler;

/// <summary>
/// Sprite draw routines — mirrors sprites/sprites.js.
/// All positions are in screen space. x,y = foot position.
/// facing: +1 right, -1 left (horizontal flip applied by Renderer).
/// </summary>
public static class Sprites
{
    // ── palette ──────────────────────────────────────────────────────────────
    static readonly Color CSkin     = new(0xFD, 0xBC, 0xB4, 255);
    static readonly Color CBrown    = new(0x8B, 0x45, 0x13, 255);
    static readonly Color CDkBrown  = new(0x6B, 0x34, 0x10, 255);
    static readonly Color COrange   = new(0xFF, 0x6B, 0x35, 255);
    static readonly Color CDkOrange = new(0xCC, 0x55, 0x20, 255);
    static readonly Color CJeans    = new(0x41, 0x69, 0xE1, 255);
    static readonly Color CWhite    = Color.White;
    static readonly Color CGray     = new(0xCC, 0xCC, 0xCC, 255);
    static readonly Color CBlack    = Color.Black;
    static readonly Color CDkRed    = new(0x8B, 0x00, 0x00, 255);
    static readonly Color CDkRed2   = new(0x4A, 0x00, 0x00, 255);
    static readonly Color CMaroon   = new(0xCC, 0x00, 0x00, 255);
    static readonly Color CHelmet   = new(0x33, 0x33, 0x33, 255);
    static readonly Color CPurple   = new(0x6B, 0x00, 0x6B, 255);
    static readonly Color CDkPurple = new(0x44, 0x00, 0x44, 255);
    static readonly Color CVisorR   = new(0xFF, 0x44, 0x00, 255);
    static readonly Color CGold     = new(0xFF, 0xD7, 0x00, 255);
    static readonly Color CGreen    = new(0x22, 0xDD, 0x44, 255);
    static readonly Color CRed      = new(0xFF, 0x33, 0x33, 255);
    static readonly Color CCyan     = Color.Cyan;
    static readonly Color CDkGreen  = new(0x2E, 0x7D, 0x32, 255);
    static readonly Color CLtGreen  = new(0x4C, 0xAF, 0x50, 255);

    // ── Neebs ─────────────────────────────────────────────────────────────────
    public static void DrawNeebs(Renderer r, int x, int groundY, int facing,
                                  string state, float animT, float z = 0)
    {
        int sy = groundY - (int)z;
        r.Shadow(x, groundY, 20);

        bool walk   = state == "walk";
        int legSwing = walk ? (int)(System.MathF.Sin(animT * MathF.PI * 2) * 8) : 0;

        bool punching = state is "punch1" or "punch2" or "punch3";
        bool kicking  = state is "kick1" or "kick2";
        float punchT  = punching ? System.MathF.Clamp01(animT) : 0;
        float kickT   = kicking  ? System.MathF.Clamp01(animT) : 0;

        int dir = facing; // +1 or -1

        // Shoes
        r.FillRect(x - 13 * dir - 13, sy - 8, 12, 8, CWhite);
        r.FillRect(x + 1  * dir,       sy - 8, 12, 8, CGray);

        // Jeans
        r.FillRect(x - 12 * dir - 12, sy - 36, 10, 28, CJeans);
        r.FillRect(x + 2  * dir,       sy - 36, 10, 28, new Color(0x33, 0x55, 0xCC, 255));

        // Hoodie
        r.FillRect(x - 16, sy - 68, 32, 36, COrange);
        r.FillRect(x - 7,  sy - 44, 14, 10, CDkOrange);
        r.FillRect(x - 6,  sy - 43, 12, 8,  COrange);

        // Arms
        int armL = sy - 64 + legSwing;
        r.FillRect(x - 20, armL, 8, 24, COrange);
        r.FillRect(x + 12, sy - 64 - (int)(kickT * 16), 8, 24 - (int)(kickT * 16), COrange);

        // Punch fist
        if (punching)
        {
            int px = x + 16 + (int)(punchT * 14);
            r.FillRect(px * dir + x, sy - 52, 10, 10, CSkin);
        }

        // Kick foot
        if (kicking)
        {
            int kx = x + (int)((10 + 20 * kickT) * dir);
            int ky = sy - 28 - (int)(20 * kickT);
            r.FillRect(kx, ky - 8, 16, 16, CJeans);
            r.FillRect(kx + 2, ky, 14, 8, CWhite);
        }

        // Head
        r.FillRect(x - 13, sy - 90, 26, 24, CSkin);
        r.FillRect(x - 13, sy - 90, 26, 10, CBrown);
        r.FillRect(x - 15, sy - 88,  6, 14, CDkBrown);
        r.FillRect(x + 11, sy - 88,  6, 10, CDkBrown);

        // Eyes
        r.FillRect(x - 8, sy - 78, 5, 5, CBlack);
        r.FillRect(x + 3, sy - 78, 5, 5, CBlack);
        r.FillRect(x - 7, sy - 77, 2, 2, CWhite);
        r.FillRect(x + 4, sy - 77, 2, 2, CWhite);

        // Goofy grin
        r.FillRect(x - 5, sy - 70, 10, 3, new Color(0xCC, 0x77, 0x55, 255));
        r.FillRect(x - 4, sy - 69,  8, 2, CWhite);

        // Hurt flash
        if (state == "hurt")
            r.FillRect(x - 16, sy - 92, 32, 92, new Color(255, 255, 255, 128));
    }

    // ── Goon ──────────────────────────────────────────────────────────────────
    public static void DrawGoon(Renderer r, int x, int groundY, int facing,
                                 string state, float animT, float z, float hp, float maxHp)
    {
        int sy = groundY - (int)z;
        r.Shadow(x, groundY, 18);

        bool atk = state == "attack";
        float atkT = atk ? System.MathF.Clamp01(animT) : 0;

        r.FillRect(x - 12, sy - 8,  11, 8, CBlack);
        r.FillRect(x + 1,  sy - 8,  11, 8, CBlack);

        r.FillRect(x - 11, sy - 34, 9, 26, CDkRed2);
        r.FillRect(x + 2,  sy - 34, 9, 26, CDkRed2);

        r.FillRect(x - 14, sy - 62, 28, 32, CDkRed);
        r.OutlineRect(x - 14, sy - 62, 28, 32, CMaroon, 2);

        r.FillRect(x - 20, sy - 60, 8, 22, CDkRed);
        r.FillRect(x + 12, sy - 60, 8, 22, CDkRed);

        if (atk)
        {
            int fx2 = x + 16 + (int)(atkT * 10);
            r.FillRect(fx2, sy - 48, 10, 10, CDkRed2);
        }

        // Helmet
        r.FillRect(x - 13, sy - 88, 26, 28, CHelmet);
        r.FillRect(x - 11, sy - 86, 22, 10, CVisorR);
        r.FillRect(x - 8,  sy - 82, 5, 3, CRed);
        r.FillRect(x + 3,  sy - 82, 5, 3, CRed);

        DrawHpBar(r, x - 16, sy - 102, 32, 5, hp, maxHp, CRed, CDkRed2);

        if (state == "hurt")
            r.FillRect(x - 14, sy - 90, 28, 90, new Color(255, 255, 255, 128));
    }

    // ── Heavy Goon ────────────────────────────────────────────────────────────
    public static void DrawHeavyGoon(Renderer r, int x, int groundY, int facing,
                                      string state, float animT, float z, float hp, float maxHp)
    {
        int sy = groundY - (int)z;
        r.Shadow(x, groundY, 26);

        bool atk = state == "attack";
        float atkT = atk ? System.MathF.Clamp01(animT) : 0;

        r.FillRect(x - 18, sy - 10, 16, 10, new Color(0x11, 0x11, 0x11, 255));
        r.FillRect(x + 2,  sy - 10, 16, 10, new Color(0x11, 0x11, 0x11, 255));

        r.FillRect(x - 16, sy - 40, 14, 30, new Color(0x2A, 0x00, 0x20, 255));
        r.FillRect(x + 2,  sy - 40, 14, 30, new Color(0x2A, 0x00, 0x20, 255));

        r.FillRect(x - 22, sy - 80, 44, 44, CPurple);
        r.OutlineRect(x - 22, sy - 80, 44, 44, new Color(0xAA, 0x00, 0xAA, 255), 3);

        r.FillRect(x - 28, sy - 80, 10, 16, CDkPurple);
        r.FillRect(x + 18, sy - 80, 10, 16, CDkPurple);

        r.FillRect(x - 28, sy - 76, 10, 30, CPurple);
        r.FillRect(x + 18, sy - 76, 10, 30, CPurple);

        if (atk)
        {
            int fx2 = x + 24 + (int)(atkT * 12);
            r.FillRect(fx2, sy - 60, 14, 14, CDkPurple);
        }

        r.FillRect(x - 18, sy - 108, 36, 32, new Color(0x22, 0x22, 0x22, 255));
        r.FillRect(x - 14, sy - 102, 28, 8, CVisorR);

        DrawHpBar(r, x - 21, sy - 120, 42, 6, hp, maxHp, new Color(0xAA, 0x00, 0x00, 255), CDkRed2);

        if (state == "hurt")
            r.FillRect(x - 22, sy - 110, 44, 110, new Color(255, 255, 255, 128));
    }

    static void DrawHpBar(Renderer r, int x, int y, int w, int h,
                           float hp, float maxHp, Color fill, Color bg)
    {
        r.FillRect(x, y, w, h, bg);
        int filled = (int)(w * (hp / maxHp));
        if (filled > 0) r.FillRect(x, y, filled, h, fill);
        r.OutlineRect(x, y, w, h, new Color(0x55, 0x00, 0x00, 255), 1);
    }

    // ── Props ─────────────────────────────────────────────────────────────────
    public static void DrawTrashcan(Renderer r, int x, int groundY, float hp, float maxHp)
    {
        r.Shadow(x, groundY + 2, 16);
        r.FillRect(x - 12, groundY - 42, 24, 40, CDkGreen);
        r.OutlineRect(x - 12, groundY - 42, 24, 40, new Color(0x1B, 0x5E, 0x20, 255), 2);
        r.FillRect(x - 12, groundY - 34, 24, 3, new Color(0x1B, 0x5E, 0x20, 255));
        r.FillRect(x - 12, groundY - 22, 24, 3, new Color(0x1B, 0x5E, 0x20, 255));
        r.FillRect(x - 14, groundY - 44, 28, 6, new Color(0x38, 0x8E, 0x3C, 255));
        r.FillRect(x - 10, groundY - 46, 20, 4, CLtGreen);

        for (int i = 0; i < 3; i++)
        {
            bool full = (hp / maxHp) > (i / 3f);
            r.FillRect(x - 8 + i * 7, groundY - 50, 5, 4,
                full ? new Color(0x66, 0xFF, 0x66, 255) : new Color(0x1B, 0x5E, 0x20, 255));
        }
    }

    public static void DrawBarrel(Renderer r, int x, int groundY, float hp, float maxHp)
    {
        r.Shadow(x, groundY + 2, 18);
        r.FillRect(x - 15, groundY - 48, 30, 46, new Color(0x8B, 0x45, 0x13, 255));
        r.FillRect(x - 10, groundY - 48, 20, 46, new Color(0xA0, 0x52, 0x2D, 255));
        var band = new Color(0x8B, 0x8B, 0x00, 255);
        r.FillRect(x - 15, groundY - 44, 30, 5, band);
        r.FillRect(x - 15, groundY - 20, 30, 5, band);
        r.FillRect(x - 15, groundY - 4,  30, 5, band);
        r.FillRect(x - 15, groundY - 50, 30, 6, new Color(0x6B, 0x34, 0x10, 255));

        // Hazard diamond
        r.FillRect(x - 6, groundY - 28, 12, 12, CGold);
        r.FillRect(x - 4, groundY - 26,  8,  8, CVisorR);
    }

    public static void DrawCrate(Renderer r, int x, int groundY, float hp, float maxHp)
    {
        r.Shadow(x, groundY + 2, 20);
        var wood = new Color(0x8B, 0x73, 0x55, 255);
        var dark = new Color(0x5C, 0x4A, 0x2A, 255);
        var metal = new Color(0x8B, 0x8B, 0x8B, 255);
        r.FillRect(x - 18, groundY - 36, 36, 34, wood);
        r.OutlineRect(x - 18, groundY - 36, 36, 34, dark, 2);
        r.FillRect(x - 18, groundY - 24, 36, 3, dark);
        r.FillRect(x - 6,  groundY - 36,  3, 34, dark);
        r.FillRect(x + 3,  groundY - 36,  3, 34, dark);
        r.FillRect(x - 20, groundY - 38, 6, 6, metal);
        r.FillRect(x + 14, groundY - 38, 6, 6, metal);
        r.FillRect(x - 20, groundY - 4,  6, 6, metal);
        r.FillRect(x + 14, groundY - 4,  6, 6, metal);
    }

    // ── Drops ─────────────────────────────────────────────────────────────────
    public static void DrawHealthDrop(Renderer r, int x, int groundY, float bobT)
    {
        int sy = groundY - 8 - (int)(MathF.Sin(bobT * 0.08f) * 5);
        r.FillRect(x - 14, sy - 14, 28, 28, CRed);
        r.FillRect(x - 10, sy - 10, 20, 20, new Color(255, 100, 100, 255));
        r.FillRect(x - 3, sy - 12, 6, 24, CWhite);
        r.FillRect(x - 12, sy - 3, 24, 6, CWhite);
    }

    public static void DrawSpeedDrop(Renderer r, int x, int groundY, float bobT)
    {
        int sy = groundY - 8 - (int)(MathF.Sin(bobT * 0.08f) * 5);
        r.FillRect(x - 14, sy - 14, 28, 28, new Color(0, 68, 102, 255));
        r.FillRect(x - 10, sy - 10, 20, 20, new Color(0, 153, 187, 255));
        // Lightning bolt (simplified)
        r.FillRect(x - 2, sy - 12, 6, 14, CGold);
        r.FillRect(x - 6, sy - 2,  6, 14, CGold);
    }

    public static void DrawPowerDrop(Renderer r, int x, int groundY, float bobT)
    {
        int sy = groundY - 8 - (int)(MathF.Sin(bobT * 0.08f) * 5);
        r.FillRect(x - 14, sy - 14, 28, 28, new Color(102, 51, 0, 255));
        r.FillRect(x - 10, sy - 10, 20, 20, new Color(153, 68, 0, 255));
        r.FillRect(x - 7, sy - 10, 14, 18, new Color(255, 170, 0, 255));
        r.FillRect(x - 9, sy - 4,  18,  4, new Color(255, 170, 0, 255));
    }
}

// Extension so we can use MathF.Clamp01 conveniently
static class MathFExt
{
    public static float Clamp01(float v) => MathF.Max(0, MathF.Min(1, v));
}
