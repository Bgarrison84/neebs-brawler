using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;

namespace NeebsBrawler;

/// <summary>
/// Lightweight 2D shape renderer built on SpriteBatch + a 1×1 white pixel.
/// Mirrors the canvas draw-call style of the web version.
/// </summary>
public class Renderer
{
    private SpriteBatch _sb;
    private Texture2D   _pixel;

    public Renderer(SpriteBatch sb, GraphicsDevice gd)
    {
        _sb    = sb;
        _pixel = new Texture2D(gd, 1, 1);
        _pixel.SetData(new[] { Color.White });
    }

    public void FillRect(int x, int y, int w, int h, Color c)
        => _sb.Draw(_pixel, new Rectangle(x, y, w, h), c);

    public void FillRect(Rectangle r, Color c)
        => _sb.Draw(_pixel, r, c);

    public void OutlineRect(int x, int y, int w, int h, Color c, int t = 2)
    {
        FillRect(x,         y,         w, t, c); // top
        FillRect(x,         y + h - t, w, t, c); // bottom
        FillRect(x,         y,         t, h, c); // left
        FillRect(x + w - t, y,         t, h, c); // right
    }

    public void FillEllipse(int cx, int cy, int rx, int ry, Color c, int steps = 20)
    {
        // Rasterise with horizontal spans
        for (int py = cy - ry; py <= cy + ry; py++)
        {
            float dy = py - cy;
            float x2 = rx * rx * (1 - (dy * dy) / (ry * ry));
            if (x2 < 0) continue;
            int halfW = (int)System.MathF.Sqrt(x2);
            FillRect(cx - halfW, py, halfW * 2, 1, c);
        }
    }

    /// <summary>Draw shadow ellipse under entity.</summary>
    public void Shadow(int cx, int groundY, int rw = 20)
    {
        var c = new Color(0, 0, 0, 64);
        FillEllipse(cx, groundY + 4, rw, 7, c);
    }
}
