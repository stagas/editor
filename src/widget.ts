import { $, fx } from 'signal'
import { Range } from './range.ts'
import { Pointable as PointableBase } from './pointable.ts'
import { Renderable as RenderableBase } from './renderable.ts'

export namespace Widget {
  export enum Kind {
    Deco,
    Mark,
    Sub,
  }

  export interface It {
    renderable: Widget.Renderable
    pointable?: Widget.Pointable
  }

  export class Renderable extends RenderableBase {
    kind: Widget.Kind = Widget.Kind.Deco
    dim = $(new Range)
    dimWidthExclusive = false
    height = 25
    offsetX = 0
    position = RenderableBase.Position.Scroll
    @fx update_rect() {
      const { ctx, rect: r, kind, dim, dimWidthExclusive, height, offsetX } = $.of(this)
      const { buffer, dims } = $.of(ctx)
      const { lines } = $.of(buffer)
      const { lineTops, lineBaseTops, lineBaseBottoms,
        decoHeights, extraDecoHeights,
        charWidth, lineHeight } = $.of(dims)
      const { sorted: { top, bottom } } = $.of(dim)
      const { line, col } = $.of(top)
      const { col: right } = $.of(bottom)
      $()

      // TODO: this can't be solved with a flush because dims can be late/async
      if (line >= lineTops.length) return

      r.x = col * charWidth + offsetX
      r.w = (right - col) * charWidth

      switch (kind) {
        case Widget.Kind.Deco:
          const eh = extraDecoHeights?.[line] ?? 0
          r.h = decoHeights[line] - 2 + eh
          let dex = dimWidthExclusive ? charWidth : 0
          r.x -= .5
          r.w += 2.5
          r.x += dex
          r.w -= dex * 2
          r.y = lineBaseTops[line] - decoHeights[line] + 4 - eh
          break
        case Widget.Kind.Mark:
          r.h = Math.round(lineHeight)
          r.y = Math.round(lineBaseTops[line] + 2)
          r.x -= 1.5
          r.w += 3.5
          break
        case Widget.Kind.Sub:
          r.h = height - 2
          r.y = lineBaseBottoms[line] + 2
          r.x += 1.5
          r.w -= 1
          break
      }

      this.needDraw = true
    }
  }

  export class Pointable extends PointableBase {

  }
}
