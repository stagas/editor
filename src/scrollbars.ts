log.active
import { $, fn, fx } from 'signal'
import { Point } from 'std'
import { Comp } from './comp.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './renderable.ts'
import { Scrollbar } from './scrollbar.ts'

export class Scrollbars extends Comp {
  scrollbarY = $(new Scrollbar(this.ctx), { dim: 'y' })
  scrollbarX = $(new Scrollbar(this.ctx), { dim: 'x' })
  items = [this.scrollbarY, this.scrollbarX]

  get renderable(): $<Renderable> {
    $()
    const it = this
    class ScrollbarsRenderable extends Renderable {
      @fx trigger_needRender() {
        let needRender = false
        for (const { renderable: r } of it.items) {
          if (r.needRender) {
            needRender = true
            break
          }
        }
        // $()
        this.needRender = needRender
      }
      @fn render(t: number, c: CanvasRenderingContext2D) {
        this.draw(t, c)
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        for (const {renderable:r } of it.items) {
          if (!r.isVisible) continue

          if (r.needRender) {
            r.render()
            r.draw(t, c)
          }
          else {
            r.draw(t, c)
          }
        }
        this.needRender
          = this.needDraw
          = false
      }

    }
    return $(new ScrollbarsRenderable(this.ctx, this.ctx.renderable.rect, this.ctx.world.canvas))
  }

  get pointable(): $<Pointable> {
    $()
    return $(new Pointable(this), {
      getItemAtPoint: (p: Point) => {
        for (const item of this.items) {
          if (item.renderable.isVisible && item.pointable.getItemAtPoint(p)) {
            return item.pointable
          }
        }
      }
    })
  }
}
