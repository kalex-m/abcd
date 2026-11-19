/**
 * Every tunable of the cinematic lives here. Units are given in the trailing comments.
 * Systems must read from CONFIG instead of hardcoding numbers.
 */

export type PresetName = 'low' | 'high' | 'ultra';

export interface QualityPreset {
  renderScale: number; // fraction of device pixels rendered internally
  maxPixelRatio: number; // cap on devicePixelRatio
  msaa: number; // MSAA samples on the HDR scene target (0 = off, FXAA used)
  shadowMapSize: number; // px
  volumetricScale: number; // fraction of internal res used by the volumetric pass
  smokeGrid: [number, number, number]; // voxels (x, y, z) of the pyrocumulus grid
  smokePuffs: number; // Lagrangian puffs splatted into the grid
  smokeSteps: number; // raymarch steps through the smoke grid
  cloudSteps: number; // raymarch steps through the cumulus layer
  plumeSteps: number; // raymarch steps per plume volume
  particles: number; // budget for analytic GPU particles (all emitters)
  grassBlades: number; // instanced grass blades
  shrubs: number; // instanced shrubs
  hullTexSize: number; // px, long edge of procedural hull maps
  tileLodDistance: number; // m, beyond this the hex tiles switch to the baked texture
  bloomMips: number;
  dof: boolean;
  motionBlur: boolean;
  motionBlurSamples: number;
  envMapSize: number; // px, sky capture cube face
  heatHaze: boolean;
}

export const PRESETS: Record<PresetName, QualityPreset> = {
  low: {
    renderScale: 0.75, maxPixelRatio: 1, msaa: 0, shadowMapSize: 2048, volumetricScale: 0.35,
    smokeGrid: [48, 28, 48], smokePuffs: 1536, smokeSteps: 32, cloudSteps: 20, plumeSteps: 18,
    particles: 150_000, grassBlades: 60_000, shrubs: 4000, hullTexSize: 2048, tileLodDistance: 60,
    bloomMips: 5, dof: false, motionBlur: false, motionBlurSamples: 6, envMapSize: 64, heatHaze: false,
  },
  high: {
    renderScale: 1.0, maxPixelRatio: 1.5, msaa: 4, shadowMapSize: 4096, volumetricScale: 0.5,
    smokeGrid: [96, 56, 96], smokePuffs: 4096, smokeSteps: 56, cloudSteps: 40, plumeSteps: 28,
    particles: 600_000, grassBlades: 300_000, shrubs: 15_000, hullTexSize: 4096, tileLodDistance: 120,
    bloomMips: 6, dof: true, motionBlur: true, motionBlurSamples: 12, envMapSize: 128, heatHaze: true,
  },
  ultra: {
    renderScale: 1.0, maxPixelRatio: 2, msaa: 4, shadowMapSize: 4096, volumetricScale: 0.75,
    smokeGrid: [128, 72, 128], smokePuffs: 8192, smokeSteps: 80, cloudSteps: 56, plumeSteps: 40,
    particles: 1_200_000, grassBlades: 400_000, shrubs: 20_000, hullTexSize: 4096, tileLodDistance: 200,
    bloomMips: 6, dof: true, motionBlur: true, motionBlurSamples: 16, envMapSize: 256, heatHaze: true,
  },
};

