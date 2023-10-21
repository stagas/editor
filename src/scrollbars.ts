// log.active
import { $ } from 'signal'
import { Comp } from './comp.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './renderable.ts'
import { Scrollbar } from './scrollbar.ts'

export class Scrollbars extends Comp {
  scrollbarY = $(new Scrollbar(this.ctx), { axis: 'y' })
  scrollbarX = $(new Scrollbar(this.ctx), { axis: 'x' })
  get renderables() {
    const t = $.of(this)
    return [
      t.scrollbarY,
      t.scrollbarX,
    ]
  }
  get pointables() {
    const t = $.of(this)
    return [
      t.scrollbarY,
      t.scrollbarX,
    ]
  }
  get renderable(): $<Renderable> {
    $()
    // const it = this
    // class ScrollbarsRenderable extends Renderable {
    //   // @fx trigger_needDraw() {
    //   //   let needDraw = false
    //   //   for (const { renderable: r } of it.items) {
    //   //     if (r.needRender) {
    //   //       needDraw = true
    //   //       break
    //   //     }
    //   //   }
    //   //   $()
    //   //   this.needDraw = needDraw
    //   // }
    //   // @fn draw(t: number, c: CanvasRenderingContext2D) {
    //   //   for (const { renderable: r } of it.items) {
    //   //     if (!r.isVisible) continue

    //   //     r.needInit && r.initCanvas(r.canvas.c)
    //   //     r.needRender && r.render()
    //   //     r.draw(t, c)
    //   //   }
    //   //   this.needDraw = false
    //   // }
    // }
    return $(new Renderable(this.ctx, this.ctx.renderable.rect, this.ctx.world.canvas))
  }

  get pointable() {
    $()
    // const it = this
    // class ScrollbarsPointable extends Pointable {
    //   getItAtPoint(p: Point) {
    //     for (const item of it.items) {
    //       if (item.renderable.isVisible && item.pointable.getItAtPoint(p)) {
    //         return item
    //       }
    //     }
    //   }
    // }
    return $(new Pointable(this))
  }
}
