import { Point } from 'std'

export class Pointable {
  isHovering?: boolean
  isDown?: boolean
  isPointWithin(p: Point): Pointable | false | undefined { return {} as any }
  onWheel?(): void
  onDown?(): void
  onUp?(): void
  onLeave?(): void
  onMove?(): void
}
