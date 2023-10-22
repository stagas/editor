import { $, fx , of } from 'signal'
import { Point } from 'std'
import { Mouse } from './mouse.ts'
import { Renderable } from './renderable.ts'

export class Pointable {
  constructor(
    public it: Pointable.It,
    public downCount = it.renderable.ctx.input.mouse.$.downCount,
    public downTime = it.renderable.ctx.input.mouse.$.downTime,
    public mouse = $({
      btns: it.renderable.ctx.world.pointer.$.buttons,
      get pos() {
        const r = it.renderable
        return r.position === Renderable.Position.Layout
          ? r.ctx.input.mouse.pos
          : r.ctx.input.mouse.innerPos
      },
      downPos: $(new Point)
    }),
  ) { }

  // settable by It
  hitArea?: { isPointWithin(p: Point): boolean }
  canHover = true
  cursor = 'default'
  getItAtPoint(p: Point): Pointable.It | false | undefined {
    return this.hitArea?.isPointWithin(p) && this.it
  }
  onMouseEvent?(kind: Mouse.EventKind): true | undefined | void { }

  // internal
  isDown = false
  isFocused = false
  isHovering = false
  downPos = $(new Point)
  @fx apply_downPos() {
    const { isDown } = when(this)
    $()
    const { mouse: { pos, downPos } } = of(this)
    downPos.set(pos)
  }
}

export namespace Pointable {
  export interface It extends Renderable.It {
    pointables?: Pointable.It[]
    pointable: Pointable
  }
}
