# Decisions

One line each: decision — reason.

- Project lives in `starship/` — the repository already contains an unrelated research project at its root.
- Single WebGL2 renderer; WebGPU is detected and reported but not used — one shared GLSL code path keeps visuals identical everywhere, supports deterministic capture and could be verified headlessly (SwiftShader has no WebGPU here).
- Liftoff at 07:00 CDT instead of 06:31 — NOAA puts 06:31 on 14 June 2026 ~8 min *before* sunrise (sun −1.7°); 07:00 gives the stated intent (~20 min after sunrise, sun +4.2° at azimuth 66°).
- Cinematic sun pre-roll (T−90 → −45 min, T−30 → −21 min, T−0 → liftoff time) — lets the pre-dawn establishing shot and the sunrise happen within the 90 s countdown as the event table asks.
- Payload 0 kg — the literal mass instruction (ship propellant 1,225 t "to balance") only sums to 5,000 t with no payload.
- Startup propellant (≈134 t) is loaded on top so mass at T0 = 5,000 t — the 8 s ignition sequence burns propellant while held down.
- Throttle = Max-Q bucket × acceleration cap (3.6 g) × propellant-time guidance from T+80 — makes MECO happen at exactly T+156 with the 480 t return reserve; booster TWR at release 1.55.
- Steering: 1.5° kick at T+12, alpha-biased pitch-over to T+38, zero alpha through max-Q, open-loop pitch program after T+78 — a pure gravity turn from a 1.5° kick lofts to ~140 km; this passes all five Section 5.3 checks (13.2 km, M1.53, 34.7 kPa, 69.9 km, 1,602 m/s).
- Booster return is physically integrated (flip 162–174 s, 13→3-engine boostback pitched 15° up, coast with grid-fin lift steering, short 13-engine entry burn, suicide landing burn on 13 then 3) — it catches at T+445.8 s, not T+335–345 s, so shot windows 9 and 11 are keyed to the simulated events instead of fixed times.
- Residual landing errors are blended out over the last ~38 s (250 m horizontal, 2.8 m vertical before alignment) — the Section 5.4 fallback; the catch lands within ±0.3 m of the chopsticks (unit-tested).
- Catch geometry: chopstick catch-beam at 104 m above the OLM top, so the booster base hangs 42 m above the mount — "~70 m catch altitude" read as the arm park height; with arms at 70 m the booster base would sit 8 m above the mount and the landing plume would hit it.
- MECO sequence: outer 20 off over 0.8 s from T+156, inner 10 at +1.1 s, centre 3 run through hot staging and stop at T+158.5 — reconciles "centre 3 off at +0.5 s" with "booster still firing the centre 3 for 0.5 s at T+158".
- Outer-ring engines use 1.15 m bells — 20 engines on a 3.75 m ring are only 1.18 m apart, so 1.3 m bells would intersect (unit-tested clearance).
- Earth rotation is ignored by the planar integrator — keeps the model 2-D and deterministic; it would only shift downrange velocity.
- Pad smoke is a Lagrangian puff field (pure function of index and time) splatted into a 3D grid every frame instead of an Eulerian solver — exact scrubbing/recording determinism; billowing comes from 3D detail-noise erosion and curl-noise wander.
- All particles are closed-form (linear drag + gravity + wind + one bounce) rather than incrementally simulated — same reason; no history to checkpoint.
- MSAA 4× instead of TAA in real time; jittered sub-frame accumulation in record mode — three.js materials do not output motion vectors; MSAA keeps thin lattice members stable without ghosting.
- Camera motion blur from depth reprojection plus rigid-body masks for the two stages — no per-object velocity buffer exists for stock materials.
- One 4096² sun shadow map refitted per shot (texel-snapped) instead of 4 cascades — every shot has a single region of interest; it removes cascade seams.
- Aerial perspective is a per-pixel ray march through the Hillaire LUTs (10–16 steps) instead of a froxel volume — same result, simpler, valid for the planet-scale shots.
- ACES (Hill fit) is the default tone mapper, AgX selectable — AgX looked flat for the sunrise palette.
- Bloom intensity 0.07 instead of 0.35, with a soft clamp of exposed values above 24 — at 0.35 the HDR plume and sun turned whole frames into fog.
- Auto-exposure is log-average metering with relative outlier rejection plus per-shot EV compensation; EV100 from the physical camera is computed and reported — a fixed physical exposure cannot span pre-dawn, fire and space.
- Shot 4 camera moved to a dune at (150 m E, 1,590 m S) — the specified spot falls ~110 m offshore with the modelled coastline.
- Shot 1 camera sits 1.38 km SW on the shore of a marsh lagoon — gives the "reflective pool leading the eye" with reeds in front.
- Shot 7 covers T+38 → T+58 — the simulated Mach 1 is T+43 and max-Q T+46, so the vapour cone happens there, not at T+55–75.
- Shot 6 aims at the engine end — aiming at the stack's middle put the plume out of frame.
- Hull maps are generated on the GPU each boot and the IndexedDB cache is written asynchronously (PBO readback) — a synchronous readback stalls and warns in the console.
- Heat-shield tiles: 13,840 instanced hex prisms (cap 24,000) plus a procedural tile shell for gaps, missing tiles and the far LOD — real ships carry ~18k; this is the count the windward coverage rule produces.
- Flaps fold to 85° against the hull during ascent; `deployAngle` animates the re-entry pose but the ship re-entry epilogue is not in the cut.
- Soundtrack: one Web Audio graph built either on the live AudioContext or an OfflineAudioContext, so the record is identical to playback; 24-bit WAV handed to ffmpeg (AAC 320k).
- Countdown uses the Web Speech API live when available, tone beeps otherwise and always offline — speech synthesis cannot render into an OfflineAudioContext.
- Headless capture passes `--enable-unsafe-swiftshader` — current Chromium refuses software WebGL without it.
