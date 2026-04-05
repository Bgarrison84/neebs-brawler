using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Input;
using System.Collections.Generic;

namespace NeebsBrawler;

public class InputManager
{
    private KeyboardState _prev, _curr;
    private readonly Dictionary<Keys, long> _buffer = new();
    private const long BufferMs = 220;

    public void Update()
    {
        _prev = _curr;
        _curr = Keyboard.GetState();

        // Buffer attack keys
        foreach (var k in new[] { Keys.Z, Keys.X, Keys.C, Keys.Space })
        {
            if (JustPressed(k))
                _buffer[k] = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }
    }

    public bool IsDown(Keys k)    => _curr.IsKeyDown(k);
    public bool JustPressed(Keys k) => _curr.IsKeyDown(k) && !_prev.IsKeyDown(k);

    /// <summary>Consume one buffered press of key k. Returns true if found.</summary>
    public bool Consume(Keys k)
    {
        var now = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        if (_buffer.TryGetValue(k, out var t) && now - t < BufferMs)
        {
            _buffer.Remove(k);
            return true;
        }
        return false;
    }

    public Vector2 Movement()
    {
        float x = 0, y = 0;
        if (IsDown(Keys.D) || IsDown(Keys.Right)) x += 1;
        if (IsDown(Keys.A) || IsDown(Keys.Left))  x -= 1;
        if (IsDown(Keys.S) || IsDown(Keys.Down))  y += 1;
        if (IsDown(Keys.W) || IsDown(Keys.Up))    y -= 1;
        return new Vector2(x, y);
    }
}
