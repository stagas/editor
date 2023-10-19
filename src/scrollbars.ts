log.active
import { $, fn } from 'signal'
import { Editor } from './editor.ts'
import { Render } from './render.ts'
import { Scrollbar } from './scrollbar.ts'

export class Scrollbars extends Render {
  constructor(ctx: Editor) {
    super(ctx, ctx.rect, ctx.world.canvas)
  }
  scrollbarY = $(new Scrollbar(this.ctx), { dim: 'y' })
  scrollbarX = $(new Scrollbar(this.ctx), { dim: 'x' })
  items = [this.scrollbarY, this.scrollbarX]
  initCanvas() { }
  update() { return 0 }
  updateOne() { return 0 }
  @fn render(t: number, c: CanvasRenderingContext2D) {
    this.draw(t, c)
  }
  @fn draw(t: number, c: CanvasRenderingContext2D) {
    for (const item of this.items) {
      if (item.needRender) {
        item.render()
        item.draw(t, c)
      }
      else if (item.isVisible && item.needDraw) {
        item.draw(t, c)
      }
    }
    this.needRender
      = this.needDraw
      = false
  }
}
