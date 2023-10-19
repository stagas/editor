import { Point } from 'std'

export interface Pointable {
  isHovering?: boolean
  isPointWithin(p: Point): Pointable | false | undefined
  onPointerDown?(): void
  onHoldMove?(): void

}
