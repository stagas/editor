// log.active
import { $, of } from 'signal'
import { Renderable } from 'std'
import { Comp } from './comp.ts'

export class InnerAbove extends Comp
  implements Renderable.It {
  get renderable() {
    $()
    const it = this
    const { canvas, scroll } = of(it.ctx)
    class InnerAboveRenderable extends Renderable {
      scroll = scroll.pos
      get its() {
        const { ctx } = it
        return [
          // ctx.brackets,
          ctx.dropCaret,
          ctx.caret,
        ]
      }
    }
    return $(new InnerAboveRenderable(it as Renderable.It, false))
  }
}
