import { $, fx } from 'signal'
import { Matrix, Point } from 'std'
import { Renderable } from './renderable.ts'

export class Pointable {
  constructor(
    public it: Renderable.It,
    public mouseButtons = it.renderable.ctx.world.pointer.$.buttons,
    public downCount = it.renderable.ctx.input.mouse.$.downCount,
    public downTime = it.renderable.ctx.input.mouse.$.downTime,
    public mousePos = it.renderable.ctx.input.mouse.pos,
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
  onWheel?(): void
  onDown?(clicks: number): void
  onClick?(): void
  onUp?(): void
  onEnter?(): void
  onLeave?(): void
  onMove?(): void
  @fx apply_downPos() {
    const { isDown } = $.when(this)
    $()
    const { mousePos, downPos } = $.of(this)
    downPos.set(mousePos)
  }
  @fx apply_mousePos() {
    const {
      it: {
        renderable: {
          ctx: { input: { mouse } },
          position
        }
      }
    } = $.of(this)
    $()
    this.mousePos = position === Renderable.Position.Layout
      ? mouse.pos
      : mouse.innerPos
  }
}

export namespace Pointable {
  export interface It {
    pointable: $<Pointable>
  }
}
