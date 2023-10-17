import { $ } from 'signal'
import { Canvas, Rect, Scene } from 'std'

export class RenderScene extends Scene {
  pr = this.world.screen.$.pr
  canvas = $(new Canvas(this.world))
  rect = $(new Rect)
  needRender?: boolean
  needDraw?: boolean
}
