using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Input;
using System;
using System.Collections.Generic;

namespace NeebsBrawler;

record AttackDef(string Type, int Frames, int ActiveStart, int ActiveEnd,
                 int Damage, int Reach, int Height, int YOff);

public class Player : IEntity
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z;
    public float VX { get; set; }
    public float VY { get; set; }
    public float VZ { get; set; }
    public int  Facing { get; private set; } = 1;
    public int  Hp     { get; set; } = 100;
    public int  MaxHp  = 100;
    public int  Score;
    public int  InvFrames { get; set; }

    public int HitW { get; } = 28;
    public int HitH { get; } = 72;
    public int AttackReach  { get; private set; } = 56;
    public int AttackHeight { get; private set; } = 26;
    public int AttackYOff   { get; private set; } = 28;

    public string State { get; private set; } = "idle";
    private int   _stateTimer;
    public  float AnimT;

    public int ComboCount;
    private int _comboTimer;
    private int _punchStep, _kickStep;
    private bool _hitThisSwing;
    private bool _onGround = true;

    // Buffs: frames remaining
    public int SpeedBuff, PowerBuff;

    private static readonly Dictionary<string, AttackDef> Attacks = new()
    {
        ["punch1"]  = new("light", 14, 4,  9,  10, 56, 26, 28),
        ["punch2"]  = new("light", 14, 4,  9,  12, 58, 28, 32),
        ["punch3"]  = new("heavy", 20, 6,  14, 22, 64, 32, 30),
        ["kick1"]   = new("light", 16, 5,  10, 14, 68, 30, 36),
        ["kick2"]   = new("heavy", 22, 7,  15, 24, 72, 36, 40),
        ["jumpAtk"] = new("light", 18, 3,  12, 18, 60, 40, 20),
    };

    public Player(float x, float y) { X = x; Y = y; }

    public bool IsAttacking
    {
        get
        {
            if (!Attacks.TryGetValue(State, out var a)) return false;
            int frame = a.Frames - _stateTimer;
            return frame >= a.ActiveStart && frame <= a.ActiveEnd && !_hitThisSwing;
        }
    }

    public bool IsHeavyAttack
        => Attacks.TryGetValue(State, out var a) && a.Type == "heavy";

    public int CurrentAttackDamage
    {
        get
        {
            int base_ = Attacks.TryGetValue(State, out var a) ? a.Damage : 10;
            float pm  = PowerBuff > 0 ? 1.6f : 1f;
            float cm  = 1 + MathF.Min(ComboCount * 0.05f, 0.5f);
            return (int)(base_ * pm * cm);
        }
    }

    public void SetState(string s, int dur)
    {
        State = s; _stateTimer = dur;
        if (s == "hurt" || s == "knockback") _hitThisSwing = true;
    }

    public void Heal(int amount)   => Hp = Math.Min(MaxHp, Hp + amount);
    public void ApplyBuff(string t) { if (t == "speed") SpeedBuff = 300; else PowerBuff = 300; }

    private float Speed => SpeedBuff > 0 ? 3.6f : 2.4f;

    public void Update(InputManager input, Rectangle bounds)
    {
        if (Hp <= 0) { State = "dead"; return; }

        if (_stateTimer  > 0) _stateTimer--;
        if (InvFrames    > 0) InvFrames--;
        if (_comboTimer  > 0) _comboTimer--; else ComboCount = 0;
        if (SpeedBuff    > 0) SpeedBuff--;
        if (PowerBuff    > 0) PowerBuff--;
        AnimT += 0.07f;

        // Sync attack geometry
        if (Attacks.TryGetValue(State, out var atk))
        {
            AttackReach  = atk.Reach;
            AttackHeight = atk.Height;
            AttackYOff   = atk.YOff;
            int frame = atk.Frames - _stateTimer;
            if (frame > atk.ActiveEnd) _hitThisSwing = true;
        }

        switch (State)
        {
            case "idle":
            case "walk":
                HandleMovement(input, bounds);
                HandleAttack(input);
                HandleJump(input);
                break;
            case "jump":
                HandleAirMove(input, bounds);
                if (input.Consume(Keys.Z) || input.Consume(Keys.X)) StartAttack("jumpAtk");
                break;
            case "jumpAtk":
                HandleAirMove(input, bounds);
                if (_stateTimer <= 0) State = _onGround ? "idle" : "jump";
                break;
            case "hurt":
            case "knockback":
                if (_stateTimer <= 0) State = "idle";
                X += VX; VX *= 0.8f;
                Y += VY; VY *= 0.8f;
                break;
            default:
                if (_stateTimer <= 0) State = "idle";
                else HandleAttack(input); // buffer next in recovery
                break;
        }

        UpdateJump(bounds);
        ClampBounds(bounds);
    }

    void HandleMovement(InputManager input, Rectangle bounds)
    {
        var m = input.Movement();
        if (m.LengthSquared() > 0)
        {
            var n = Vector2.Normalize(m);
            X += n.X * Speed;
            Y += n.Y * Speed * 0.6f;
            if (m.X != 0) Facing = m.X > 0 ? 1 : -1;
            State = "walk";
        }
        else State = "idle";
    }

    void HandleAirMove(InputManager input, Rectangle bounds)
    {
        var m = input.Movement();
        if (m.X != 0) { X += m.X * Speed * 0.8f; Facing = m.X > 0 ? 1 : -1; }
        if (m.Y != 0) Y += m.Y * Speed * 0.5f;
    }

    void HandleJump(InputManager input)
    {
        if (input.Consume(Keys.Space) && _onGround)
        {
            VZ = 10; _onGround = false; State = "jump";
        }
    }

    void HandleAttack(InputManager input)
    {
        bool canAtk = State is "idle" or "walk" || (Attacks.ContainsKey(State) && _stateTimer < 6);
        if (input.Consume(Keys.Z) && canAtk)
        {
            _punchStep = (_punchStep + 1) % 3;
            StartAttack(new[] { "punch1", "punch2", "punch3" }[_punchStep]);
        }
        else if (input.Consume(Keys.X) && canAtk)
        {
            _kickStep = (_kickStep + 1) % 2;
            StartAttack(new[] { "kick1", "kick2" }[_kickStep]);
        }
        else if (input.Consume(Keys.C) && canAtk)
        {
            StartAttack("punch3"); // grab uses punch3 hitbox
        }
    }

    void StartAttack(string name)
    {
        State = name; _stateTimer = Attacks[name].Frames;
        _hitThisSwing = false; _comboTimer = 45; ComboCount++;
    }

    void UpdateJump(Rectangle bounds)
    {
        if (!_onGround)
        {
            Z += VZ; VZ -= 0.55f;
            if (Z <= 0)
            {
                Z = 0; VZ = 0; _onGround = true;
                if (State is "jump" or "jumpAtk") State = "idle";
            }
        }
    }

    void ClampBounds(Rectangle b)
    {
        X = MathF.Max(b.Left, MathF.Min(b.Right, X));
        Y = MathF.Max(b.Top, MathF.Min(b.Bottom, Y));
    }

    public void Draw(Renderer r, int sx, int sy)
    {
        if (State == "dead") return;
        Sprites.DrawNeebs(r, sx, sy, Facing, State, AnimT, Z);
    }
}
