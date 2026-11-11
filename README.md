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
│           ├── geometry.ts      # line crossing math (crashes, checkpoints, sensors)
│           ├── ai/
│           │   ├── brain.ts     # neural network: sensors in, gas and steer out
│           │   ├── evolution.ts # score + breeding the next generation
│           │   ├── trainer.ts   # 100 AI cars, generations, stuck check, best lap
│           │   ├── stats.ts     # numbers per generation (best, top 10, average, laps), CSV table
│           │   ├── drawChart.ts # progress chart, P saves it as a PNG
│           │   └── saveBrain.ts # saves / loads the best brain (browser + .json file), CSV export
│           ├── car/
│           │   ├── car.ts       # car data, physics, crashes, checkpoints
│           │   ├── controls.ts  # keyboard: arrows / WASD drive, other keys go to the game
│           │   ├── drawCar.ts   # draws a car in its color (white outline = watched car)
│           │   ├── sensors.ts   # the AI's eyes: distances to the walls (settings at the top)
│           │   └── drawSensors.ts # draws the sensor lines
│           ├── track/
│           │   ├── track.ts     # track structure: shape, walls, checkpoints, start position
│           │   ├── drawTrack.ts # draws the track and start box
│           │   └── wallGrid.ts  # walls sorted into squares, so cars only check walls nearby
│           └── race/
│               ├── lapTimer.ts  # lap timer logic: current, last and best lap
│               └── drawHud.ts   # draws the lap timer, AI inputs panel and training box
├── ai/                          # saved brains (.json) and training results 
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
| M | switch between you driving and AI training |
| 1 – 5 | training speed: 1x, 2x, 5x, 10x, max |
| H | hide / show crashed AI cars |
| G | show / hide the progress chart |
| P | save the progress chart as a PNG image |
| B | download the best brain as a .json file |
| L | load a brain file and continue training from it |
| N | start a new training (forgets the saved one) |
| C | download the training history as a .csv table |

## AI training

Press **M** to start training. 100 cars drive at the same time, each with its own neural network
(8 inputs → 8 → 6 → 2 outputs: the 7 sensor distances and the speed go in, gas and steering come out).

- A car is out when it hits a wall or doesn't reach a new checkpoint for 5 seconds.
- When all cars are out (or after 60 seconds), each car gets a score: checkpoints passed,
  and with the same checkpoints the one that survived longer wins.
- The best 5 brains go to the next generation unchanged. The rest are bred from the best 20:
  their weights are mixed and slightly changed at random.

Press **5** for max speed. The first full laps usually appear after about 20–40 generations.

## Checks before committing

```bash
pnpm lint
pnpm build
```

## Status

- [x] Race track with walls and checkpoints
- [x] Start box and lap timer
- [x] Car you can drive with the keyboard
- [x] Car sensors (distance to the walls)
- [x] AI that learns to drive
- [x] Generation history and progress chart
- [x] Save and load the best brain
- [x] Export training history as CSV