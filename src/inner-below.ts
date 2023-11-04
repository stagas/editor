// log.active
import { $, of } from 'signal'
import { Mouse, Mouseable, Renderable } from 'std'
import { Comp } from './comp.ts'
import { filterAs } from 'utils'

export class InnerBelow extends Comp
  implements Renderable.It {
  get renderable() {
    $()
    const it = this
    const { canvas, scroll } = of(it.ctx)
    class InnerBelowRenderable extends Renderable {
      scroll = scroll.pos
      get its() {
        const { ctx } = it
        return [
          ctx.activeLine,
          ctx.elevations,
          ctx.selection,
          ...ctx.deco,
          ...ctx.sub,
        ]
      }
    }
    return $(new InnerBelowRenderable(
      it as Renderable.It,
      canvas.rect,
      canvas,
    ))
  }
  get mouseable() {
    $()
    const it = this
    class InnerBelowMouseable extends Mouseable {
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
