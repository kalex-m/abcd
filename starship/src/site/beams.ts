import * as THREE from 'three';

/**
 * Instanced structural members: each instance is a unit box stretched between two endpoints with a
 * square or rectangular section. Used by the tower lattice, OLM ribs, masts, railings, pipe racks.
 */
export interface Beam {
  a: THREE.Vector3;
  b: THREE.Vector3;
  w: number; // section width (m)
  d?: number; // section depth (m), defaults to w
  up?: THREE.Vector3; // orientation hint for rectangular sections
}

const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);

/** Build one InstancedMesh for a list of beams. */
export function beamMesh(beams: Beam[], material: THREE.Material, geometry: THREE.BufferGeometry = unitBox): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, beams.length));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const side = new THREE.Vector3();
  const tmpM = new THREE.Matrix4();
  beams.forEach((bm, i) => {
    dir.subVectors(bm.b, bm.a);
    const len = dir.length();
    dir.normalize();
    q.setFromUnitVectors(yAxis, dir);
    if (bm.up) {
      // roll the section so its local x aligns with `up` projected perpendicular to the beam
      side.copy(bm.up).addScaledVector(dir, -bm.up.dot(dir)).normalize();
      const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
      const ang = Math.atan2(new THREE.Vector3().crossVectors(localX, side).dot(dir), localX.dot(side));
      q.premultiply(new THREE.Quaternion().setFromAxisAngle(dir, ang));
    }
    s.set(bm.w, len, bm.d ?? bm.w);
    m.compose(bm.a, q, s);
    mesh.setMatrixAt(i, tmpM.copy(m));
  });
  mesh.count = beams.length;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** Cylinder between two points (single mesh), e.g. pipes and pistons. */
export function cylinderBetween(a: THREE.Vector3, b: THREE.Vector3, r: number, material: THREE.Material, seg = 12): THREE.Mesh {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, false).translate(0, len / 2, 0);
  const mesh = new THREE.Mesh(g, material);
  mesh.position.copy(a);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

/** Merge transformed geometries for static clusters. */
export function placed(g: THREE.BufferGeometry, pos: THREE.Vector3, rotY = 0, scale = 1): THREE.BufferGeometry {
  const c = g.clone();
  c.applyMatrix4(new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(scale, scale, scale)));
  return c;
}
