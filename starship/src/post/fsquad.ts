import * as THREE from 'three';

/** Single fullscreen triangle used by every post pass and LUT generator. */
export class FullscreenQuad {
  static readonly vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
  private readonly mesh: THREE.Mesh;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.mesh = new THREE.Mesh(g);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  /** Render `material` over the whole target (null = canvas). */
  render(renderer: THREE.WebGLRenderer, material: THREE.Material, target: THREE.WebGLRenderTarget | null): void {
    this.mesh.material = material;
    const prev = renderer.getRenderTarget();
    const prevAuto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
    renderer.autoClear = prevAuto;
    renderer.setRenderTarget(prev);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
  }
}

/** Convenience ShaderMaterial for fullscreen passes. */
export function passMaterial(fragmentShader: string, uniforms: Record<string, THREE.IUniform>, extra: Partial<THREE.ShaderMaterialParameters> = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: FullscreenQuad.vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    ...extra,
  });
}
