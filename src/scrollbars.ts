log.active
import { $, fx, fn } from 'signal'
import { Editor } from './editor.ts'
import { Render } from './render.ts'
import { Scrollbar } from './scrollbar.ts'
import { Pointable } from './pointable.ts'
import { Point } from 'std'

export class Scrollbars extends Render {
  constructor(ctx: Editor) {
    super(ctx, ctx.rect, ctx.world.canvas)
  }
  scrollbarY = $(new Scrollbar(this.ctx), { dim: 'y' })
  scrollbarX = $(new Scrollbar(this.ctx), { dim: 'x' })
  items = [this.scrollbarY, this.scrollbarX]
  @fn isPointWithin(p: Point) {
    for (const item of this.items) {
      if (item.isPointWithin(p)){
        return item
      }
    }
  }
  initCanvas() { }
  update() { return 0 }
  updateOne() { return 0 }
  @fx trigger_needRender() {
    let needRender = false
    for (const item of this.items) {
      if (item.needRender) {
        needRender = true
        break
      }
    }
    $._()
    this.needRender = needRender
  }
  @fn render(t: number, c: CanvasRenderingContext2D) {
    this.draw(t, c)
  }
  @fn draw(t: number, c: CanvasRenderingContext2D) {
    for (const item of this.items) {
      if (!item.isVisible) continue

      if (item.needRender) {
        item.render()
        item.draw(t, c)
      }
      else {
        item.draw(t, c)
      }
    }
    this.needRender
      = this.needDraw
      = false
  }
}
