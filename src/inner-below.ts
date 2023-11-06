// log.active
import { $, of } from 'signal'
import { Mouseable, Renderable } from 'std'
import { filterAs } from 'utils'
import { Comp } from './comp.ts'

export class InnerBelow extends Comp
  implements Renderable.It {
  get renderable() {
    $()
    const it = this
    class InnerBelowRenderable extends Renderable {
      get its() {
        const { ctx } = it
        const its = [
          ctx.activeLine,
          ctx.elevations,
          ctx.selection,
          ...ctx.deco,
          ...ctx.sub,
        ]
        const scroll = it.ctx.scroll.pos
        $()
        this.scroll = scroll
        return its
      }
    }
    return $(new InnerBelowRenderable(it as Renderable.It, false))
  }
  get mouseable() {
    $()
    const it = this
    class InnerBelowMouseable extends Mouseable {
      canHover = false
      get its() {
        const { ctx } = it
        return [
          ...filterAs(ctx.deco)<Mouseable.It>(w => w.mouseable?.it),
          ...filterAs(ctx.mark)<Mouseable.It>(w => w.mouseable?.it),
          ...filterAs(ctx.sub)<Mouseable.It>(w => w.mouseable?.it),
        ]
      }
    }
    return $(new InnerBelowMouseable(it as Mouseable.It))
  }
}
