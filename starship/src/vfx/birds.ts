import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';

/**
 * Seagull flock (Section 10): 80 birds loafing over the marsh north-west of the pad, startled at T-8 by
 * the ignition and fleeing away from the pad while climbing. Each bird is a two-triangle wing mesh
 * flapped in the vertex shader (2-frame wing morph); trajectories are analytic in mission time.
 */
export class Birds implements System {
  readonly name = 'birds';
  private readonly mesh: THREE.InstancedMesh;
  private readonly flap = { value: 0 };
  private readonly seeds: Float32Array;

  constructor(world: THREE.Object3D) {
    const n = CONFIG.birds.count;
    const g = new THREE.BufferGeometry();
    // body + two wings (span 1.3 m)
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.3, 0, 0, -0.25, -0.65, 0, -0.05, 0, 0, 0.3, 0.65, 0, -0.05, 0, 0, -0.25], 3));
    g.setAttribute('aWing', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 0], 1));
    g.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x9a9a98, roughness: 0.8, side: THREE.DoubleSide });
    const flap = this.flap;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uFlap = flap;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aWing;\nuniform float uFlap;').replace('#include <begin_vertex>', `#include <begin_vertex>
float ph = uFlap * 7.0 + float(gl_InstanceID) * 1.37;
transformed.y += aWing * sin(ph) * 0.45;`);
    };
    this.mesh = new THREE.InstancedMesh(g, mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.seeds = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) this.seeds[i] = Math.abs(Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1;
    world.add(this.mesh);
  }

  update(ctx: FrameContext): void {
    const T = ctx.mission;
    const st = CONFIG.birds.startleT;
    const G = -CONFIG.site.olmHeight;
    const home = new THREE.Vector3(-150, G + 9, -130);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < CONFIG.birds.count; i++) {
      const s0 = this.seeds[i * 4], s1 = this.seeds[i * 4 + 1], s2 = this.seeds[i * 4 + 2], s3 = this.seeds[i * 4 + 3];
      // loafing: slow circles around home
      const w = 0.25 + 0.15 * s0;
      const ang = T * w + s1 * Math.PI * 2;
      const r = 25 + 40 * s2;
      const p = home.clone().add(new THREE.Vector3(Math.cos(ang) * r, 3 * Math.sin(T * 0.7 + s3 * 6), Math.sin(ang) * r));
      const vel = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).multiplyScalar(w * r);
      const a = T - (st + 0.6 * s3);
      if (a > 0) {
        // flee away from the pad, climbing
        const away = p.clone().setY(0).normalize();
        const flee = away.multiplyScalar(14 + 6 * s0).add(new THREE.Vector3(0, 4 + 3 * s1, 0));
        const k = 1 - Math.exp(-a / 1.5);
        p.addScaledVector(flee, a * k);
        vel.lerp(flee, k);
      }
      if (T < -95 || (a > 60)) { m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, m); continue; }
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vel.clone().normalize());
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.flap.value = T + (T > st ? (T - st) * 1.5 : 0);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
