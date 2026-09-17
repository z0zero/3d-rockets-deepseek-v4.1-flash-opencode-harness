import { useMemo } from 'react'
import { mulberry32 } from '../lib/random'
import { createPuffTexture } from './textures'

interface CloudSpec {
  position: [number, number, number]
  scale: [number, number]
  opacity: number
  rotation: number
}

function buildClouds(): CloudSpec[] {
  const rand = mulberry32(4242)
  const specs: CloudSpec[] = []

  // Puffy clouds drifting around the launch site, at several layers.
  const layers = [
    { count: 26, yMin: 220, yMax: 700, rMin: 700, rMax: 4200, sMin: 260, sMax: 900 },
    { count: 22, yMin: 900, yMax: 1900, rMin: 500, rMax: 3200, sMin: 320, sMax: 1100 },
    { count: 16, yMin: 2100, yMax: 3300, rMin: 300, rMax: 2600, sMin: 360, sMax: 1200 },
  ]

  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      const angle = rand() * Math.PI * 2
      const radius = layer.rMin + rand() * (layer.rMax - layer.rMin)
      const width = layer.sMin + rand() * (layer.sMax - layer.sMin)
      specs.push({
        position: [
          Math.cos(angle) * radius,
          layer.yMin + rand() * (layer.yMax - layer.yMin),
          Math.sin(angle) * radius,
        ],
        scale: [width, width * (0.4 + rand() * 0.25)],
        opacity: 0.4 + rand() * 0.4,
        rotation: rand() * Math.PI,
      })
    }
  }

  // Thin high streaks for a sense of speed during the climb.
  for (let i = 0; i < 12; i++) {
    const angle = rand() * Math.PI * 2
    const radius = 400 + rand() * 3000
    specs.push({
      position: [
        Math.cos(angle) * radius,
        3400 + rand() * 1400,
        Math.sin(angle) * radius,
      ],
      scale: [900 + rand() * 1200, 90 + rand() * 110],
      opacity: 0.16 + rand() * 0.14,
      rotation: rand() * Math.PI,
    })
  }

  return specs
}

/** Volumetric-looking cloud field built from billboarded puffs. */
export function Clouds() {
  const clouds = useMemo(() => buildClouds(), [])
  const texture = useMemo(() => createPuffTexture(192, 21, 22), [])

  return (
    <group>
      {clouds.map((cloud, index) => (
        <sprite
          key={index}
          position={cloud.position}
          scale={[cloud.scale[0], cloud.scale[1], 1]}
        >
          <spriteMaterial
            map={texture}
            transparent
            opacity={cloud.opacity}
            rotation={cloud.rotation}
            depthWrite={false}
            fog
          />
        </sprite>
      ))}
    </group>
  )
}
