// log.active
import { $, fn, fx } from 'signal'
import { Point } from 'std'
import { Comp } from './comp.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './renderable.ts'
import { Scrollbar } from './scrollbar.ts'

export class Scrollbars extends Comp {
  scrollbarY = $(new Scrollbar(this.ctx), { axis: 'y' })
  scrollbarX = $(new Scrollbar(this.ctx), { axis: 'x' })
  items = [this.scrollbarY, this.scrollbarX]

  get renderable(): $<Renderable> {
    $()
    const it = this
    class ScrollbarsRenderable extends Renderable {
      @fx trigger_needDraw() {
        let needDraw = false
        for (const { renderable: r } of it.items) {
          if (r.needRender) {
            needDraw = true
            break
          }
        }
        $()
        this.needDraw = needDraw
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        for (const { renderable: r } of it.items) {
          if (!r.isVisible) continue

          if (r.needRender) {
            r.render()
            r.draw(t, c)
          }
          else {
            r.draw(t, c)
          }
        }
        this.needDraw = false
      }

    }
    return $(new ScrollbarsRenderable(this.ctx, this.ctx.renderable.rect, this.ctx.world.canvas))
  }

  get pointable() {
    $()
    const it = this
    class ScrollbarsPointable extends Pointable {
      getItAtPoint(p: Point) {
        for (const item of it.items) {
          if (item.renderable.isVisible && item.pointable.getItAtPoint(p)) {
            return item
          }
        }
      }
    }
    return $(new ScrollbarsPointable(this))
  }
}
