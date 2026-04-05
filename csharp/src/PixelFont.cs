using Microsoft.Xna.Framework;
using System;
using System.Collections.Generic;

namespace NeebsBrawler;

/// <summary>
/// Self-contained 5×7 pixel font. No content pipeline, no font files.
/// Each glyph is 7 rows of 5-bit masks (bit 4 = leftmost pixel).
/// </summary>
public class PixelFont
{
    private readonly Renderer _r;

    public const int CharW   = 5;
    public const int CharH   = 7;
    public const int Spacing = 1; // pixels between chars

    public PixelFont(Renderer r) { _r = r; }

    public void Draw(string text, int x, int y, Color color, float scale = 2f)
    {
        int cx = x;
        int ps = (int)MathF.Max(1, scale); // pixel size
        foreach (char c in text.ToUpperInvariant())
        {
            if (c == ' ') { cx += (CharW + Spacing) * ps; continue; }
            if (!Glyphs.TryGetValue(c, out var g)) { cx += (CharW + Spacing) * ps; continue; }

            for (int row = 0; row < 7; row++)
                for (int col = 0; col < 5; col++)
                    if ((g[row] & (1 << (4 - col))) != 0)
                        _r.FillRect(cx + col * ps, y + row * ps, ps, ps, color);

            cx += (CharW + Spacing) * ps;
        }
    }

    public void DrawShadowed(string text, int x, int y, Color color, float scale = 2f)
    {
        Draw(text, x + (int)MathF.Max(1, scale / 2), y + (int)MathF.Max(1, scale / 2),
             new Color(0, 0, 0, 180), scale);
        Draw(text, x, y, color, scale);
    }

    public int MeasureWidth(string text, float scale = 2f)
        => (int)(text.Length * (CharW + Spacing) * MathF.Max(1, scale));

    public void DrawCentered(string text, int cx, int y, Color color, float scale = 2f)
        => Draw(text, cx - MeasureWidth(text, scale) / 2, y, color, scale);

    public void DrawRight(string text, int rx, int y, Color color, float scale = 2f)
        => Draw(text, rx - MeasureWidth(text, scale), y, color, scale);

    // ── Glyph data ────────────────────────────────────────────────────────────
    // 7 rows per char, each row = 5-bit mask
    private static readonly Dictionary<char, byte[]> Glyphs = new()
    {
        [' '] = new byte[]{ 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000 },
        ['0'] = new byte[]{ 0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110 },
        ['1'] = new byte[]{ 0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110 },
        ['2'] = new byte[]{ 0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111 },
        ['3'] = new byte[]{ 0b11111, 0b00001, 0b00010, 0b00110, 0b00001, 0b10001, 0b01110 },
        ['4'] = new byte[]{ 0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010 },
        ['5'] = new byte[]{ 0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110 },
        ['6'] = new byte[]{ 0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110 },
        ['7'] = new byte[]{ 0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000 },
        ['8'] = new byte[]{ 0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110 },
        ['9'] = new byte[]{ 0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100 },
        ['A'] = new byte[]{ 0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001 },
        ['B'] = new byte[]{ 0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110 },
        ['C'] = new byte[]{ 0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110 },
        ['D'] = new byte[]{ 0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110 },
        ['E'] = new byte[]{ 0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111 },
        ['F'] = new byte[]{ 0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000 },
        ['G'] = new byte[]{ 0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111 },
        ['H'] = new byte[]{ 0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001 },
        ['I'] = new byte[]{ 0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110 },
        ['J'] = new byte[]{ 0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100 },
        ['K'] = new byte[]{ 0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001 },
        ['L'] = new byte[]{ 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111 },
        ['M'] = new byte[]{ 0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001 },
        ['N'] = new byte[]{ 0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001 },
        ['O'] = new byte[]{ 0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110 },
        ['P'] = new byte[]{ 0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000 },
        ['Q'] = new byte[]{ 0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101 },
        ['R'] = new byte[]{ 0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001 },
        ['S'] = new byte[]{ 0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110 },
        ['T'] = new byte[]{ 0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100 },
        ['U'] = new byte[]{ 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110 },
        ['V'] = new byte[]{ 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100 },
        ['W'] = new byte[]{ 0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001 },
        ['X'] = new byte[]{ 0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001 },
        ['Y'] = new byte[]{ 0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100 },
        ['Z'] = new byte[]{ 0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111 },
        ['!'] = new byte[]{ 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100 },
        ['.'] = new byte[]{ 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100 },
        [','] = new byte[]{ 0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b00100, 0b01000 },
        [':'] = new byte[]{ 0b00000, 0b00100, 0b00000, 0b00000, 0b00000, 0b00100, 0b00000 },
        ['/'] = new byte[]{ 0b00001, 0b00010, 0b00100, 0b00100, 0b01000, 0b10000, 0b00000 },
        ['-'] = new byte[]{ 0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000 },
        ['+'] = new byte[]{ 0b00000, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0b00000 },
        ['%'] = new byte[]{ 0b11000, 0b11001, 0b00010, 0b00100, 0b01000, 0b10011, 0b00011 },
        ['#'] = new byte[]{ 0b01010, 0b01010, 0b11111, 0b01010, 0b11111, 0b01010, 0b01010 },
        ['?'] = new byte[]{ 0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100 },
        ['*'] = new byte[]{ 0b00000, 0b10101, 0b01110, 0b11111, 0b01110, 0b10101, 0b00000 },
    };
}
