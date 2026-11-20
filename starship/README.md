# Starbase Launch — real-time 3D cinematic

A procedural, physically driven real-time cinematic of a super-heavy methalox launch from a Gulf-coast
launch site: pre-dawn pad, 33-engine ignition, liftoff through a deluge-steam pyrocumulus, Max-Q
vapour cone, hot staging, booster flip / boostback / entry / landing burn and tower catch, and the
upper stage climbing over the Earth limb. Everything (geometry, textures, noise, sound) is generated
in code. The hull and tower are unbranded.

## Run

```bash
npm install
npm run dev            # opens the cinematic; click "CLICK TO BEGIN" (needed to unlock audio)
npm run build          # static bundle in dist/
```

Requirements: Node 20+, a WebGL2 browser (Chrome / Edge / Firefox / Safari). WebGPU is detected and
reported on the start screen, but rendering always uses the WebGL2 path (see `DECISIONS.md`).

### Offline / tooling

| Command | What it does |
|---|---|
| `npm run record -- --res 3840x2160 --fps 60 --out out/starship.mp4` | Deterministic capture: steps the clock by exactly 1/fps, accumulates 8 jittered sub-frames per frame (true shutter motion blur + AA), pipes PNGs to ffmpeg (H.264 High, CRF 14, preset slow, yuv420p, BT.709, `+faststart`) and muxes the offline-rendered soundtrack (AAC 320k). Options: `--shot N`, `--start s --end s`, `--fps 24`, `--prores` (ProRes 422 HQ `.mov`), `--preset low/high/ultra`, `--sub N`, `--no-audio`. |
| `npm run reel` | ~33 s highlight reel (one excerpt per shot, hard cuts) at 640×360 / 24 fps with the soundtrack → `out/reel.mp4`. Options `--res`, `--fps`, `--preset`, `--segments "a:b,c:d"` (cinematic seconds). |
| `npm run shots` | Headless screenshot harness: renders every entry of `shots.json` (`{name, t, camera}`) to `out/shots/`. Options `--only a,b`, `--w`, `--h`, `--preset`, `--dbg scene\|composite\|combine\|fx\|depth`. |
| `npm run physics-check` | Section 5.3 acceptance test of the ascent model (altitude/Mach/max-q/MECO), plus the full event table. |
| `npm test` | Unit tests: physics acceptance, USSA-76 anchors, booster catch accuracy, timeline monotonicity, engine layout counts and bell clearance, NaN checks of puff/wind/trajectory fields. |
| `npm run test:gpu` | Browser checks: determinism hash (frames 0/100/1000 in two separate sessions), live-mode smoke test (console must be clean, frame time and heap reported), GPU-resource leak loop. |
| `npm run audio-check -- --start 35 --end 95` | Renders a stretch of the soundtrack offline to `out/audio-check.wav`. |
| `npm run lint` / `npm run typecheck` | ESLint + strict TypeScript. |

The scripts use `$CHROME_PATH`, else a preinstalled Playwright Chromium, else Puppeteer's own browser.
Headless Chromium falls back to SwiftShader (software) when no GPU is present: everything works, just
slowly (~7 s per 640×360 frame).

## Controls

