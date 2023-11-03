// log.active
import { $, of } from 'signal'
import { Renderable } from 'std'
import { Comp } from './comp.ts'

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
          ctx.elevations,
          ctx.selection,
        ]
      }
    }
    return $(new InnerBelowRenderable(
      it as Renderable.It,
      canvas.rect,
      canvas,
    ))
  }
}
