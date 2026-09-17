import * as THREE from 'three'
import { mulberry32 } from '../lib/random'

/** Soft cloud/smoke puff drawn procedurally, so the app ships no image assets. */
export function createPuffTexture(size = 160, seed = 7, blobs = 16) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = mulberry32(seed)
  const c = size / 2

  ctx.clearRect(0, 0, size, size)
  for (let i = 0; i < blobs; i++) {
    const angle = rand() * Math.PI * 2
    const dist = Math.pow(rand(), 0.7) * size * 0.24
    const x = c + Math.cos(angle) * dist
    const y = c + Math.sin(angle) * dist
    const r = size * (0.12 + rand() * 0.18)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255,255,255,${0.3 + rand() * 0.22})`)
    g.addColorStop(0.55, 'rgba(255,255,255,0.13)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'destination-in'
  const mask = ctx.createRadialGradient(c, c, 0, c, c, c)
  mask.addColorStop(0, 'rgba(255,255,255,1)')
  mask.addColorStop(0.6, 'rgba(255,255,255,0.9)')
  mask.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = mask
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Radial falloff sprite used for engine glow and pad light. */
export function createGlowTexture(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,244,214,0.85)')
  g.addColorStop(0.45, 'rgba(255,196,120,0.32)')
  g.addColorStop(1, 'rgba(255,160,80,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

let puffCache: THREE.CanvasTexture | null = null
export function sharedPuffTexture() {
  if (!puffCache) puffCache = createPuffTexture()
  return puffCache
}

let glowCache: THREE.CanvasTexture | null = null
export function sharedGlowTexture() {
  if (!glowCache) glowCache = createGlowTexture()
  return glowCache
}
