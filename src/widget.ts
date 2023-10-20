import { $ } from 'signal'
import { Rect } from 'std'

export class Widget {
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
