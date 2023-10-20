import { $ } from 'signal'
import { Line } from 'std'
import { Linecol } from './linecol'

export class Range extends Line {
  p1 = $(new Linecol)
  p2 = $(new Linecol)
}
