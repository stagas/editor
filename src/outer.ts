// log.active
import { $, of } from 'signal'
import { Mouseable, Renderable } from 'std'
import { Comp } from './comp.ts'

export class Outer extends Comp
  implements Renderable.It, Mouseable.It {
  get renderable() {
    $()
    const it = this
    class OuterRenderable extends Renderable {
      get its(): Renderable.It[] {
        const { ctx } = it
        return [
          // ctx.back,
          ctx.innerBelow,
          ctx.text,
          ctx.innerAbove,
          ctx.scrollbars,
        ]
      }
    }
    return $(new OuterRenderable(it as Renderable.It, false))
  }
  get mouseable() {
    $()
    const it = this
    class OuterMouseable extends Mouseable {
      canHover = false
      get its() {
        const { ctx } = it
        return [
          ctx.scrollbars,
          ctx.innerBelow,
          ctx.text,
        ]
      }
    }
    return $(new OuterMouseable(it as Mouseable.It))
  }
}
