// log.active
import { $, fn, fx, of } from 'signal'
import { Animable, Mouseable, Point, Renderable } from 'std'
import { Comp } from './comp.ts'
import { Range } from './range.ts'

export class Widgetable {
  kind: Widgetable.Kind = Widgetable.Kind.Deco
  height = 20
  offsetX = 0
  maxWidth = Infinity
  dimWidthExclusive = false

  constructor(public it: Widgetable.It) { }

  _dim = $(new Range)
  get dim() { return this._dim.sorted }
  get line() { return this.dim.top.line }

  @fx update_view() {
    const { it } = of(this)
    const { ctx, renderable } = of(it)
    const { view: v, rect: r } = of(renderable)
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

    let vx = col * charWidth + offsetX
    let vy = v.y
    let vw = (right - col) * charWidth
    let vh = v.h

    switch (kind) {
      case Widgetable.Kind.Deco:
        const eh = extraDecoHeights?.[line] ?? 0
        vh = decoHeights[line] - 3.5 + eh
        let dex = dimWidthExclusive ? charWidth : 0
        vx -= .5
        vw += 2.5
        vx += dex
        vw -= dex * 2
        vy = lineBaseTops[line] - decoHeights[line] - eh
        // v.y = lineBaseTops[line] - decoHeights[line] + 4 - eh
        break
      case Widgetable.Kind.Mark:
        vh = Math.round(lineHeight)
        vy = Math.round(lineBaseTops[line] + 2)
        vx -= .5
        vw += 4
        break
      case Widgetable.Kind.Sub:
        vh = height - 2
        vy = Math.floor(lineBaseBottoms[line] - 2) - 1
        // v.x += 1
        vx = Math.round(vx) - 1
        vw = Math.round(vw) + 2.5
        break
    }

    v.x = Math.floor(vx)
    v.y = Math.floor(vy)
    r.w = v.w = Math.min(this.maxWidth, Math.ceil(vw))
    r.h = v.h = Math.ceil(vh)
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
      @fn draw(c: CanvasRenderingContext2D, point: Point) {
        const { rect } = of(this)
        c.save()
        point.translate(c)
        rect.fill(c, '#666')
        c.restore()
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
    & Partial<Animable.It>
    & Partial<Mouseable.It>
}
