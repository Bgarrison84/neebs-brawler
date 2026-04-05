using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;

namespace NeebsBrawler;

public class HUD
{
    private SpriteFont _font;
    private SpriteFont _fontBig;
    private Renderer   _r;
    private SpriteBatch _sb;

    public HUD(SpriteFont font, SpriteFont fontBig, Renderer r, SpriteBatch sb)
    {
        _font = font; _fontBig = fontBig; _r = r; _sb = sb;
    }

    public void Draw(Player player, int wave, int enemyCount, int score,
                     string waveState, int waveClearTimer)
    {
        int W = 800, H = 580;

        // HP bar
        int hpBarW = 220, hpBarH = 18;
        int hpX = 20, hpY = 20;
        _r.FillRect(hpX - 2, hpY - 2, hpBarW + 4, hpBarH + 4, Color.Black);
        float ratio = (float)player.Hp / player.MaxHp;
        Color hpColor = ratio > 0.5f ? new Color(34, 221, 68, 255)
                      : ratio > 0.25f ? Color.Orange : Color.Red;
        _r.FillRect(hpX, hpY, (int)(hpBarW * ratio), hpBarH, hpColor);
        _r.OutlineRect(hpX, hpY, hpBarW, hpBarH, new Color(0xFF, 0x6B, 0x35, 255), 2);

        DrawText("NEEBS", hpX, hpY - 4, new Color(0xFF, 0x6B, 0x35, 255));
        DrawText($"HP  {player.Hp}/{player.MaxHp}", hpX + 6, hpY + 13, Color.White);

        // Score
        DrawTextRight($"{score:D7}", W - 20, 36, Color.Gold);
        DrawTextRight("SCORE", W - 20, 18, new Color(0xAA, 0x88, 0x00, 255));

        // Wave / enemies
        DrawTextCenter($"WAVE {wave + 1}", W / 2, 20, Color.LightGray);
        DrawTextCenter($"ENEMIES: {enemyCount}", W / 2, 36, new Color(0xFF, 0x66, 0x66, 255));

        // Combo
        if (player.ComboCount >= 3)
        {
            int c = player.ComboCount;
            Color cc = c >= 8 ? Color.Red : c >= 5 ? Color.Orange : Color.Gold;
            DrawTextCenter($"{c} COMBO!", W / 2, 68, cc, 1.2f);
        }

        // Buffs
        int bx = 20;
        if (player.SpeedBuff > 0)
        {
            DrawText($"SPEED {player.SpeedBuff / 60 + 1}s", bx, 56, Color.Cyan);
            bx += 100;
        }
        if (player.PowerBuff > 0)
        {
            DrawText($"POWER {player.PowerBuff / 60 + 1}s", bx, 56, Color.OrangeRed);
        }

        // Wave clear overlay
        if (waveState == "wave_clear")
        {
            float alpha = System.MathF.Min(1, waveClearTimer / 30f) *
                          System.MathF.Min(1, (180 - waveClearTimer) / 30f);
            _r.FillRect(W/2 - 200, H/2 - 50, 400, 100, new Color(0, 0, 0, (byte)(alpha * 200)));
            DrawTextCenter("WAVE CLEAR!", W/2, H/2 + 8, Color.Gold, 2.0f);
            DrawTextCenter($"WAVE {wave + 2} INCOMING...", W/2, H/2 + 36, Color.White, 0.9f);
        }

        // Game over
        if (waveState == "game_over")
        {
            _r.FillRect(0, 0, W, H, new Color(0, 0, 0, 190));
            DrawTextCenter("GAME OVER", W/2, H/2 - 20, Color.Red, 2.2f);
            DrawTextCenter($"FINAL SCORE: {score}", W/2, H/2 + 24, Color.Gold, 1.1f);
            DrawTextCenter("Press Escape to quit", W/2, H/2 + 58, Color.LightGray, 0.8f);
        }
    }

    void DrawText(string s, int x, int y, Color c, float scale = 1f)
        => _sb.DrawString(_font, s, new Vector2(x, y), c, 0, Vector2.Zero, scale, SpriteEffects.None, 0);

    void DrawTextRight(string s, int rx, int y, Color c, float scale = 1f)
    {
        var size = _font.MeasureString(s) * scale;
        _sb.DrawString(_font, s, new Vector2(rx - size.X, y), c, 0, Vector2.Zero, scale, SpriteEffects.None, 0);
    }

    void DrawTextCenter(string s, int cx, int y, Color c, float scale = 1f)
    {
        var size = _font.MeasureString(s) * scale;
        _sb.DrawString(_font, s, new Vector2(cx - size.X / 2, y), c, 0, Vector2.Zero, scale, SpriteEffects.None, 0);
    }
}
