import { Point } from 'std'
import { Renderable } from './render.ts'

export class Pointable {
  constructor(public it: Renderable.It) {}
  cursor= 'default'
  hitArea?: { isPointWithin(p: Point): boolean }
  getItemAtPoint(p: Point): Pointable | false | undefined {
    return this.hitArea?.isPointWithin(p) && this
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
    pointable: Pointable
  }
}
