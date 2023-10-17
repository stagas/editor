import { $ } from 'signal'
import { Matrix } from 'std'

export class Misc {
  innerMatrix = $(new Matrix)
  lineComment: string = ';'
  isTyping = false
  isPanning = false
  isScrolling = false
  wasScrolling = false
}
