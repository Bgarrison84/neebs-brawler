using Microsoft.Xna.Framework;
using System;

namespace NeebsBrawler;

public enum PropType { Trashcan, Barrel, Crate }
public enum DropType  { Health, Speed, Power }

public class Prop : IEntity
{
    public PropType Type;
    public float X { get; private set; }
    public float Y { get; private set; }
    public int Hp  { get; set; }
    public int MaxHp;
    public bool Dead;
    public bool HitThisSwing;
    public int ShakeT;
    public Color Color1, Color2;

    // IEntity (props aren't attackers, supply neutral values)
    float IEntity.VX { get => 0; set {} }
    float IEntity.VY { get => 0; set {} }
    float IEntity.VZ { get => 0; set {} }
    int   IEntity.Facing      => 1;
    int   IEntity.InvFrames   { get => 0; set {} }
    int   IEntity.AttackReach  => 0;
    int   IEntity.AttackHeight => 0;
    int   IEntity.AttackYOff   => 0;
    void  IEntity.SetState(string s, int d) {}

    public int HitW { get; }
    public int HitH { get; }

    private static readonly Random _rng = new();

    public Prop(PropType type, float x, float y)
    {
        Type = type;
        X    = x;
        Y    = y;
        (MaxHp, HitW, HitH, Color1, Color2) = type switch
        {
            PropType.Trashcan => (30, 24, 42, new Color(0x2E,0x7D,0x32,255), new Color(0x4C,0xAF,0x50,255)),
            PropType.Barrel   => (50, 30, 48, new Color(0x8B,0x45,0x13,255), Color.Gold),
            _                 => (40, 36, 36, new Color(0x8B,0x73,0x55,255), new Color(0x5C,0x4A,0x2A,255)),
        };
        Hp = MaxHp;
    }

    public DropType GetDrop() => type switch
    {
        PropType.Trashcan => _rng.NextSingle() < 0.8f ? DropType.Health : DropType.Speed,
        PropType.Barrel   => _rng.NextSingle() < 0.5f ? DropType.Health : (_rng.NextSingle() < 0.5f ? DropType.Speed : DropType.Power),
        _                 => _rng.NextSingle() < 0.4f ? DropType.Health : (_rng.NextSingle() < 0.5f ? DropType.Power : DropType.Speed),
    };
    PropType type => Type;

    public void Update() { if (ShakeT > 0) ShakeT--; }

    public void Draw(Renderer r, int sx, int sy)
    {
        int ox = ShakeT > 0 ? (_rng.Next(0, 5) - 2) : 0;
        int tx = sx + ox;
        switch (Type)
        {
            case PropType.Trashcan: Sprites.DrawTrashcan(r, tx, sy, Hp, MaxHp); break;
            case PropType.Barrel:   Sprites.DrawBarrel(r, tx, sy, Hp, MaxHp);   break;
            case PropType.Crate:    Sprites.DrawCrate(r, tx, sy, Hp, MaxHp);    break;
        }
    }
}

public class Drop
{
    public DropType Type;
    public float X, Y;
    public float BobT;
    public int Life = 600;
    public bool Dead;
    public Color GlowColor;

    public Drop(DropType type, float x, float y)
    {
        Type = type;
        X = x; Y = y;
        BobT = new Random().NextSingle() * 100;
        GlowColor = type switch
        {
            DropType.Health => Color.Red,
            DropType.Speed  => Color.Cyan,
            _               => Color.OrangeRed,
        };
    }

    public void Update()
    {
        BobT++;
        if (--Life <= 0) Dead = true;
    }

    public void Draw(Renderer r, int sx, int sy)
    {
        if (Life < 120 && ((int)(BobT / 6)) % 2 == 0) return;
        switch (Type)
        {
            case DropType.Health: Sprites.DrawHealthDrop(r, sx, sy, BobT); break;
            case DropType.Speed:  Sprites.DrawSpeedDrop(r, sx, sy, BobT);  break;
            case DropType.Power:  Sprites.DrawPowerDrop(r, sx, sy, BobT);  break;
        }
    }
}
