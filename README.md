# AI-Racer
A race game in the browser where we will train our own AI agent and neural network to race the track.

## Structure

```
.
├── web/
│   └── ai-racer/                # the game (Next.js 16)
│       ├── app/
│       │   └── page.tsx         # home page, shows the game full window
│       └── game/
│           ├── Game.tsx         # game screen: game loop, draws everything
│           ├── geometry.ts      # line crossing math (crashes, checkpoints)
│           ├── car/
│           │   ├── car.ts       # car data, physics, crashes, checkpoints
│           │   ├── controls.ts  # keyboard: arrows / WASD, Space = restart
│           │   └── drawCar.ts   # draws a car in its color
│           ├── track/
│           │   ├── track.ts     # track structure: shape, walls, checkpoints, start position
│           │   └── drawTrack.ts # draws the track and start box
│           └── race/
│               ├── lapTimer.ts  # lap timer logic: current, last and best lap
│               └── drawHud.ts   # draws the lap timer box
├── ai/                          # AI
└── README.md
```


## How to run

```bash
cd web/ai-racer
pnpm install   # first time only
pnpm dev
```

Then open http://localhost:3000

## Controls

| Key | Action |
|---|---|
| ↑ / W | gas |
| ↓ / S | brake, then reverse |
| ← → / A D | steer |
| Space | new car in the start box |

## Checks before committing

```bash
pnpm lint
pnpm build
```

## Status

- [x] Race track with walls and checkpoints
- [x] Start box and lap timer
- [x] Car you can drive with the keyboard
- [ ] Car sensors (distance to the walls)
- [ ] AI that learns to drive