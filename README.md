# AI-Racer
A race game in the browser where we will train our own AI agent and neural network to race the track.

## Structure

```
.
├── web/
│   └── ai-racer/            # the game (Next.js 16)
│       ├── app/
│       │   └── page.tsx     # home page, shows the game full window
│       └── game/
│           ├── track.ts     # track structure: shape, walls, checkpoints, start position
│           ├── lapTimer.ts  # lap timer logic: current, last and best lap
│           └── RaceTrack.tsx # draws the track, start box and lap timer
├── ai/                      # AI 
└── README.md
```


## How to run

```bash
cd web/ai-racer
pnpm install   # first time only
pnpm dev
```

Then open http://localhost:3000

## Checks before committing

```bash
pnpm lint
pnpm build
```

## Status

- [x] Race track with walls and checkpoints
- [x] Start box and lap timer
- [ ] Car you can drive with the keyboard
- [ ] AI that learns to drive