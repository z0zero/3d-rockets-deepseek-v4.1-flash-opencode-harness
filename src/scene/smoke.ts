import * as THREE from 'three'
import { sharedPuffTexture } from './textures'

export interface SmokeSpawn {
  position: [number, number, number]
  velocity: [number, number, number]
  /** Random velocity jitter applied on spawn. */
  spread?: number
  size: [number, number]
  life: [number, number]
  alpha: number
  color: [number, number, number]
  drag?: number
  buoyancy?: number
  spin?: number
}

const vertexShader = /* glsl */ `
  attribute vec3 iPos;
  attribute vec4 iData;   // size, alpha, rotation, seed
  attribute vec3 iColor;
  varying vec2 vUv;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vSeed;

  void main() {
    vUv = position.xy + 0.5;
    vAlpha = iData.y;
    vColor = iColor;
    vSeed = iData.w;

    float c = cos(iData.z);
    float s = sin(iData.z);
    vec2 corner = vec2(
      position.x * c - position.y * s,
      position.x * s + position.y * c
    ) * iData.x;

    vec4 viewPosition = modelViewMatrix * vec4(iPos, 1.0);
    viewPosition.xy += corner;
    gl_Position = projectionMatrix * viewPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vSeed;

  void main() {
    // Rotate the lookup per particle so the same puff reads differently.
    float a = vSeed * 6.2831853;
    vec2 uv = vUv - 0.5;
    uv = vec2(uv.x * cos(a) - uv.y * sin(a), uv.x * sin(a) + uv.y * cos(a));
    uv += 0.5;

    vec4 texel = texture2D(uMap, uv);
    float alpha = texel.a * vAlpha;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  age: number
  life: number
  size0: number
  size1: number
  alpha: number
  drag: number
  buoyancy: number
  rotation: number
  spin: number
  seed: number
  color: THREE.Color
  live: boolean
}

/**
 * Pooled, single-draw-call billboard smoke. Particles live in world space and
 * are billboarded in the vertex shader, which keeps the rocket's exhaust
 * behind the vehicle as it climbs away from the pad.
 */
export class SmokeSystem {
  readonly object: THREE.Mesh
  private readonly capacity: number
  private readonly particles: Particle[]
  private readonly positions: Float32Array
  private readonly data: Float32Array
  private readonly colors: Float32Array
  private readonly geometry: THREE.InstancedBufferGeometry
  private cursor = 0

  constructor(capacity = 520) {
    this.capacity = capacity
    this.particles = Array.from({ length: capacity }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      age: 0,
      life: 0,
      size0: 0,
      size1: 0,
      alpha: 0,
      drag: 1.6,
      buoyancy: 1.2,
      rotation: 0,
      spin: 0,
      seed: 0,
      color: new THREE.Color(),
      live: false,
    }))

    this.positions = new Float32Array(capacity * 3)
    this.data = new Float32Array(capacity * 4)
    this.colors = new Float32Array(capacity * 3)

    const quad = new THREE.PlaneGeometry(1, 1)
    this.geometry = new THREE.InstancedBufferGeometry()
    this.geometry.index = quad.index
    this.geometry.setAttribute('position', quad.attributes.position)
    this.geometry.instanceCount = capacity
    this.geometry.setAttribute(
      'iPos',
      new THREE.InstancedBufferAttribute(this.positions, 3),
    )
    this.geometry.setAttribute(
      'iData',
      new THREE.InstancedBufferAttribute(this.data, 4),
    )
    this.geometry.setAttribute(
      'iColor',
      new THREE.InstancedBufferAttribute(this.colors, 3),
    )

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uMap: { value: sharedPuffTexture() } },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    })

    this.object = new THREE.Mesh(this.geometry, material)
    this.object.frustumCulled = false
    this.object.renderOrder = 20
  }

  spawn(spec: SmokeSpawn) {
    const particle = this.particles[this.cursor]
    this.cursor = (this.cursor + 1) % this.capacity

    const spread = spec.spread ?? 0
    particle.position.set(...spec.position)
    particle.velocity.set(
      spec.velocity[0] + (Math.random() - 0.5) * spread,
      spec.velocity[1] + (Math.random() - 0.5) * spread * 0.6,
      spec.velocity[2] + (Math.random() - 0.5) * spread,
    )
    particle.age = 0
    particle.life = spec.life[0] + Math.random() * (spec.life[1] - spec.life[0])
    particle.size0 = spec.size[0]
    particle.size1 = spec.size[1] * (0.85 + Math.random() * 0.3)
    particle.alpha = spec.alpha
    particle.drag = spec.drag ?? 1.6
    particle.buoyancy = spec.buoyancy ?? 1.2
    particle.rotation = Math.random() * Math.PI * 2
    particle.spin = (spec.spin ?? 0.25) * (Math.random() - 0.5) * 2
    particle.seed = Math.random()
    particle.color.setRGB(...spec.color)
    particle.live = true
  }

  update(dt: number) {
    const { particles, positions, data, colors, capacity } = this
    for (let i = 0; i < capacity; i++) {
      const particle = particles[i]
      const offset = i * 3
      const dataOffset = i * 4

      if (!particle.live) {
        data[dataOffset + 1] = 0
        continue
      }

      particle.age += dt
      const t = particle.age / particle.life
      if (t >= 1) {
        particle.live = false
        data[dataOffset + 1] = 0
        continue
      }

      const dragFactor = Math.max(0, 1 - particle.drag * dt)
      particle.velocity.multiplyScalar(dragFactor)
      particle.velocity.y += particle.buoyancy * dt
      particle.position.addScaledVector(particle.velocity, dt)
      particle.rotation += particle.spin * dt

      // Grow quickly, then hold; fade in fast and out over the back half.
      const growth = 1 - Math.pow(1 - Math.min(1, t * 1.8), 3)
      const size = particle.size0 + (particle.size1 - particle.size0) * growth
      const fadeIn = Math.min(1, t / 0.08)
      const fadeOut = 1 - THREE.MathUtils.smoothstep(t, 0.4, 1)
      const alpha = particle.alpha * Math.min(fadeIn, fadeOut)

      positions[offset] = particle.position.x
      positions[offset + 1] = particle.position.y
      positions[offset + 2] = particle.position.z

      data[dataOffset] = size
      data[dataOffset + 1] = alpha
      data[dataOffset + 2] = particle.rotation
      data[dataOffset + 3] = particle.seed

      colors[offset] = particle.color.r
      colors[offset + 1] = particle.color.g
      colors[offset + 2] = particle.color.b
    }

    this.geometry.attributes.iPos.needsUpdate = true
    this.geometry.attributes.iData.needsUpdate = true
    this.geometry.attributes.iColor.needsUpdate = true
  }

  reset() {
    for (const particle of this.particles) particle.live = false
    this.data.fill(0)
    this.geometry.attributes.iData.needsUpdate = true
  }
}
