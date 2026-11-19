// Merged multi-engine exhaust plume (raymarched emissive volume).
// Plume-local frame: x along the flow (0 at the nozzle exit plane, +x downstream), radial coordinates in
// the plane perpendicular. The near field samples a per-engine pattern texture (R level, G ignition
// chug, B spark) whose footprint widens and blurs downstream until the jets merge into one column.
// Shock diamonds: brightness modulation 1 + 0.6 cos(2 pi x / Ld) exp(-x / Ldecay) (over-expanded flow).
// Expansion: r(x) = r0 + x tan(theta), theta growing with log(p_exit / p_amb) up to ~55 deg in vacuum.
// Colour: blackbody ramp, blue-white core (~4000 K equivalent) to orange afterburning edge (~1900 K).

uniform sampler2D tEngines;
uniform float uEngineExtent; // m, half-size of the engine pattern texture footprint
uniform float uLength; // m visible plume length
uniform float uRadius0; // m cluster radius at the exit plane
uniform float uExpansion; // rad
uniform float uDiamondL; // m
uniform float uDiamonds; // 0..1
uniform float uDiamondDecay; // m
uniform float uCore; // core brightness 0..1+
uniform float uAfterburn; // 0..1
uniform float uVacuum; // 0..1
uniform float uRadiance; // scene units
uniform float uFlowSpeed; // m/s visible scroll
uniform float uSteps;
uniform float uGroundX; // plume-local x where the ground / deflector plate cuts the flow (1e6 = none)
uniform float uFlicker;
uniform float uSeed;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;

float plumeRadius(float x) {
  float contract = uVacuum < 0.05 ? -0.06 * x * exp(-x / 12.0) : 0.0;
  return uRadius0 + 0.55 + contract + x * tan(max(uExpansion, 0.035));
}

// returns (emission scalar, temperature mix 0=edge..1=core, alpha-like density)
vec3 plumeDensity(vec3 q, float time) {
  float x = q.x;
  if (x < -0.05 || x > uLength) return vec3(0.0);
  vec2 rp = q.yz;
  float r = length(rp);
  float R = plumeRadius(x);
  if (r > R * 1.35) return vec3(0.0);
  float flowX = x - time * uFlowSpeed;
  // turbulence (3 octaves) advected along the flow
  vec3 tp = vec3(flowX * 0.18, rp * 0.32) + uSeed;
  float turb = gnoise3(tp) * 0.55 + gnoise3(tp * 2.1 + 3.1) * 0.3 + gnoise3(tp * 4.3 - 1.7) * 0.15;
  // near field: individual jets from the engine pattern, widening + blurring downstream
  float spread = 1.0 + x * tan(max(uExpansion, 0.0) + 0.012) / max(uRadius0, 0.5) + x * 0.02;
  vec2 uv = rp / (uEngineExtent * spread) * 0.5 + 0.5;
  float lod = clamp(log2(1.0 + x * 0.35), 0.0, 6.0);
  vec4 eng = (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) ? textureLod(tEngines, uv, lod) : vec4(0.0);
  // potential core of each jet shrinks downstream
  float jetCore = eng.r * exp(-x / (12.0 + 40.0 * uVacuum));
  // merged column: smooth profile with KH-roll perturbed edge
  float kh = 1.0 + 0.12 * sin(flowX * 0.9 + atan(rp.y, rp.x) * 3.0 + turb * 2.0);
  float rn = r / (R * kh);
  float column = exp(-rn * rn * 2.2) * smoothstep(0.0, 4.0, x + 1.0);
  float decay = exp(-x / (uLength * (0.32 + 0.25 * uVacuum)));
  // shock diamonds on each jet (over-expanded)
  float diam = 1.0 + 0.6 * uDiamonds * cos(6.2831853 * x / uDiamondL) * exp(-x / uDiamondDecay);
  float chug = eng.g;
  float spark = eng.b;
  float core = jetCore * diam * (1.0 + 0.25 * turb) * uCore * mix(1.0, 0.35, uVacuum);
  float dil = pow(clamp((uRadius0 + 0.55) / R, 0.0, 1.0), 1.6); // emission per volume ~ 1/area
  float body = column * decay * (0.55 + 0.45 * turb) * (0.4 + 0.6 * uCore) * dil;
  // ignition chugs: short, puffy, orange, unstable
  float puff = chug * exp(-x / 6.0) * (0.6 + 0.8 * abs(turb));
  float e = core * 2.6 + body * (0.6 + 0.4 * (1.0 - uVacuum)) + puff * 1.6 + spark * exp(-x * 2.0) * 6.0;
  e *= mix(1.0, 0.25, uVacuum * smoothstep(0.0, 1.0, x / uLength));
  // temperature: core mix (1) to edge (0)
  float tmix = clamp(core * 1.4 + exp(-rn * rn * 6.0) * decay * 0.6 - puff * 0.6, 0.0, 1.0);
  if (x > uGroundX) e *= exp(-(x - uGroundX) * 0.35);
  return vec3(e * uFlicker, tmix, body + core * 0.3);
}

vec3 plumeColor(float tmix, float afterburn, float vac) {
  vec3 core = uCoreColor;
  vec3 edge = mix(uEdgeColor, vec3(1.0, 0.75, 0.45), vac * 0.5);
  vec3 c = mix(edge, core, smoothstep(0.15, 0.85, tmix));
  // afterburning of the fuel-rich periphery with entrained air (strong at sea level)
  c = mix(c, vec3(1.0, 0.48, 0.12), (1.0 - tmix) * afterburn * 0.55);
  return c;
}
