import { Clouds } from './Clouds'
import { Ground } from './Ground'
import { Lighting } from './Lighting'
import { Sky } from './Sky'
import { SUN_DIRECTION } from './constants'

/** World content: sky, light, terrain and the cloud field. */
export function World() {
  return (
    <>
      <Sky sunDirection={SUN_DIRECTION} />
      <Lighting />
      <fog attach="fog" args={['#cfe4f8', 1200, 9000]} />
      <Ground />
      <Clouds />
    </>
  )
}
