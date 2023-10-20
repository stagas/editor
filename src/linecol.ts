import { alias } from 'signal'
import { Point } from 'std'

export class Linecol extends Point {
  col = alias(this, 'x')
  line = alias(this, 'y')
  get lineCol() {
    return this
  }
}
