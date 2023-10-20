import { Point } from 'std'
import { Render } from './render.ts'

export interface ItPointable {
  pointable: Pointable
}

export class Pointable {
  constructor(public it: Render) {}
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