export const CONFIG = {
  seed: 'starbase-ift-2026', // global RNG seed (string)

  // ---------------------------------------------------------------- time / place
  time: {
    localISO: '2026-06-14T07:00:00-05:00', // liftoff local time (see DECISIONS.md)
    latDeg: 25.9972, // deg N, Starbase
    lonDeg: -97.156, // deg (west negative)
    preRollSunOffsetMin: [
      // [missionT s, minutes relative to liftoff] cinematic sun pre-roll (piecewise linear)
      [-90, -45],
      [-30, -21],
      [0, 0],
    ] as [number, number][],
  },

  // ---------------------------------------------------------------- wind (Section 2)
  wind: {
    v10: 6.0, // m/s at 10 m
    fromDeg: 135, // deg, meteorological "from" direction (SE)
    powerLawAlpha: 0.14, // -, exponent of the power-law profile
    profileTop: 3000, // m, top of the power-law layer
    jetAlt: 11000, // m, jet-stream core altitude
    jetSpeed: 35, // m/s
    jetFromDeg: 270, // deg, from W
    jetThickness: 4000, // m, Gaussian half-width of the jet layer
    gustAmp: 0.18, // fraction of mean speed
    gustPeriod: 7.5, // s
  },

  // ---------------------------------------------------------------- planet / atmosphere
  planet: {
    radius: 6_371_000, // m (gravity model)
    g0: 9.80665, // m/s^2
    skyRadius: 6_360_000, // m (scattering model ground radius, Hillaire 2020)
    skyTop: 6_460_000, // m (scattering model top of atmosphere)
    siteElevation: 2.0, // m above MSL of the ground at the pad
    rayleighScale: 8000, // m
    mieScale: 1200, // m
    rayleighScattering: [5.802e-6, 13.558e-6, 33.1e-6] as [number, number, number], // 1/m
    mieScattering: 3.996e-6, // 1/m
    mieExtinction: 4.44e-6, // 1/m
    mieG: 0.8, // -
    ozoneAbsorption: [0.65e-6, 1.881e-6, 0.085e-6] as [number, number, number], // 1/m
    humidityAt10km: 0.6, // relative humidity at the vapor-cone altitude
    groundAlbedo: [0.18, 0.17, 0.15] as [number, number, number],
  },

  lighting: {
    luxScale: 1e-4, // scene radiometric unit per lux (pre-exposure; 100 klx -> 10)
    sunIlluminanceTOA: 128_000, // lux, solar illuminance at top of atmosphere
    sunAngularRadius: 0.004675, // rad
    maxSunDiscRadiance: 60000, // scene units, fp16 safe clamp
    envUpdateInterval: 4.0, // s of cinematic time between sky IBL refreshes
    envFireUpdateInterval: 0.1, // s, refresh interval while the plume lights the scene
    floodlightIntensity: 2.5e6, // cd (before luxScale) per pad floodlight bank
    floodlightColorK: 2100, // K, high-pressure sodium
    beaconHz: 0.7, // Hz, tower aviation beacons
    strobeHz: 1.2, // Hz, countdown strobes
    plumeLightCandelaPerMN: 4.0e6, // cd per MN of thrust (before luxScale)
    plumeLightColorK: [3000, 2400, 1800] as [number, number, number], // K core, mid, flare
    exposureEVComp: 0, // global EV compensation
    shadowFarBox: 900, // m, default half-extent of the shadow box
  },

  // ---------------------------------------------------------------- vehicle (Section 3)
  vehicle: {
    diameter: 9.0, // m
    boosterHeight: 71.0, // m
    shipHeight: 52.0, // m
    ringHeight: 1.8, // m, height of one stainless "can"
    boosterRings: 30, // count of booster cans (incl. aft skirt cans)
    shipRings: 24, // count of ship cans before the nose
    weldBeadHeight: 0.006, // m
    weldBeadWidth: 0.022, // m
    weldHAZ: 0.04, // m, half-width of the heat-affected band
    seamsPerRing: 3, // vertical seams per can
    steelAlbedo: [0.62, 0.64, 0.66] as [number, number, number], // linear
    steelRoughness: 0.32, // -
    steelRoughnessRange: [0.22, 0.55] as [number, number],
    steelAnisotropy: 0.35, // -
    oilCanAmplitude: 0.002, // m equivalent normal displacement
    hotStageHeight: 3.2, // m
    hotStageSlots: 100, // count
    hotStageSlotSize: [0.18, 0.9] as [number, number], // m (w, h)
    forwardDomeHeight: 1.6, // m, booster forward dome fairing above the hot-stage ring
    noseLength: 20.0, // m, tangent ogive
    noseSegments: 128, // radial segments of the nose lathe
    headerShoulder: 0.18, // m radial inset of the header-tank shoulder
    qdPanelHeight: 7.5, // m above booster base
    cableTrayWidth: 0.55, // m
    aftSkirtHeight: 4.5, // m, booster engine-bay skirt
    shipAftSkirtHeight: 6.0, // m
    gridFin: { width: 5.2, height: 3.8, cellsAcross: 15, barThickness: 0.025, barDepth: 0.55, deployTime: 2.2 },
    gridFinBelowHotStage: 2.4, // m
    catchPinBelowFins: 3.3, // m
    catchPinLength: 1.9, // m
    frostTopFraction: 0.62, // fraction of booster height covered by frost (LOX belt)
    iceChips: 400, // count shed at liftoff
    flaps: {
      fwd: { length: 6.0, width: 3.0, hingeFromNoseTip: 4.0 },
      aft: { length: 9.0, width: 5.5, hingeFromBase: 1.0 },
    },
    tiles: {
      flatToFlat: 0.17, // m
      thickness: 0.05, // m
      gap: 0.012, // m
      albedo: 0.025, // linear
      roughness: 0.55,
      offsetJitter: 0.002, // m
      rotJitterDeg: 1.5, // deg
      missingFraction: 0.004,
      chippedFraction: 0.015,
      scorchedFraction: 0.08,
      maxInstances: 24000, // cap; the windward coverage rule places ~13.8k (real ships carry ~18k)
      coverageNose: 0.6, // fraction of circumference at the nose
      coverageAft: 0.4, // fraction at the aft
    },
  },

  engines: {
    centerRadius: 0.95, // m
    innerRadius: 2.35, // m
    outerRadius: 3.75, // m
    centerCount: 3,
    innerCount: 10,
    outerCount: 20,
    shipSLRadius: 0.95, // m
    shipVacRadius: 2.3, // m
    bellExitDiameter: 1.3, // m, Raptor sea level
    bellLength: 1.7, // m
    chamberWidth: 0.6, // m
    rvacExitDiameter: 2.4, // m
    rvacLength: 3.3, // m
    gimbalMaxDeg: 15, // deg
    gimbalWn: 12, // rad/s actuator natural frequency
    gimbalZeta: 0.7, // -
    startRamp: 1.2, // s, throttle ramp at ignition
    throttleDownRamp: 0.4, // s
    engineOuts: [] as { id: number; t: number }[], // optional engine-out events
  },

  // ---------------------------------------------------------------- physics (Section 5)
  physics: {
    dt: 1 / 120, // s, RK4 step
    sampleRate: 30, // Hz, stored trajectory samples
    liftoffMass: 5_000_000, // kg
    boosterDry: 275_000, // kg
    boosterProp: 3_400_000, // kg
    shipDry: 100_000, // kg
    shipProp: 1_225_000, // kg
    payload: 0, // kg (literal balance instruction, see DECISIONS.md)
    boosterReserveProp: 480_000, // kg kept for boostback / entry / landing
    raptorSLThrust: 2.3e6, // N at sea level
    raptorSLIsp: 327, // s
    raptorVacIspTarget: 350, // s (reported; actual vac Isp follows from nozzle area)
    rvacThrust: 2.5e6, // N vacuum
    rvacIsp: 380, // s
    rvacExitDiameter: 2.4, // m
    frontalArea: 63.62, // m^2 (pi * 4.5^2)
    accelLimitG: 3.6, // g, throttling cap on the booster near MECO
    shipAccelLimitG: 3.6, // g, ship throttles to stay below this
    fuelGuidanceStart: 80, // s, after this the throttle meters propellant to reach MECO with the reserve
    maxQBucket: { center: 56, halfWidth: 9, ramp: 2.0, level: 0.78 }, // s, s, s, throttle
    holdDownT: 0, // s mission time of release
    towerClearT: 8, // s, vertical rise end
    pitchKickT: 12, // s
    pitchKickDeg: 1.5, // deg
    pitchKickDuration: 6, // s
    pitchOverAlphaDeg: 2.2, // deg angle-of-attack bias held after the kick
    pitchOverEnd: 38, // s end of the alpha-biased pitch-over (zero alpha through max-Q afterwards)
    postMaxQPitch: [
      // [s, deg pitch from local vertical] open-loop program after max-Q
      [78, 44],
      [115, 70],
      [156, 80],
    ] as [number, number][],
    rollStart: 12, // s
    rollEnd: 30, // s
    rollDeg: -34, // deg roll executed by the roll program (visual body roll)
    padHeadingDeg: 90, // deg, rotation of the vehicle about its axis on the pad (tile side faces east)
    azimuthDeg: 100, // deg from north
    attitudeKp: 2.2, // 1/s^2
    attitudeKd: 2.6, // 1/s
    stackInertia: 1.7e9, // kg m^2 pitch moment of inertia of the full stack at liftoff
    gimbalLever: 30, // m, nozzle-to-CoM distance
    gustTorque: 6.0e6, // N m, low-altitude disturbance amplitude
    mecoT: 156, // s
    hotStageT: 158, // s
    sepT: 159, // s
    shipSecoT: 0, // s, 0 = burn to depletion
    shipEngineStartT: 157.6, // s, ship pre-ignition (chill + start transient)
    boosterFlipStart: 162, // s
    boosterFlipDuration: 12, // s
    boostbackStart: 175, // s
    boostbackPitchDownDeg: -15, // deg thrust direction below horizontal during boostback
    boostbackFinalTrim: 3.0, // s on 3 engines
    finDeployT: 205, // s
    entryBurnAlt: 40_000, // m
    entryBurnSpeedTarget: 900, // m/s, speed at which the entry burn ends
    entryThrottle: 0.45, // - throttle of the 13-engine entry burn
    boostbackMinProp: 95_000, // kg, boostback stops before dipping below this
    entryMinProp: 62_000, // kg, entry burn stops before dipping below this (landing budget)
    gridFinLD: 0.5, // -
    boosterCdBroadside: 1.1, // - descending engines-first (with fins)
    landingThrottleMargin: 0.82, // fraction of available thrust planned by the suicide burn
    catchHeight: 70, // m above the OLM top (chopstick catch altitude of the booster base)
    shipPitchProgram: [
      // [s after staging, deg pitch above local horizontal] ship lofting to orbit insertion
      [0, 32],
      [60, 26],
      [160, 14],
      [240, 5],
      [300, 0],
    ] as [number, number][],
  },

  // ---------------------------------------------------------------- site (Section 6)
  site: {
    olmHeight: 20, // m, OLM table top above grade (grade is at y = -olmHeight)
    olmOuterRadius: 10.5, // m
    olmHoleDiameter: 8.0, // m
    olmTableThickness: 2.4, // m
    olmLegCount: 6,
    olmLegSize: 3.0, // m
    olmLegRadius: 9.5, // m, leg centers from pad center
    clampCount: 20,
    clampSize: [0.9, 0.4] as [number, number], // m
    qdPipeCount: 8,
    delugePlateRadius: 9.0, // m
    delugeJets: 24,
    tower: {
      height: 146, // m
      width: 10, // m square section
      offset: [-27, 0, -2] as [number, number, number], // m, tower base center (x, -, z) relative to pad
      beam: 0.4, // m square tube
      braceSpacing: 6, // m
      deckSpacing: 18, // m
      chopstickLength: 36, // m
      carriageParkHeight: 70, // m (y, above the OLM top) parked chopstick height before launch
      catchArmHeight: 104, // m (y) chopstick catch-beam height at the booster catch
      chopstickCloseTime: 6, // s
      shipQdHeight: 76, // m (y)
    },
    lightningMasts: [
      [-60, -95],
      [75, -40],
      [-20, 85],
    ] as [number, number][], // m (x, z)
    lightningMastHeight: 150, // m
    tankFarmCenter: [-210, 0, 70] as [number, number, number], // m
    shorelineX: 520, // m east of the pad where the Gulf beach starts
    shorelineAngleDeg: 8, // deg rotation of the coastline
    terrainSize: 20_000, // m
    terrainRings: 220,
    terrainSegments: 256,
    grassRadius: 900, // m, radius of the dense grass field around cameras
    floodlights: [
      [-62, 6, 46],
      [58, 6, 58],
      [52, 6, -66],
      [-58, 6, -58],
    ] as [number, number, number][], // m positions of the flood banks (on 26 m poles; grade is y=-20)
  },

  // ---------------------------------------------------------------- sky
  sky: {
    cloudBase: 1700, // m
    cloudTop: 2700, // m
    cloudCoverage: 0.27, // 0..1
    cloudDensity: 0.035, // 1/m extinction at full density
    cloudWindScale: 1.0,
    cirrusAlt: 9000, // m
    cirrusCoverage: 0.45,
    starBrightness: 1.0,
    milkyWay: 0.6,
    twinkleMaxAlt: 30000, // m
    earthBlend: [40000, 80000] as [number, number], // m, flat terrain -> sphere crossfade
    transmittanceLut: [256, 64] as [number, number],
    multiScatterLut: 32,
    skyViewLut: [192, 108] as [number, number],
  },

  // ---------------------------------------------------------------- VFX (Section 9)
  plume: {
    coreColor: [0.65, 0.78, 1.0] as [number, number, number],
    edgeColor: [1.0, 0.55, 0.15] as [number, number, number],
    coreTempK: 4000, // K
    edgeTempK: 1900, // K
    radianceScale: 900, // scene units at full throttle (core)
    pExit: 70_000, // Pa, Raptor SL nozzle exit pressure (over-expanded at sea level)
    pExitVac: 9_000, // Pa, RVac nozzle exit pressure
    mExit: 3.4, // exit Mach
    diamondCount: 5,
    diamondDecay: 9.0, // m
    lengthSL: 105, // m visible plume length at sea level (merged)
    lengthVac: 900, // m visible plume length in vacuum
    maxExpansionDeg: 55, // deg
    visibleFlowSpeed: 40, // m/s noise scroll (de-strobed)
    flickerHz: [6, 12] as [number, number],
    impingeMaxRadius: 140, // m
    impingeHeight: [15, 30] as [number, number], // m
    impingeFrontSpeed: 70, // m/s
    impingeDuration: 8, // s
    vacGlowRamp: 30, // s RVac skirt glow ramp
  },
  smoke: {
    domainSize: [1600, 800, 1600] as [number, number, number], // m
    domainCenter: [-220, 380, -200] as [number, number, number], // m, initial centre (downwind)
    vorticity: 0.4,
    hgG: [0.6, -0.2] as [number, number],
    shadowSteps: 6,
    steamAlbedo: 0.96,
    sootAlbedo: 0.18,
    dustAlbedo: 0.55,
    steamColor: [0.97, 0.95, 0.92] as [number, number, number],
    sootColor: [0.22, 0.19, 0.17] as [number, number, number],
    dustColor: [0.72, 0.6, 0.45] as [number, number, number],
    extinction: 0.06, // 1/m at unit grid density
    emissionRadius: 160, // m, orange underlight falloff
    dustRingSpeed: 70, // m/s
    columnRise: 30, // m/s
    maxHeight: [400, 700] as [number, number], // m
    dissipation: 140, // s steam e-folding
  },
  contrail: { puffs: 24000, w0: 6, growth: 0.12, growthExp: 0.9, life: 260 },
  deluge: { preflowT: -17, peakT: -3, droplets: 120000, jetSpeed: 38 },
  debris: { count: 150000, emberTime: 1.5, restitution: 0.2 },
  vaporCone: { machWindow: 0.25, thickness: [3, 7] as [number, number], length: [20, 50] as [number, number] },
  hotStage: { slotFlameLength: [4, 14] as [number, number], shockSpeed: 400, ventDuration: 4 },
  shock: { speedOfSound: 343, maxRadius: 1000, haloDuration: 3 },
  birds: { count: 80, startleT: -8 },

  // ---------------------------------------------------------------- camera (Section 11)
  camera: {
    sensor: [36, 24] as [number, number], // mm
    shutterAngle: 180, // deg
    fps: 24, // reference fps for shutter
    iso: 100,
    near: 0.1, // m
    far: 2e7, // m
    focusPullTime: 0.6, // s
    chromaticAberration: 0.4, // px at the edge
    vignette: 0.25,
    anamorphicThreshold: 6.0, // luminance
    shake: {
      lowAmp: 0.002, // rad per normalized thrust
      lowPos: 0.005, // m
      highAmp: 0.0004, // rad
      attenuationRef: 80, // m
      attenuationExp: 1.5,
      impulseDecay: 0.4, // s
    },
    freeFlySpeed: 30, // m/s
    freeFlyFast: 400, // m/s
  },

  // ---------------------------------------------------------------- post (Section 12)
  post: {
    bloomThreshold: 1.0,
    bloomKnee: 0.5,
    bloomIntensity: 0.07, // energy fraction redistributed (physically based; 0.35 of the spec reads as fog on HDR fire)
    plumeGlare: 0.12,
    exposureAdaptUp: 0.7, // s
    exposureAdaptDown: 1.5, // s
    evRange: [-6, 14] as [number, number],
    tonemapper: 'aces' as 'agx' | 'aces',
    grain: 0.04,
    halation: 0.03,
    vignette: 0.25,
    letterbox: 2.39,
    heatHazeStrength: 0.006,
    motionBlurShutter: 0.5, // fraction of frame (180 deg)
    dofMaxCoC: 14, // px at 1080p
    lutSize: 33,
    shadowLift: 0.012,
  },

  // ---------------------------------------------------------------- audio (Section 14)
  audio: {
    sampleRate: 48000, // Hz
    compressor: { threshold: -18, ratio: 3, attack: 0.008, release: 0.18 },
    limiterCeiling: -1, // dBTP
    distanceRef: 50, // m
    airAbsorptionRef: 1500, // m
    rumbleLag: 1.5, // s
    reverbRT60: 3.5, // s
    masterGain: 0.8,
  },

  hud: { updateHz: 8, eventFade: 3 },

  record: {
    warmupFrames: 8, // TAA / exposure warm-up frames after a seek or cut
    accumulationSubframes: 8, // sub-frames per frame for accumulation motion blur
  },
};

export type Config = typeof CONFIG;
