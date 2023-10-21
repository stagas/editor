import { $, fx } from 'signal'
import { Matrix, Point } from 'std'
import { Renderable } from './renderable.ts'
import { Mouse } from './mouse.ts'

export class Pointable {
  constructor(
    public it: Renderable.It,
    public downCount = it.renderable.ctx.input.mouse.$.downCount,
    public downTime = it.renderable.ctx.input.mouse.$.downTime,
    public mouse = $({
      btns: it.renderable.ctx.world.pointer.$.buttons,
      pos: it.renderable.position === Renderable.Position.Layout
        ? it.renderable.ctx.input.mouse.pos
        : it.renderable.ctx.input.mouse.innerPos,
      downPos: $(new Point)
    }),
  ) { }
  cursor = 'default'
  isDown = false
  isFocused = false
  isHovering = false
  downPos = $(new Point)
  hitArea?: { isPointWithin(p: Point): boolean }
  getItAtPoint(p: Point): Pointable.It | false | undefined {
    return this.hitArea?.isPointWithin(p) && this.it as unknown as Pointable.It
  }
  onMouseEvent?(kind: Mouse.EventKind): true | undefined | void { }
  // onDown?(clicks: number): void
  // onClick?(): void
  // onUp?(): void
  // onEnter?(): void
  // onLeave?(): void
  // onMove?(): void
  @fx apply_downPos() {
    const { isDown } = $.when(this)
    $()
    const { mouse: { pos, downPos } } = $.of(this)
    downPos.set(pos)
  }
}

export namespace Pointable {
  export interface It {
    pointable: $<Pointable>
  }
}
