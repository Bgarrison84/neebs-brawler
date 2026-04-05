using Microsoft.Xna.Framework;
using System.Collections.Generic;

namespace NeebsBrawler;

public class CombatSystem
{
    public int HitstopFrames { get; private set; }
    public bool IsFrozen => HitstopFrames > 0;

    private static bool Overlaps(Rectangle a, Rectangle b)
        => a.Left < b.Right && a.Right > b.Left && a.Top < b.Bottom && a.Bottom > b.Top;

    private static bool DepthOverlap(float ya, float yb, float range = 32)
        => MathF.Abs(ya - yb) < range;

    private static Rectangle Hitbox(IEntity e)
        => new Rectangle((int)(e.X - e.HitW / 2), (int)(e.Y - e.HitH), e.HitW, e.HitH);

    private static Rectangle AttackBox(IEntity e)
    {
        int ax = e.Facing > 0 ? (int)e.X : (int)(e.X - e.AttackReach);
        return new Rectangle(ax, (int)(e.Y - e.AttackYOff - e.AttackHeight), e.AttackReach, e.AttackHeight);
    }

    public bool ApplyHit(IEntity attacker, IEntity target, int damage, bool heavy = false)
    {
        if (target.InvFrames > 0 || target.Hp <= 0) return false;

        target.Hp = Math.Max(0, target.Hp - damage);
        HitstopFrames = heavy ? 5 : 3;

        target.VX = attacker.Facing * (heavy ? 6f : 3f);
        target.VY = heavy ? (new System.Random().NextSingle() - 0.5f) * 3 : 0;
        if (heavy) target.VZ = 4;

        target.SetState(heavy ? "knockback" : "hurt", heavy ? 28 : 14);
        target.InvFrames = heavy ? 20 : 10;

        return true;
    }

    public void ResolvePlayerAttacks(Player player, List<Enemy> enemies, List<Prop> props, FxSystem fx)
    {
        if (!player.IsAttacking) return;
        var atk = AttackBox(player);

        foreach (var e in enemies)
        {
            if (e.Hp <= 0 || e.HitThisSwing || !DepthOverlap(player.Y, e.Y)) continue;
            if (!Overlaps(atk, Hitbox(e))) continue;

            int dmg = player.CurrentAttackDamage;
            bool heavy = player.IsHeavyAttack;
            if (ApplyHit(player, e, dmg, heavy))
            {
                e.HitThisSwing = true;
                fx.AddHitSpark(e.X + player.Facing * 16, e.Y - 40,
                    heavy ? Color.OrangeRed : Color.Gold, heavy ? 12 : 7);
                fx.AddHitText(e.X, e.Y - 80, null,
                    heavy ? Color.OrangeRed : Color.Gold, heavy ? 1.4f : 1f);
                fx.AddDamageNum((int)e.X, (int)(e.Y - 90), dmg);
                fx.AddShake(heavy ? 5 : 2, heavy ? 8 : 4);
            }
        }

        foreach (var p in props)
        {
            if (p.Dead || p.HitThisSwing || !DepthOverlap(player.Y, p.Y, 36)) continue;
            if (!Overlaps(atk, Hitbox(p))) continue;

            p.Hp -= player.CurrentAttackDamage;
            p.HitThisSwing = true;
            p.ShakeT = 8;
            fx.AddHitSpark(p.X, p.Y - 20, Color.Gray, 5);
            if (p.Hp <= 0)
            {
                p.Dead = true;
                fx.AddBreakParticles(p.X, p.Y, p.Color1, p.Color2);
                fx.AddShake(4, 8);
            }
        }
    }

    public void ResolveEnemyAttacks(List<Enemy> enemies, Player player, FxSystem fx)
    {
        if (player.InvFrames > 0) return;
        foreach (var e in enemies)
        {
            if (e.State != "attack" || !e.AttackActive || e.HitPlayerThisSwing) continue;
            if (!DepthOverlap(e.Y, player.Y)) continue;
            if (!Overlaps(AttackBox(e), Hitbox(player))) continue;

            if (ApplyHit(e, player, e.AttackDamage))
            {
                e.HitPlayerThisSwing = true;
                fx.AddHitSpark(player.X - e.Facing * 10, player.Y - 40, Color.Red, 7);
                fx.AddDamageNum((int)player.X, (int)(player.Y - 100), e.AttackDamage);
                fx.AddShake(3, 6);
            }
        }
    }

    public void Update() { if (HitstopFrames > 0) HitstopFrames--; }
}

/// <summary>Common interface so CombatSystem can address both Player and Enemy.</summary>
public interface IEntity
{
    float X { get; }
    float Y { get; }
    float VX { get; set; }
    float VY { get; set; }
    float VZ { get; set; }
    int Facing { get; }
    int Hp { get; set; }
    int InvFrames { get; set; }
    int HitW { get; }
    int HitH { get; }
    int AttackReach { get; }
    int AttackHeight { get; }
    int AttackYOff { get; }
    void SetState(string state, int dur);
}
