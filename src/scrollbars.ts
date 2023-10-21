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
    return $(new Renderable(this.ctx, this.ctx.renderable.rect, this.ctx.world.canvas))
  }

  get pointable() {
    $()
    return $(new Pointable(this))
  }
}
