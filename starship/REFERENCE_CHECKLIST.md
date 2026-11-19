# Reference checklist (Section 21)

Status after the final review pass. Evidence: `npm test`, `npm run physics-check`, `npm run shots`
(18 review frames, notes in `out/review/`), `scripts/determinism.mjs`, `scripts/live-check.mjs`,
`scripts/memory-loop.mjs`, a 2 s 640×360 record with audio and a 60 s offline audio render. All visual
checks were made on a software renderer (SwiftShader); nothing was measured on a real GPU.

| | Item | Status | Note |
|---|---|---|---|
| [x] | Booster reads as 71 m, 33 engines visible from below at the correct layout | PASS | 3 / 10 / 20 rings at 0.95 / 2.35 / 3.75 m, 13 gimballing; counts and bell clearance unit-tested. Outer ring uses 1.15 m bells to avoid intersection. |
| [x] | Grid fins have real lattice cells, titanium look, stow and deploy animations | PASS | Instanced 25 mm bars, perimeter frame, hinge and actuators; stowed during ascent, 2.2 s deploy at T+205. |
| [x] | Ship tiles: hex, imperfect, some missing, with the windward coverage | PASS | 13,840 instanced tiles, 40 → 60 % coverage, jitter, 0.4 % missing (bare steel via the tile shell), chipped and scorched variants, curvature bend, far-LOD shell. |
| [x] | Hot-stage ring has the vent slots with flame jets at staging | PASS | 100 real slots (2 × 50) with side walls and sooted interior; 100 lagged flame jets, fireball, shock shell, ring venting. |
| [x] | Tower lattice with chopsticks, lightning masts, beacons | PASS | K-braced lattice (3 LODs), decks, ladder, elevator, carriage + two box-girder arms with pistons and catch rails, ship QD arm, 3 guyed masts, blinking beacons and strobes. |
| [x] | Ignition sequence staggered, with the chugging puffs and growing thrust | PASS | Centre 3 at T−8.2, inner 10 (60 ms stagger), outer 20 (40 ms); igniter sparks, chug transients in the engine pattern, 1.2 s ramps, one audio chuff per engine. |
| [x] | Deluge water and giant steam cloud lit orange from within | PASS | 24 jets + rain-out; 4-phase puff field into a 3D grid, raymarched with sun shadows and plume underlighting. Cloud edges remain somewhat blobby at long focal lengths. |
| [x] | Dust shockwave ring and flattened grass | PASS | 343 m/s ground ring (terrain dust + refractive heat ring), radial grass/shrub blast in the vegetation shader, water ripples. |
| [x] | Plume: blue-white core, orange edge, diamonds, expands with altitude | PASS | Per-engine near field merging into one column, shock diamonds when over-expanded, log(Pr) expansion to 55°, area dilution in vacuum. |
| [x] | Smoke trail shear with wind, dissipating | PASS | 24k trail puffs born along the real trajectory, advected by the power-law + jet-stream profile, growing and fading. |
| [x] | Vapor cone at max-Q | PASS | Transonic shells on the ship shoulder and interstage (M 0.9–1.32, 2–20 km), shown in shot 7 (T+38 → T+58, where the simulated Mach 1 / max-Q fall). |
| [x] | Physically plausible telemetry on the HUD | PASS | RK4 3-DOF + attitude; Section 5.3 ranges pass (13.2 km, M1.53, 34.7 kPa, 69.9 km, 1,602 m/s at MECO). |
| [x] | Sound delayed by distance, with low rumble and crackle, sonic cracks | PASS | Per-group d/343 delay lines (cross-faded at cuts), air absorption, rumble + crackle + N-wave boom + staging/catch transients; level rises exactly at T−8.2 in the 60 s check. Loudness ≈ −16 dBFS RMS (not LUFS-metered). |
| [~] | Camera: physical lens, DOF, shake (delayed), 11 shots, cuts on action | PARTIAL | Physical rig (focal → FOV, f-stop/focus DOF with cat's-eye, distortion, breathing, CA, EV100), sound-delayed layered shake, 11 shots + catch close-up. Shot windows 7, 9 and 11 follow the simulated events rather than the table times. |
| [x] | Earth curvature and thin blue limb at altitude | PASS | Hillaire sky from orbit plus a procedural spherical Earth (ocean, coast, clouds, city lights) cross-fading with the flat terrain. |
| [~] | Booster return: flip, boostback, fin deploy, entry glow, landing burn, catch | PARTIAL | All phases simulated and rendered; the catch happens at T+445.8 s (physics) instead of T+335–345 s, and the final 250 m of horizontal miss is blended out. |
| [~] | Record mode: deterministic 4K60 MP4 with audio | PARTIAL | Pipeline verified (determinism hashes match for frames 0/100/1000; H.264 + AAC mux works at 640×360). A full 4K60 render was not produced in this environment (software rendering ≈ 7 s per small frame). |
| [~] | Presets Low/High/Ultra, adaptive resolution governor | PARTIAL | Presets and governor implemented; real-GPU frame times (60 fps target on an RTX 3060) not measured. |
| [~] | Zero console errors, flat memory over loops | PARTIAL | No errors and no application warnings in the live smoke test or record runs; GPU resource counts and JS heap flat across three full passes. The software renderer used here (ANGLE + SwiftShader) still prints 4 rate-limited "GPU stall due to ReadPixels" performance notices per session (2 during boot, 2 in the first frames) that no explicit readback in the code triggers; a blank WebGL2 page does not print them, and whether they appear on hardware GL was not checked. |

## Not implemented / simplified

- WebGPU renderer and compute paths (WebGL2 only).
- SSAO/GTAO, SSR and TAA (MSAA, IBL and shadows instead); one shadow cascade.
- Eulerian smoke advection / vorticity confinement (analytic puffs + curl-noise wander + detail erosion).
- Moon, ship re-entry epilogue.
- Pitch-preserving time-stretch: slow motion lowers noise-layer playback rate and pitches transients down instead.
