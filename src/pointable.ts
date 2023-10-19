import { Point } from 'std'
import { Render } from './render.ts'

export class Pointable {
  constructor(public it: Render) {}
  cursor= 'default'
  getItemAtPoint(p: Point): Pointable | false | undefined { return {} as any }
  onWheel?(): void
  onDown?(clicks: number): void
  onClick?(): void
  onUp?(): void
  onEnter?(): void
  onLeave?(): void
  onMove?(): void
}
