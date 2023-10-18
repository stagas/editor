log.active
import { $, fx, init } from 'signal'
import { Canvas, Rect, Scene } from 'std'

export abstract class Render extends Scene {
  pr = this.world.screen.$.pr
  rect = $(new Rect)
  canvas = $(new Canvas(this.world), { size: this.rect.$.size })
  needRender?: boolean
  needDraw?: boolean
  needInit?: boolean
  abstract initCanvas(c: CanvasRenderingContext2D): void
  abstract render(c?: CanvasRenderingContext2D): void
  abstract draw(c: CanvasRenderingContext2D): void

  @fx trigger_needInit_on_size() {
    const { size: { text } } = $.of(this.canvas)
    this.needInit = true
  }

  // @fx update_canvas_size() {
  //   const { rect } = $.of(this)
  //   const { hasSize } = $.when(rect)
  //   this.canvas.size.set(rect.size)
  // }
}
