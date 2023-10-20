import { $ } from 'signal'
import { Rect } from 'std'
import { Comp } from './comp.ts'

export class Widget extends Comp {
  kind: Widget.Kind = Widget.Kind.Deco
  dim = $(new Rect)
  rect = $(new Rect)
  height?: number
}

export namespace Widget {
  export enum Kind {
    Deco,
    Marker,
    Sub,
  }
}
