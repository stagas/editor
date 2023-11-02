// log.active
import { $, of } from 'signal'
import { Mouseable, Renderable } from 'std'
import { Comp } from './comp.ts'

export class Inner extends Comp
  implements Renderable.It, Mouseable.It {
  get renderable() {
    $()
    const it = this
    const { canvas, scroll } = of(it.ctx)
    class InnerRenderable extends Renderable {
      scroll = scroll.pos
      get its() {
        const { ctx } = it
        return [
          ctx.elevations,
          ctx.brackets,
          ctx.dropCaret,
          ctx.caret,
        ]
      }
    }
    return $(new InnerRenderable(
      it as Renderable.It,
      canvas.rect,
      canvas,
    ))
  }
  get mouseable() {
    $()
    const it = this
    class InnerMouseable extends Mouseable {
      get its() {
        const { ctx } = it
        return [
          // ctx.text
        ]
      }
    }
    return $(new InnerMouseable(it as Mouseable.It))
  }
}
