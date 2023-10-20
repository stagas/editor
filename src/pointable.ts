import { $ } from 'signal'
import { Point } from 'std'
import { Renderable } from './renderable.ts'

export class Pointable {
  constructor(public it: Renderable.It) {}
  cursor= 'default'
  isDown = false
  isFocused = false
  isHovering = false
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
}

export namespace Pointable {
  export interface It {
    pointable: $<Pointable>
  }
}
