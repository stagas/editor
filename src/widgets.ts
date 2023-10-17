import { Rect } from 'std'

export enum WidgetKind {
  Deco = 'deco',
  Marker = 'marker',
  Sub = 'sub'
}

export interface WidgetLike {
  kind: WidgetKind
  dim: Rect
  rect: Rect
  height: number
}
