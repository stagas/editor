import { $, alias, fn, fx, init } from 'signal'
import { Point, Matrix } from 'std'

export class Misc {
  innerMatrix = $(new Matrix)
  lineComment: string = ';'
  isTyping = false
  isPanning = false
  isScrolling = false
  wasScrolling = false
}
