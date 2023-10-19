import { Point } from 'std'
import { Mouseable } from './mouseable.ts'

export interface Pointable {
  isHovering?: boolean
  isPointWithin(p: Point): Mouseable | undefined
}
