log.active
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

  @fx run_initCanvas() {
    const { c, size: { xy } } = $.of(this.canvas)
    $.untrack()
    $.flush()
    this.initCanvas?.(c)
  }

  @fx update_canvas_size() {
    const { rect } = $.of(this)
    const { hasSize } = $.when(rect)
    this.canvas.size.set(rect.size)
  }
}
