import { Scene } from './scene/Scene'
import { Hud } from './hud/Hud'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Scene />
      <Hud />
    </div>
  )
}
