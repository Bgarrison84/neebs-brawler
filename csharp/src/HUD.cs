using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;

namespace NeebsBrawler;

public class HUD
{
    private readonly PixelFont _font;
    private readonly Renderer  _r;

    public HUD(PixelFont font, Renderer r)
    {
        _font = font;
        _r    = r;
    }

    public void Draw(Player player, int wave, int enemyCount, int score,
                     string waveState, int waveClearTimer)
    {
        const int W = 800, H = 580;

        // ── HP bar ────────────────────────────────────────────────────────────
        const int hpBarW = 220, hpBarH = 18, hpX = 20, hpY = 24;
        _r.FillRect(hpX - 2, hpY - 2, hpBarW + 4, hpBarH + 4, Color.Black);
        float ratio = (float)player.Hp / player.MaxHp;
        Color hpColor = ratio > 0.5f ? new Color(34, 221, 68, 255)
                      : ratio > 0.25f ? Color.Orange : Color.Red;
        _r.FillRect(hpX, hpY, (int)(hpBarW * ratio), hpBarH, hpColor);
        _r.OutlineRect(hpX, hpY, hpBarW, hpBarH, new Color(0xFF, 0x6B, 0x35, 255), 2);

        _font.DrawShadowed("NEEBS",               hpX, hpY - 18, new Color(0xFF, 0x6B, 0x35, 255), 2);
        _font.DrawShadowed($"HP {player.Hp}/{player.MaxHp}", hpX + 6, hpY + 5, Color.White, 1.5f);

        // ── Score ─────────────────────────────────────────────────────────────
        _font.DrawShadowed("SCORE",          W - 20 - _font.MeasureWidth("SCORE", 1.5f), 10, new Color(0xAA, 0x88, 0x00, 255), 1.5f);
        _font.DrawShadowed($"{score:D7}",    W - 20 - _font.MeasureWidth($"{score:D7}", 2), 24, Color.Gold, 2);

        // ── Wave / enemies ────────────────────────────────────────────────────
        string waveStr = $"WAVE {wave + 1}";
        string enemStr = $"ENEMIES: {enemyCount}";
        _font.DrawShadowed(waveStr, W / 2 - _font.MeasureWidth(waveStr, 2) / 2, 10, Color.LightGray, 2);
        _font.DrawShadowed(enemStr, W / 2 - _font.MeasureWidth(enemStr, 1.5f) / 2, 28, new Color(0xFF, 0x66, 0x66, 255), 1.5f);

        // ── Combo ─────────────────────────────────────────────────────────────
        if (player.ComboCount >= 3)
        {
            int c = player.ComboCount;
            Color cc = c >= 8 ? Color.Red : c >= 5 ? Color.Orange : Color.Gold;
            string comboStr = $"{c} COMBO!";
            float cs = c >= 8 ? 3f : c >= 5 ? 2.5f : 2f;
            _font.DrawShadowed(comboStr, W / 2 - _font.MeasureWidth(comboStr, cs) / 2, 52, cc, cs);
        }

        // ── Buffs ─────────────────────────────────────────────────────────────
        int bx = 20;
        if (player.SpeedBuff > 0)
        {
            string s = $"SPEED {player.SpeedBuff / 60 + 1}S";
            _font.DrawShadowed(s, bx, 50, Color.Cyan, 1.5f);
            bx += _font.MeasureWidth(s, 1.5f) + 10;
        }
        if (player.PowerBuff > 0)
        {
            _font.DrawShadowed($"POWER {player.PowerBuff / 60 + 1}S", bx, 50, Color.OrangeRed, 1.5f);
        }

        // ── Wave clear overlay ────────────────────────────────────────────────
        if (waveState == "wave_clear")
        {
            _r.FillRect(W / 2 - 210, H / 2 - 40, 420, 80, new Color(0, 0, 0, 200));
            string wc = "WAVE CLEAR!";
            _font.DrawShadowed(wc, W / 2 - _font.MeasureWidth(wc, 3) / 2, H / 2 - 28, Color.Gold, 3);
            string nxt = $"WAVE {wave + 2} INCOMING...";
            _font.DrawShadowed(nxt, W / 2 - _font.MeasureWidth(nxt, 1.5f) / 2, H / 2 + 18, Color.White, 1.5f);
        }

        // ── Game over ─────────────────────────────────────────────────────────
        if (waveState == "game_over")
        {
            _r.FillRect(0, 0, W, H, new Color(0, 0, 0, 190));
            string go = "GAME OVER";
            _font.DrawShadowed(go, W / 2 - _font.MeasureWidth(go, 4) / 2, H / 2 - 40, Color.Red, 4);
            string sc = $"FINAL SCORE: {score}";
            _font.DrawShadowed(sc, W / 2 - _font.MeasureWidth(sc, 2) / 2, H / 2 + 20, Color.Gold, 2);
            string quit = "PRESS ESCAPE TO QUIT";
            _font.DrawShadowed(quit, W / 2 - _font.MeasureWidth(quit, 1.5f) / 2, H / 2 + 50, Color.LightGray, 1.5f);
        }
    }
}
