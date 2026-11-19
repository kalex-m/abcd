import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { beamMesh, cylinderBetween, placed, type Beam } from './beams';
import { concrete, galvanised, towerSteel, sootInterior, paintRed, paintYellow, rubberBlack, darkMetal, whiteInsulation, frostWhite } from '../vehicle/materials';
import { GLSL_NOISE } from '../util/noise';
import { DEG, smoothstep } from '../util/math';
import { terrainHeight } from './terrain';

/**
 * Orbital launch mount: elevated ring table (open flame hole) on six ribbed legs, 20 hold-down clamps,
 * 8 articulated QD umbilicals that retract at T-1 s, perforated deluge plate with its nozzle ring and
 * water film, charred foundation, pipe racks to the tank farm, apron vehicles and a perimeter fence.
 * Soot/char on the steel and concrete accumulates with plume exposure (uniform per frame).
 */
export class Pad implements System {
  readonly name = 'pad';
  readonly group = new THREE.Group();
  private readonly qdArms: THREE.Group[] = [];
  private readonly scorch = { value: 0 };
  private readonly waterFilm: THREE.Mesh;

  constructor(parent: THREE.Object3D) {
    const s = CONFIG.site;
    const G = -s.olmHeight;
    this.group.name = 'pad';
    parent.add(this.group);
    const steel = this.charred(towerSteel());
    const conc = concrete();

    // --- table: ring lathe with chamfers
    const rIn = s.olmHoleDiameter / 2, rOut = s.olmOuterRadius, th = s.olmTableThickness;
    const prof = [
      new THREE.Vector2(rIn, -th), new THREE.Vector2(rOut - 0.3, -th), new THREE.Vector2(rOut, -th + 0.3),
      new THREE.Vector2(rOut, -0.15), new THREE.Vector2(rOut - 0.15, 0), new THREE.Vector2(rIn + 0.1, 0), new THREE.Vector2(rIn, -0.1), new THREE.Vector2(rIn, -th),
    ];
    const table = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), steel);
    table.castShadow = table.receiveShadow = true;
    this.group.add(table);
    // top plate seams + bolts
    const boltG = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6);
    const bolts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      for (const r of [rIn + 0.35, rOut - 0.35]) bolts.push(placed(boltG, new THREE.Vector3(Math.cos(a) * r, 0.04, Math.sin(a) * r)));
    }
    const boltMesh = new THREE.Mesh(mergeGeometries(bolts), galvanised());
    this.group.add(boltMesh);
    // underside radial girders
    const girders: Beam[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 15 * DEG;
      girders.push({ a: new THREE.Vector3(Math.cos(a) * rIn, -th - 1.2, Math.sin(a) * rIn), b: new THREE.Vector3(Math.cos(a) * rOut, -th - 1.2, Math.sin(a) * rOut), w: 1.2, d: 0.6, up: new THREE.Vector3(0, 1, 0) });
    }
    const gm = beamMesh(girders, steel);
    gm.castShadow = true;
    this.group.add(gm);

    // --- six legs with rib stiffeners and plinths
    const legBeams: Beam[] = [];
    const ribBeams: Beam[] = [];
    for (let i = 0; i < s.olmLegCount; i++) {
      const a = (i / s.olmLegCount) * Math.PI * 2 + 30 * DEG;
      const cx = Math.cos(a) * s.olmLegRadius, cz = Math.sin(a) * s.olmLegRadius;
      legBeams.push({ a: new THREE.Vector3(cx, G, cz), b: new THREE.Vector3(cx, -th, cz), w: s.olmLegSize, d: s.olmLegSize });
      for (let k = 0; k < 4; k++) {
        const fa = (k / 4) * Math.PI * 2;
        const ox = Math.cos(fa) * (s.olmLegSize / 2 + 0.08), oz = Math.sin(fa) * (s.olmLegSize / 2 + 0.08);
        for (const off of [-0.8, 0.8]) {
          const px = cx + ox + (Math.abs(oz) > 0.1 ? off : 0), pz = cz + oz + (Math.abs(ox) > 0.1 ? off : 0);
          ribBeams.push({ a: new THREE.Vector3(px, G + 1.2, pz), b: new THREE.Vector3(px, -th - 0.2, pz), w: 0.16, d: 0.16 });
        }
      }
    }
    const legs = beamMesh(legBeams, steel);
    legs.castShadow = legs.receiveShadow = true;
    const ribs = beamMesh(ribBeams, steel);
    ribs.castShadow = true;
    this.group.add(legs, ribs);
    const plinthG = new THREE.BoxGeometry(5, 1.4, 5);
    const plinths: THREE.BufferGeometry[] = [];
    for (let i = 0; i < s.olmLegCount; i++) {
      const a = (i / s.olmLegCount) * Math.PI * 2 + 30 * DEG;
      plinths.push(placed(plinthG, new THREE.Vector3(Math.cos(a) * s.olmLegRadius, G + 0.7, Math.sin(a) * s.olmLegRadius), a));
    }
    const pl = new THREE.Mesh(mergeGeometries(plinths), conc);
    pl.receiveShadow = pl.castShadow = true;
    this.group.add(pl);

    // --- foundation: round concrete pad with a charred basin under the deluge plate
    const found = new THREE.Mesh(new THREE.CylinderGeometry(24, 25, 0.6, 64), this.charred(concrete()));
    found.position.y = G + 0.3;
    found.receiveShadow = true;
    this.group.add(found);
    const basinWall = new THREE.Mesh(new THREE.CylinderGeometry(9.8, 9.8, 2.2, 64, 1, true), sootInterior());
    basinWall.position.y = G + 1.4;
    this.group.add(basinWall);

    // --- deluge plate: thick perforated steel disc on a pedestal with a ring of nozzles
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(s.delugePlateRadius, s.delugePlateRadius + 0.2, 1.0, 64), this.perforated());
    plate.position.y = G + 3.2;
    plate.castShadow = plate.receiveShadow = true;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4, 2.6, 32), conc);
    ped.position.y = G + 1.4;
    this.group.add(plate, ped);
    const nozG = new THREE.CylinderGeometry(0.18, 0.24, 0.6, 10).rotateZ(Math.PI / 2);
    const noz: THREE.BufferGeometry[] = [];
    for (let i = 0; i < s.delugeJets; i++) {
      const a = (i / s.delugeJets) * Math.PI * 2;
      noz.push(placed(nozG, new THREE.Vector3(Math.cos(a) * (s.delugePlateRadius + 0.3), G + 3.5, Math.sin(a) * (s.delugePlateRadius + 0.3)), -a));
    }
    this.group.add(new THREE.Mesh(mergeGeometries(noz), galvanised()));
    // thin standing water film on the plate (wet steel look)
    this.waterFilm = new THREE.Mesh(new THREE.CircleGeometry(s.delugePlateRadius - 0.2, 64).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x0a1416, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.0, depthWrite: false }));
    this.waterFilm.position.y = G + 3.72;
    this.group.add(this.waterFilm);
    // deluge manifold ring
    const manifold = new THREE.Mesh(new THREE.TorusGeometry(s.delugePlateRadius + 0.6, 0.45, 12, 96).rotateX(Math.PI / 2), galvanised());
    manifold.position.y = G + 3.2;
    this.group.add(manifold);

    // --- hold-down clamps (20) around the aft ring
    const clampG = mergeGeometries([
      new THREE.BoxGeometry(s.clampSize[0], 1.3, s.clampSize[1]).translate(0, 0.65, 0),
      new THREE.CylinderGeometry(0.16, 0.16, 1.2, 10).rotateZ(Math.PI / 2).translate(0.55, 0.9, 0),
      new THREE.BoxGeometry(0.35, 0.35, 0.55).translate(-0.5, 1.15, 0),
    ]);
    const clamps = new THREE.InstancedMesh(clampG, paintYellow(), s.clampCount);
    const mm = new THREE.Matrix4();
    for (let i = 0; i < s.clampCount; i++) {
      const a = (i / s.clampCount) * Math.PI * 2;
      mm.compose(new THREE.Vector3(Math.cos(a) * 5.35, 0, Math.sin(a) * 5.35), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a), new THREE.Vector3(1, 1, 1));
      clamps.setMatrixAt(i, mm);
    }
    clamps.castShadow = true;
    this.group.add(clamps);

    // --- QD umbilicals: pipes along the table to articulated arms that hug the booster base
    const qdMat = galvanised();
    for (let i = 0; i < s.qdPipeCount; i++) {
      const a = Math.PI + (i - (s.qdPipeCount - 1) / 2) * 7 * DEG; // on the tower (west) side
      const arm = new THREE.Group();
      const r0 = rOut - 0.5, r1 = 5.8;
      const p0 = new THREE.Vector3(Math.cos(a) * r0, 0.5, Math.sin(a) * r0);

      this.group.add(cylinderBetween(p0.clone().setY(0.35), p0.clone().setY(0.35).multiplyScalar(1.6).setY(0.35), 0.28, i % 3 === 0 ? frostWhite() : qdMat));
      arm.position.copy(p0);
      const armLen = r0 - r1;
      const boom = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.6, 0.7).translate(-armLen / 2, 0.6, 0), towerSteel());
      const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, armLen, 10).rotateZ(Math.PI / 2).translate(-armLen / 2, 1.15, 0), i % 3 === 0 ? frostWhite() : rubberBlack());
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 1.0).translate(-armLen, 0.9, 0), darkMetal());
      boom.castShadow = hose.castShadow = head.castShadow = true;
      arm.add(boom, hose, head);
      arm.rotation.y = -a + Math.PI;
      arm.userData.baseRot = arm.rotation.y;
      this.qdArms.push(arm);
      this.group.add(arm);
    }

    // --- pipe racks to the tank farm (painted / frosted LOX lines)
    const tf = new THREE.Vector3(CONFIG.site.tankFarmCenter[0], G, CONFIG.site.tankFarmCenter[2]);
    const rackPosts: Beam[] = [];
    const start = new THREE.Vector3(-14, G, 6);
    const end = tf.clone().add(new THREE.Vector3(40, 0, -10));
    const n = 22;
    for (let k = 0; k <= n; k++) {
      const p = start.clone().lerp(end, k / n);
      const hy = terrainHeight(p.x, p.z);
      rackPosts.push({ a: new THREE.Vector3(p.x, G + hy, p.z - 1.2), b: new THREE.Vector3(p.x, G + 3.2, p.z - 1.2), w: 0.25 });
      rackPosts.push({ a: new THREE.Vector3(p.x, G + hy, p.z + 1.2), b: new THREE.Vector3(p.x, G + 3.2, p.z + 1.2), w: 0.25 });
      rackPosts.push({ a: new THREE.Vector3(p.x, G + 3.2, p.z - 1.4), b: new THREE.Vector3(p.x, G + 3.2, p.z + 1.4), w: 0.3, up: new THREE.Vector3(0, 1, 0) });
    }
    const posts = beamMesh(rackPosts, galvanised());
    posts.castShadow = true;
    this.group.add(posts);
    const pipeMats = [frostWhite(), paintRed(), galvanised(), whiteInsulation()];
    [-0.9, -0.3, 0.3, 0.9].forEach((dz, j) => {
      const p = cylinderBetween(start.clone().add(new THREE.Vector3(0, 3.6 + (j % 2) * 0.1, dz)), end.clone().add(new THREE.Vector3(0, 3.6 + (j % 2) * 0.1, dz)), j === 0 ? 0.45 : 0.3, pipeMats[j], 14);
      p.castShadow = true;
      this.group.add(p);
    });

    // --- apron trucks (scale cues) and a perimeter fence near the shot-2 camera
    const truck = mergeGeometries([
      new THREE.BoxGeometry(2.5, 2.5, 6.5).translate(0, 1.6, 0),
      new THREE.BoxGeometry(2.4, 2.1, 2.2).translate(0, 1.4, 4.4),
    ]);
    const wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12).rotateZ(Math.PI / 2);
    const wheels: THREE.BufferGeometry[] = [];
    for (const [x, z] of [[-1.1, -2], [1.1, -2], [-1.1, 0.5], [1.1, 0.5], [-1.1, 4.6], [1.1, 4.6]]) wheels.push(wheel.clone().translate(x, 0.5, z));
    const truckW = mergeGeometries(wheels);
    const truckPos: [number, number, number][] = [[-95, 0, 46, 0.3], [-108, 0, 52, 0.2], [70, 0, -95, 1.4], [-160, 0, 120, 2.0]].map(([x, , z, r]) => [x, z, r]) as [number, number, number][];
    truckPos.forEach(([x, z, r], i) => {
      const tm = new THREE.Mesh(truck, i % 2 ? whiteInsulation() : new THREE.MeshStandardMaterial({ color: new THREE.Color(0.3, 0.32, 0.36), roughness: 0.5, metalness: 0.3 }));
      tm.position.set(x, G + terrainHeight(x, z), z);
      tm.rotation.y = r;
      tm.castShadow = true;
      const tw = new THREE.Mesh(truckW, rubberBlack());
      tm.add(tw);
      this.group.add(tm);
    });
    const fence: Beam[] = [];
    const f0 = new THREE.Vector3(-110, 0, 96), f1 = new THREE.Vector3(-55, 0, 100);
    for (let k = 0; k <= 24; k++) {
      const p = f0.clone().lerp(f1, k / 24);
      const hy = G + terrainHeight(p.x, p.z);
      fence.push({ a: new THREE.Vector3(p.x, hy, p.z), b: new THREE.Vector3(p.x, hy + 2.1, p.z), w: 0.07 });
    }
    for (const yy of [0.15, 1.05, 2.05]) fence.push({ a: f0.clone().setY(G + yy + terrainHeight(f0.x, f0.z)), b: f1.clone().setY(G + yy + terrainHeight(f1.x, f1.z)), w: 0.05 });
    const fm = beamMesh(fence, galvanised());
    fm.castShadow = true;
    this.group.add(fm);
    // chain-link panels (alpha-tested procedural mesh)
    const meshMat = new THREE.MeshStandardMaterial({ color: 0x6a6c6e, metalness: 0.7, roughness: 0.5, side: THREE.DoubleSide, alphaTest: 0.5 });
    meshMat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <alphatest_fragment>', `
{ vec2 g = vUv * vec2(55.0 * 18.0, 2.0 * 18.0); vec2 f = abs(fract(vec2(g.x + g.y, g.x - g.y) * 0.5) - 0.5); float wire = 1.0 - smoothstep(0.06, 0.12, min(f.x, f.y)); diffuseColor.a = wire; }
#include <alphatest_fragment>`);
    };
    meshMat.customProgramCacheKey = () => 'chainlink';
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(f0.distanceTo(f1), 2.0), meshMat);
    panel.position.copy(f0.clone().lerp(f1, 0.5)).setY(G + 1.1 + terrainHeight(-82, 98));
    panel.rotation.y = -Math.atan2(f1.z - f0.z, f1.x - f0.x);
    // vUv available via a dummy map-less uv define
    (meshMat as unknown as { defines: Record<string, string> }).defines = { USE_UV: '' };
    this.group.add(panel);

    this.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).receiveShadow = true;
    });
  }

  /** Wrap a material so it darkens with accumulated plume exposure near the pad centre. */
  private charred<T extends THREE.MeshStandardMaterial>(m: T): T {
    const scorch = this.scorch;
    const prev = m.onBeforeCompile;
    const prevKey = m.customProgramCacheKey();
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r);
      sh.uniforms.uScorchP = scorch;
      if (!sh.vertexShader.includes('varying vec3 vWp;')) {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;');
      }
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform float uScorchP;\n${sh.fragmentShader.includes('gnoise3') ? '' : GLSL_NOISE}`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
{
  float r = length(vWp.xz);
  float n = fbm3(vWp * 0.5, 3) * 0.5 + 0.5;
  float ch = uScorchP * (1.0 - smoothstep(6.0, 22.0 + 6.0 * n, r)) * smoothstep(0.3, 0.7, n + 0.25);
  diffuseColor.rgb *= 1.0 - 0.8 * ch;
  roughnessFactor = mix(roughnessFactor, 0.95, ch);
}`);
    };
    m.customProgramCacheKey = () => `charred-${prevKey}`;
    return m;
  }

  private perforated(): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color: 0x3b3c3e, metalness: 0.8, roughness: 0.5 });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPp = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPp;').replace('#include <color_fragment>', `#include <color_fragment>
{ vec2 g = vPp.xz / 0.45; vec2 f = fract(g) - 0.5; float hole = 1.0 - smoothstep(0.16, 0.2, length(f)); diffuseColor.rgb *= 1.0 - 0.9 * hole * step(0.4, vPp.y); }`);
    };
    m.customProgramCacheKey = () => 'perforated';
    return m;
  }

  update(ctx: FrameContext): void {
    const t = ctx.mission;
    // accumulated plume exposure (exposure-time integral approximation)
    this.scorch.value = smoothstep(-8, 6, t) * 0.85;
    const ret = ctx.snap.qdRetract;
    this.qdArms.forEach((a, i) => {
      a.rotation.z = -ret * 0.55;
      a.rotation.y = a.userData.baseRot + ret * (i % 2 ? 0.25 : -0.25);
    });
    const film = this.waterFilm.material as THREE.MeshPhysicalMaterial;
    film.opacity = Math.min(0.85, ctx.snap.deluge * 1.2 + (t > -17 && t < 200 ? 0.3 : 0));
  }

  dispose(): void {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
      }
    });
  }
}
