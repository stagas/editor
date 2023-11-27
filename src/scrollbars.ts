// log.active
import { $, of } from 'signal'
import { Mouseable, Renderable } from 'std'
import { Comp } from './comp.ts'
import { Axis, Scrollbar } from './scrollbar.ts'

export class Scrollbars extends Comp
  implements Renderable.It {
  scrollbarY = $(new Scrollbar(this.ctx), { axis: Axis.Y })
  scrollbarX = $(new Scrollbar(this.ctx), { axis: Axis.X })

  get renderable() {
    $()
    const it = this
    class ScrollbarsRenderable extends Renderable {
      get its() {
        return [
          it.scrollbarY,
          it.scrollbarX,
        ]
      }
    }
    return $(new ScrollbarsRenderable(it as Renderable.It, false), {
      copyView: it.ctx.world.render.view
    })
  }
  get mouseable() {
    $()
    const it = this
    class ScrollbarsMouseable extends Mouseable {
      canHover = false
      get its() {
        return [
          it.scrollbarY,
          it.scrollbarX,
        ]
      }
    }
    return $(new ScrollbarsMouseable(it as Mouseable.It))
  }
}
