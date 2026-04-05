using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using System.Collections.Generic;

namespace NeebsBrawler;

public class Particle
{
    public float X, Y, VX, VY, Gravity;
    public float Life, MaxLife, Size, Rot, RotV;
    public Color Color;
    public bool IsChunk;
}

public class FloatText
{
    public float X, Y, VY, Life, Scale;
    public string Text = "";
    public Color Color;
}

public class FxSystem
{
    private readonly List<Particle>  _particles = new();
    private readonly List<FloatText> _texts     = new();

    public float ShakeX, ShakeY;
    private float _shakeDur, _shakeStr;

    private static readonly string[] HitWords = { "POW!", "WHAM!", "CRACK!", "SMASH!", "BAM!", "KAPOW!" };
    private static readonly System.Random _rng = new();

    public void AddShake(float strength, float dur = 12)
    {
        if (strength > _shakeStr) { _shakeStr = strength; _shakeDur = dur; }
    }

    public void AddHitSpark(float x, float y, Color c, int count = 8)
    {
        for (int i = 0; i < count; i++)
        {
            float angle = (float)(_rng.NextDouble() * MathF.PI * 2);
            float spd   = 2 + (float)_rng.NextDouble() * 4;
            _particles.Add(new Particle
            {
                X = x, Y = y,
                VX = MathF.Cos(angle) * spd, VY = MathF.Sin(angle) * spd - 2,
                Life = 1, MaxLife = 0.6f + (float)_rng.NextDouble() * 0.4f,
                Color = c, Size = 2 + (float)_rng.NextDouble() * 3,
            });
        }
    }

    public void AddBreakParticles(float x, float y, Color c1, Color c2, int count = 14)
    {
        for (int i = 0; i < count; i++)
        {
            float angle = -(float)(MathF.PI + _rng.NextDouble() * MathF.PI);
            float spd   = 3 + (float)_rng.NextDouble() * 5;
            _particles.Add(new Particle
            {
                X = x + (float)(_rng.NextDouble() - 0.5) * 20,
                Y = y - (float)_rng.NextDouble() * 20,
                VX = MathF.Cos(angle) * spd, VY = MathF.Sin(angle) * spd,
                Gravity = 0.3f,
                Life = 1, MaxLife = 0.8f + (float)_rng.NextDouble() * 0.6f,
                Color = _rng.NextDouble() > 0.5 ? c1 : c2,
                Size = 4 + (float)_rng.NextDouble() * 6,
                Rot = (float)(_rng.NextDouble() * MathF.PI * 2),
                RotV = (float)(_rng.NextDouble() - 0.5) * 0.3f,
                IsChunk = true,
            });
        }
    }

    public void AddDeathBurst(float x, float y)
    {
        AddShake(6, 10);
        AddBreakParticles(x, y - 40, Color.OrangeRed, Color.Orange, 20);
    }

    public void AddPickupFlash(float x, float y, Color c)
    {
        for (int i = 0; i < 16; i++)
        {
            float angle = (i / 16f) * MathF.PI * 2;
            float spd   = 2 + (float)_rng.NextDouble() * 3;
            _particles.Add(new Particle
            {
                X = x, Y = y, VX = MathF.Cos(angle) * spd, VY = MathF.Sin(angle) * spd - 3,
                Life = 1, MaxLife = 0.5f, Color = c, Size = 3 + (float)_rng.NextDouble() * 4,
            });
        }
    }

    public void AddHitText(float x, float y, string? text = null, Color? color = null, float scale = 1f)
    {
        _texts.Add(new FloatText
        {
            X = x, Y = y, Text = text ?? HitWords[_rng.Next(HitWords.Length)],
            Color = color ?? Color.Gold, Life = 1, VY = -1.5f, Scale = scale,
        });
    }

    public void AddDamageNum(float x, float y, int dmg)
    {
        _texts.Add(new FloatText
        {
            X = x + (float)(_rng.NextDouble() - 0.5) * 20, Y = y,
            Text = $"-{dmg}", Color = Color.OrangeRed, Life = 1, VY = -2, Scale = 0.8f,
        });
    }

    public void AddBuffText(float x, float y, string name)
    {
        _texts.Add(new FloatText
        {
            X = x, Y = y, Text = $"+{name}!",
            Color = new Color(0, 255, 170, 255), Life = 1, VY = -2, Scale = 1.1f,
        });
    }

    public void Update(float dt)
    {
        // Shake
        if (_shakeDur > 0)
        {
            _shakeDur -= dt * 60;
            float s = _shakeStr * (_shakeDur / 12f);
            ShakeX = (float)(_rng.NextDouble() - 0.5) * s;
            ShakeY = (float)(_rng.NextDouble() - 0.5) * s;
            if (_shakeDur <= 0) { ShakeX = ShakeY = 0; }
        }

        for (int i = _particles.Count - 1; i >= 0; i--)
        {
            var p = _particles[i];
            p.X += p.VX; p.Y += p.VY;
            if (p.Gravity > 0) p.VY += p.Gravity;
            p.VX *= 0.92f;
            p.Life -= dt / p.MaxLife;
            p.Rot += p.RotV;
            if (p.Life <= 0) _particles.RemoveAt(i);
        }

        for (int i = _texts.Count - 1; i >= 0; i--)
        {
            var t = _texts[i];
            t.Y += t.VY; t.VY *= 0.94f;
            t.Life -= dt * 1.2f;
            if (t.Life <= 0) _texts.RemoveAt(i);
        }
    }

    public void Draw(SpriteBatch sb, Renderer r, SpriteFont font)
    {
        foreach (var p in _particles)
        {
            var alpha = (byte)(MathF.Max(0, p.Life) * 255);
            var c = new Color(p.Color.R, p.Color.G, p.Color.B, alpha);
            r.FillRect((int)(p.X - p.Size/2), (int)(p.Y - p.Size/2), (int)p.Size, (int)p.Size, c);
        }

        foreach (var t in _texts)
        {
            float alpha = MathF.Min(1, t.Life * 2);
            var col = new Color(t.Color.R, t.Color.G, t.Color.B, (byte)(alpha * 255));
            string txt = t.Text;
            var size = font.MeasureString(txt) * t.Scale;
            var pos  = new Vector2(t.X - size.X / 2, t.Y);

            // Shadow
            sb.DrawString(font, txt, pos + new Vector2(2, 2), new Color(0,0,0, (byte)(alpha*200)), 0, Vector2.Zero, t.Scale, SpriteEffects.None, 0);
            sb.DrawString(font, txt, pos, col, 0, Vector2.Zero, t.Scale, SpriteEffects.None, 0);
        }
    }
}
