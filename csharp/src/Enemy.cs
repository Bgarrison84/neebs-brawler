using Microsoft.Xna.Framework;
using System;
using System.Collections.Generic;

namespace NeebsBrawler;

public enum EnemyType { Goon, Heavy }

public class Enemy : IEntity
{
    public EnemyType Type;
    public float X { get; set; }
    public float Y { get; set; }
    public float Z;
    public float VX { get; set; }
    public float VY { get; set; }
    public float VZ { get; set; }
    public int  Facing { get; private set; } = -1;
    public int  Hp     { get; set; }
    public int  MaxHp;
    public int  InvFrames { get; set; }
    public string State { get; private set; } = "idle";
    public int   StateTimer;
    public float AnimT;
    public bool  Dead;
    public bool  HitThisSwing;
    public bool  HitPlayerThisSwing;
    public bool  AttackActive;
    public int   AttackDamage;
    public int   Score;
    public bool  Scored;

    public int HitW { get; }
    public int HitH { get; }
    public int AttackReach  { get; }
    public int AttackHeight { get; }
    public int AttackYOff   { get; }

    private float _speed, _aggroRange, _attackRange, _attackCooldown;
    private int   _dyingT, _patrolDir;
    private float _patrolTimer;
    private static readonly Random _rng = new();

    public Enemy(EnemyType type, float x, float y)
    {
        Type = type; X = x; Y = y;
        switch (type)
        {
            case EnemyType.Goon:
                MaxHp = 45; _speed = 1.4f; AttackDamage = 8;
                _attackRange = 58; _aggroRange = 300;
                AttackReach = 58; AttackHeight = 28; AttackYOff = 28;
                HitW = 24; HitH = 60; Score = 100;
                break;
            case EnemyType.Heavy:
                MaxHp = 100; _speed = 0.85f; AttackDamage = 16;
                _attackRange = 64; _aggroRange = 250;
                AttackReach = 64; AttackHeight = 36; AttackYOff = 36;
                HitW = 36; HitH = 80; Score = 250;
                break;
        }
        Hp = MaxHp;
        StateTimer = 30 + _rng.Next(60);
        _patrolDir = _rng.NextSingle() > 0.5f ? 1 : -1;
        _patrolTimer = 40 + _rng.Next(40);
    }

    public void SetState(string s, int dur) { State = s; StateTimer = dur; }

    public void Update(Player player, List<Enemy> others, Rectangle bounds)
    {
        if (Dead) return;
        if (InvFrames > 0) InvFrames--;
        if (_attackCooldown > 0) _attackCooldown--;
        AnimT += 0.06f;

        // Velocity (knockback)
        if (VX != 0 || VY != 0)
        {
            X += VX; Y += VY;
            VX *= 0.82f; VY *= 0.82f;
            if (MathF.Abs(VX) < 0.1f) VX = 0;
            if (MathF.Abs(VY) < 0.1f) VY = 0;
        }

        // Jump / air
        if (Z > 0 || VZ > 0)
        {
            Z += VZ; VZ -= 0.5f;
            if (Z <= 0) { Z = 0; VZ = 0; }
        }

        ClampBounds(bounds);
        RunState(player, others);
        Separate(others);
        if (Hp <= 0 && State != "die") SetState("die", 999);
    }

    void ClampBounds(Rectangle b)
    {
        X = MathF.Max(b.Left, MathF.Min(b.Right, X));
        Y = MathF.Max(b.Top,  MathF.Min(b.Bottom, Y));
    }

    void Separate(List<Enemy> others)
    {
        foreach (var o in others)
        {
            if (o == this || o.Dead) continue;
            float dx = X - o.X, dy = Y - o.Y;
            float dist = MathF.Sqrt(dx * dx + dy * dy);
            if (dist < 30 && dist > 0)
            {
                float push = (30 - dist) * 0.25f;
                X += dx / dist * push; Y += dy / dist * push;
            }
        }
    }

    void RunState(Player player, List<Enemy> others)
    {
        StateTimer--;
        float dist = MathF.Sqrt((X - player.X) * (X - player.X) + (Y - player.Y) * (Y - player.Y));

        switch (State)
        {
            case "idle":
                if (StateTimer <= 0) SetState("patrol", 90 + _rng.Next(90));
                if (dist < _aggroRange && player.Hp > 0) SetState("chase", 1);
                break;

            case "patrol":
                if (StateTimer <= 0) SetState("idle", 40 + _rng.Next(40));
                if (dist < _aggroRange && player.Hp > 0) SetState("chase", 1);
                _patrolTimer--;
                if (_patrolTimer <= 0) { _patrolDir = -_patrolDir; _patrolTimer = 40 + _rng.Next(40); }
                X += _patrolDir * _speed * 0.5f;
                Facing = _patrolDir;
                break;

            case "chase":
                float dx = player.X - X, dy = player.Y - Y;
                Facing = dx > 0 ? 1 : -1;
                if (dist > _attackRange)
                {
                    X += dx / dist * _speed;
                    Y += dy / dist * _speed * 0.7f;
                    StateTimer = 1;
                }
                else if (_attackCooldown <= 0)
                {
                    SetState("attack", 30);
                    AttackActive = false;
                    HitPlayerThisSwing = false;
                }
                break;

            case "attack":
                AttackActive = StateTimer <= 20 && StateTimer >= 10;
                if (StateTimer <= 0)
                {
                    _attackCooldown = 60 + _rng.Next(40);
                    HitPlayerThisSwing = false;
                    SetState("chase", 1);
                }
                break;

            case "hurt":
            case "knockback":
                if (StateTimer <= 0 && Z <= 0) SetState("chase", 1);
                break;

            case "die":
                _dyingT++;
                if (_dyingT > 40) Dead = true;
                break;
        }
    }

    public void Draw(Renderer r, int sx, int sy)
    {
        if (Dead) return;
        string animState = State == "chase" ? "walk" : State;
        switch (Type)
        {
            case EnemyType.Goon:
                Sprites.DrawGoon(r, sx, sy, Facing, animState, AnimT, Z, Hp, MaxHp);
                break;
            case EnemyType.Heavy:
                Sprites.DrawHeavyGoon(r, sx, sy, Facing, animState, AnimT, Z, Hp, MaxHp);
                break;
        }
    }
}
