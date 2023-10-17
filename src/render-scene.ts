import { $ } from 'signal'
import { Canvas, Rect, Scene } from 'std'

export abstract class RenderScene extends Scene {
  pr = this.world.screen.$.pr
  canvas = $(new Canvas(this.world))
  rect = $(new Rect)
  needRender?: boolean
  needDraw?: boolean
  abstract render(c: CanvasRenderingContext2D): void
  abstract draw(c: CanvasRenderingContext2D): void
}
