# Shadowtide

A quiet top-down stealth game. You are a reef mouse slipping through
moonlit tide pools to take back three moon keys from each pool — past
twelve lantern crabs — and reach the exit gate unseen.

## How to play

- **WASD / arrow keys** — move. **Click** the board to walk to a point.
- **Shift** — sneak: slow and silent. **Space** — run: fast, but crabs
  hear footsteps.
- **Touch a moon key** to pick it up. **3 keys** open the exit gate.
- **Hide** in reed beds and shadow pools: a crab cannot see you there
  unless it is almost on top of you.
- **H** — hint (1 per pool, points at the nearest key). **R** — restart
  the pool. **P / Esc** — pause. **M** — mute. **1–3** — pick a pool.

Guards patrol fixed routes with pauses you can learn. Their suspicion
rises through **CALM → SUSPICIOUS (?) → ALERT (!) → SEARCH (…)** and
falls again if you stay hidden — being spotted is a setback, not the
end. Get caught and you restart the pool with your keys kept, minus
150 points. Finish a pool without ever being spotted for a **GHOST**
rating.

## Pools

1. **Low Tide** — 3 crabs, 4 reed beds
2. **Half Moon** — 4 crabs, 5 reed beds
3. **High Tide** — 5 crabs, 6 reed beds

## Run it

```
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step,
no network: every file the game loads lives under `game/`, and all art
and sound are drawn and synthesised in code.
