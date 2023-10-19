import { Point } from 'std'

export interface Pointable {
  isHovering?: boolean
  isPointWithin(p: Point): Pointable | false | undefined
  onDown?(): void
  onHoldMove?(): void
}
