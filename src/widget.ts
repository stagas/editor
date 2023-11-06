// log.active
import { $, fn, fx, of } from 'signal'
import { Mouseable, Point, Renderable, Scene } from 'std'
import { Comp } from './comp.ts'
import { Range } from './range.ts'

export class Widgetable {
  kind: Widgetable.Kind = Widgetable.Kind.Deco
  height = 25
  offsetX = 0
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

    v.x = col * charWidth + offsetX
    v.w = (right - col) * charWidth

    switch (kind) {
      case Widgetable.Kind.Deco:
        const eh = extraDecoHeights?.[line] ?? 0
        v.h = decoHeights[line] - 2 + eh
        let dex = dimWidthExclusive ? charWidth : 0
        v.x -= .5
        v.w += 2.5
        v.x += dex
        v.w -= dex * 2
        v.y = lineBaseTops[line] - decoHeights[line] + 4 - eh
        break
      case Widgetable.Kind.Mark:
        v.h = Math.round(lineHeight)
        v.y = Math.round(lineBaseTops[line] + 2)
        v.x -= .5
        v.w += 4
        break
      case Widgetable.Kind.Sub:
        v.h = height - 2
        v.y = lineBaseBottoms[line] + 2
        v.x += 1.5
        v.w -= 1
        break
    }

    r.w = v.w
    r.h = v.h
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
      @fn init() {
        this.need &= ~Renderable.Need.Init
        this.need |= Renderable.Need.Render
      }
      @fn render(c: CanvasRenderingContext2D, t: number) {
        const { rect } = of(this)
        c.save()
        rect.pos.translateNegative(c)
        rect.fill(c, '#666')
        c.restore()
        this.need &= ~Renderable.Need.Render
        this.need |= Renderable.Need.Draw
      }
      @fn draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
        const { pr, canvas, rect } = of(this)
        rect.round().drawImageTranslated(
          canvas.el, c, pr, true, scroll)
        this.need &= ~Renderable.Need.Draw
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
