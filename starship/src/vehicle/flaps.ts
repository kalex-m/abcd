import * as THREE from 'three';
import { CONFIG } from '../config';
import { GLSL_NOISE } from '../util/noise';
import { darkMetal, plumbingSteel } from './materials';
import { shipRadius } from './profile';

/**
 * Ship control flaps: two forward (6 x 3 m) and two aft (9 x 5.5 m), each a bevelled slab hinged
 * along a line parallel to the hull with chunky actuator housings. The windward face carries a
 * procedural hex tile pattern; the leeward face is stainless. `deployAngle` animates the re-entry pose;
 * during ascent the flaps stay folded against the hull.
 */
export class Flaps {
  readonly group = new THREE.Group();
  private readonly hinges: { g: THREE.Group; side: number }[] = [];

  constructor(steel: THREE.Material, layers: number) {
    const f = CONFIG.vehicle.flaps;
    const tileMat = createHexTileMaterial();
    const make = (len: number, span: number, y0: number, side: number, angOff: number) => {
      const hinge = new THREE.Group();
      const th = (side > 0 ? 0 : Math.PI) + angOff;
      const r = shipRadius(y0 + len / 2);
      hinge.position.set(Math.cos(th) * r, y0, Math.sin(th) * r);
      hinge.rotation.y = -th;
      // slab: x outward (span), y along the axis (length), z thickness; windward face towards -z (belly)
      const thick = 0.32;
      const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(span, len * 0.12), new THREE.Vector2(span, len * 0.92), new THREE.Vector2(0, len)]);
      const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 });
      g.translate(0, 0, -thick / 2);
      const slabSteel = new THREE.Mesh(g, steel);
      // tiled windward face: towards the belly (-z world); hinge-local z flips with the side
      const face = new THREE.Mesh(new THREE.ShapeGeometry(shape).translate(0, 0, -side * (thick / 2 + 0.065)), tileMat);
      slabSteel.castShadow = face.castShadow = true;
      slabSteel.layers.enable(layers);
      face.layers.enable(layers);
      const flap = new THREE.Group();
      flap.add(slabSteel, face);
      hinge.add(flap);
      // actuator housing and hinge fairing (fixed to the hull)
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.9, len * 0.45, 1.3), darkMetal());
      housing.position.set(-0.2, y0 + len * 0.5, 0);
      housing.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0);
      const hg = new THREE.Group();
      hg.position.set(Math.cos(th) * (r + 0.1), 0, Math.sin(th) * (r + 0.1));
      hg.rotation.y = -th;
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.7, len * 0.5, 1.2), darkMetal());
      hb.position.set(0.1, y0 + len * 0.5, 0.4);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, len * 0.9, 10), plumbingSteel());
      rod.position.set(0.25, y0 + len * 0.5, 0.0);
      hb.castShadow = true;
      hg.add(hb, rod);
      this.group.add(hinge, hg);
      this.hinges.push({ g: flap, side });
    };
    const H = CONFIG.vehicle.shipHeight;
    make(f.aft.length, f.aft.width, f.aft.hingeFromBase, 1, 0);
    make(f.aft.length, f.aft.width, f.aft.hingeFromBase, -1, 0);
    const fy = H - f.fwd.hingeFromNoseTip - f.fwd.length - 6;
    make(f.fwd.length, f.fwd.width, fy, 1, 0.35);
    make(f.fwd.length, f.fwd.width, fy, -1, -0.35);
    this.setDeploy(0);
  }

  /** 0 = folded against the hull (ascent), 1 = extended (belly-flop). */
  setDeploy(d: number): void {
    for (const h of this.hinges) h.g.rotation.y = -(1 - d) * 1.48 * h.side;
  }

  dispose(): void {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
  }
}

/** Black hex-tile face material (procedural pattern in object xy, 0.182 m pitch). */
export function createHexTileMaterial(): THREE.MeshStandardMaterial {
  const tileMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0, side: THREE.DoubleSide });
  tileMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFp = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${GLSL_NOISE}\nvarying vec3 vFp;`).replace('#include <color_fragment>', `#include <color_fragment>
{
  vec2 p = vFp.xy / 0.182;
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  vec2 id = p - g;
  float e = max(abs(g.x), dot(abs(g), normalize(vec2(1.0, 1.7320508))));
  float tile = 1.0 - smoothstep(0.43, 0.47, e);
  vec3 tc = vec3(${CONFIG.vehicle.tiles.albedo.toFixed(3)}) * (0.85 + 0.3 * hash12(id));
  diffuseColor.rgb = mix(vec3(0.28, 0.27, 0.25), tc, tile);
}`);
  };
  tileMat.customProgramCacheKey = () => 'flaptiles';
  return tileMat;
}
