// log.active
import { $, fn, fx, init, of } from 'signal'
import { Comp } from './comp.ts'
import { Range } from './range.ts'
import { Mouseable, Need, Renderable } from 'std'

export class Widgetable {
  kind: Widgetable.Kind = Widgetable.Kind.Deco
  dimWidthExclusive = false
  height = 25
  offsetX = 0

  constructor(public it: Widgetable.It) { }

  _dim = $(new Range)
  get dim() { return this._dim.sorted }
  get line() { return this.dim.top.line }

  @fx update_rect() {
    const { it } = of(this)
    const { ctx, renderable } = of(it)
    const { rect: r } = of(renderable)
    const { kind, dim, dimWidthExclusive, height, offsetX } = of(this)
    const { buffer, dims } = of(ctx)
    const { lines } = of(buffer)
    const { lineTops, lineBaseTops, lineBaseBottoms,
      decoHeights, extraDecoHeights,
      charWidth, lineHeight } = of(dims)
    const { sorted: { top, bottom } } = of(dim)
    const { line, col } = of(top)
    const { col: right } = of(bottom)
    $()

    // TODO: this can't be solved with a flush because dims can be late/async
    if (line >= lineTops.length) return

    r.x = col * charWidth + offsetX
    r.w = (right - col) * charWidth

    switch (kind) {
      case Widgetable.Kind.Deco:
        const eh = extraDecoHeights?.[line] ?? 0
        r.h = decoHeights[line] - 2 + eh
        let dex = dimWidthExclusive ? charWidth : 0
        r.x -= .5
        r.w += 2.5
        r.x += dex
        r.w -= dex * 2
        r.y = lineBaseTops[line] - decoHeights[line] + 4 - eh
        break
      case Widgetable.Kind.Mark:
        r.h = Math.round(lineHeight)
        r.y = Math.round(lineBaseTops[line] + 2)
        r.x -= .5
        r.w += 4
        break
      case Widgetable.Kind.Sub:
        r.h = height - 2
        r.y = lineBaseBottoms[line] + 2
        r.x += 1.5
        r.w -= 1
        break
    }

    renderable.need |= Need.Draw
  }
}

export class Widget extends Comp
  implements Widgetable.It, Renderable.It {
  get widgetable() {
    $()
    const it = this
    return $(new Widgetable(it as Widgetable.It))
  }
  get renderable() {
    $()
    const it = this
    class WidgetRenderable extends Renderable {
      @fn draw(c: CanvasRenderingContext2D, t: number) {
        const { rect } = of(this)
        rect.fill(c, '#666')
        this.need ^= Need.Draw
      }
    }
    return $(new WidgetRenderable(it as Renderable.It))
  }
}

export namespace Widgetable {
  export enum Kind {
    Deco,
    Mark,
    Sub,
  }

  export type It = Comp
    & { widgetable: Widgetable }
    & Renderable.It
    & Partial<Mouseable.It>
}
