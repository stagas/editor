// log.active
import { $, fn, fx } from 'signal'
import { Point } from 'std'
import { Editor } from './editor.ts'
import { Render } from './render.ts'
import { Pointable } from './pointable.ts'
import { Scrollbar } from './scrollbar.ts'

export class Scrollbars extends Render {
  constructor(ctx: Editor) {
    super(ctx, ctx.rect, ctx.world.canvas)
  }
  scrollbarY = $(new Scrollbar(this.ctx), { dim: 'y' })
  scrollbarX = $(new Scrollbar(this.ctx), { dim: 'x' })
  items = [this.scrollbarY, this.scrollbarX]

  get pointable(): $<Pointable> {
    $._()
    return $(new Pointable(this), {
      getItemAtPoint: (p: Point) => {
        for (const item of this.items) {
          if (item.isVisible && item.pointable.getItemAtPoint(p)){
            return item.pointable
          }
        }
      }
    })
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
    console.log('need render eeee')
    this.needRender = needRender
  }
  @fn render(t: number, c: CanvasRenderingContext2D) {
    this.draw(t, c)
    this.needRender = false
  }
  @fn draw(t: number, c: CanvasRenderingContext2D) {
    console.log('draw')
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
