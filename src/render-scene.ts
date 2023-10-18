import { $, fx, init } from 'signal'
import { Canvas, Rect, Scene } from 'std'

export abstract class RenderScene extends Scene {
  pr = this.world.screen.$.pr
  canvas = $(new Canvas(this.world))
  rect = $(new Rect)
  needRender?: boolean
  needDraw?: boolean
  abstract initCanvas(c: CanvasRenderingContext2D): void
  abstract render(c?: CanvasRenderingContext2D): void
  abstract draw(c: CanvasRenderingContext2D): void

  @fx update_initCanvas() {
    console.log('what')
    const { c, size: { xy } } = $.of(this.canvas)
    this.initCanvas?.(c)
  }
}