| Key | Action |
|---|---|
| `Space` | play / pause |
| `1`–`9`, `0`, `-` | jump to shots 1–11 |
| `.` / `,` | step one frame forward / back |
| `Home` / `End` | start / end |
| `[` / `]` | speed 0.1×, 0.25×, 0.5×, 1×, 2×, 4× |
| `F` | free-fly camera: `WASD` move, mouse look (click to lock), `Q`/`E` down/up, `Shift` fast, wheel = focal length |
| `H` | toggle HUD (mission clock, telemetry, event ticker, scrubber) |
| `C` | toggle captions for audio events |
| `L` | 2.39:1 letterbox |
| `P` | photo mode (hides UI, saves a 2× PNG) |
| `M` | mute · `V` countdown voice |
| `` ` `` or `G` | debug panel (lil-gui + stats-gl): post tunables, safe flashes, reduce motion |
| `Shift+1/2/3` | reload with the Low / High / Ultra preset |

The scrubber at the bottom seeks anywhere (ticks mark shots, dots mark events). URL flags:
`?preset=ultra`, `?shot=8`, `?t=165` (cinematic seconds), `?safe-flashes`, `?reduce-motion`.

## Presets

| | Low | High | Ultra |
|---|---|---|---|
| internal scale | 0.75 | 1.0 (≤1.5 dpr) | 1.0 (≤2 dpr) |
| AA | none | MSAA 4× | MSAA 4× (+ accumulation in record mode) |
| shadow map | 2048 | 4096 | 4096 |
| volumetrics | 0.35 res, 32/20 steps | 0.5 res, 56/40 steps | 0.75 res, 80/56 steps |
| smoke grid / puffs | 48×28×48 / 1.5k | 96×56×96 / 4k | 128×72×128 / 8k |
| particle budget | 150k | 600k | 1.2M |
| grass blades / shrubs | 60k / 4k | 300k / 15k | 400k / 20k |
| hull maps | 2048 | 4096 | 4096 |
| DOF / motion blur / heat haze | off | on | on |

An adaptive governor (GPU timer queries, 30-frame average) lowers the dynamic resolution in 5 % steps
down to 0.6 when frames exceed 16.6 ms and recovers after 2 s under 13 ms (disabled when recording).

## Architecture

```
main.ts        boot, start overlay, loop, keyboard, record-mode API (window.__step / __seekCin / __renderAt / __capture / __renderAudio)
engine.ts      Engine: renderer, scenes (main / FX / heat), clock, timeline, physics, shots, rig, sky, composer, system registry
systems.ts     builds and registers every system (texture generation spread over frames behind the loading bar)
config.ts      every tunable, with units
clock.ts       cinematic clock (realtime / deterministic)
timeline.ts    event table + immutable per-frame snapshot (vent, frost, deluge, QDs, chopsticks, fins, staging, ticker, captions)
physics/       USSA-76 atmosphere, engine envelopes, RK4 3-DOF+attitude ascent with TVC, booster return guidance, ship to orbit, plume shape model
vehicle/       procedural hull maps (GPU), PBR materials, booster, ship, Raptor/RVac clusters, grid fins, hot-stage ring, hex tiles, flaps, wear model
site/          terrain (analytic heights, splat), OLM, tower + chopsticks + QD arm + masts, tank farm + distant cues, floodlights, vegetation
sky/           Hillaire-2020 LUT atmosphere + sky dome, NOAA sun, stars/Milky Way, volumetric cumulus + cirrus, spherical Earth
vfx/           raymarched plumes + impingement disc, puff-field pyrocumulus (GPU grid + raymarch), stateless GPU particles (deluge, debris, embers,
               sparks, LOX vapour, ground fog, ice, contrail, cold gas), hot-staging fire, vapour cone + re-entry plasma, shockwave, birds
camera/        physical rig (focal/f-stop/focus/shutter/EV100, distortion, breathing), 12 shot definitions, paths, layered delayed shake, free-fly
post/          composer: scene HDR -> aerial perspective + volume composite -> FX layer -> heat haze -> motion blur -> DOF -> bloom/streak -> exposure -> ACES/AgX + LUT -> lens/film
audio/         procedural Web Audio graph (rumble, roar/crackle, deluge, vents, ambience, one-shots, reverb), live engine, offline renderer
ui/            overlay, HUD, scrubber, captions, governor, debug panel
```

Update order each frame: Clock → Timeline snapshot → physics state lookup → camera pose (shot or
override) and floating origin → systems (terrain, water, site, vehicles, plumes, smoke, clouds, Earth,
particles, VFX) → audio → render. Every visual is a pure function of mission time (the trajectory is
integrated once at boot, smoke puffs and particles are closed-form), so any frame renders identically
in isolation; that makes scrubbing, the screenshot harness and the deterministic recorder exact.

## Known limitations

See `REFERENCE_CHECKLIST.md` for the item-by-item status. In short: WebGL2 only (no WebGPU path), no
SSAO/SSR/TAA (MSAA + IBL + shadows instead), a single focused shadow cascade, the smoke grid is filled
from analytic puffs instead of an Eulerian fluid solve, the moon and the ship re-entry epilogue are not
rendered, and all tuning was done on a software renderer (performance on a real GPU was not measured
here).
