// log.active
import { $, of } from 'signal'
import { Mouseable, Renderable } from 'std'
import { Comp } from './comp.ts'

export class Outer extends Comp
  implements Renderable.It, Mouseable.It {
  get renderable() {
    $()
    const it = this
    const { canvas } = of(it.ctx)
    class OuterRenderable extends Renderable {
      get its(): Renderable.It[] {
        const { ctx } = it
        return [
          ctx.innerBelow,
          ctx.text,
          ctx.innerAbove,
        ]
      }
    }
    return $(new OuterRenderable(
      it as Renderable.It,
      canvas.rect,
      canvas,
    ))
  }
  get mouseable() {
    $()
    const it = this
    class OuterMouseable extends Mouseable {
      get its() {
        const { ctx } = it
        return [
          ctx.text
        ]
      }
    }
    return $(new OuterMouseable(it as Mouseable.It))
  }
}
