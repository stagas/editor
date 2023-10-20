log.active
import { $, fn, fx, init } from 'signal'
import { Range } from './range.ts'
import { Renderable } from './renderable.ts'
import { Comp } from './comp.ts'
import { Pointable } from './pointable.ts'

export class Widgetable {
  constructor(public it: Renderable.It) { }
  kind: Widget.Kind = Widget.Kind.Deco
  _dim = $(new Range)
  get dim() {
    return this._dim.sorted
  }
  get line() {
    return this.dim.top.line
  }
  dimWidthExclusive = false
  height = 25
  offsetX = 0
  @fx update_rect() {
    const { it } = $.of(this)
    const { renderable } = $.of(it)
    const { ctx, rect: r } = $.of(renderable)
    const { kind, dim, dimWidthExclusive, height, offsetX } = $.of(this)
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
    renderable.needDraw = true
  }
}

export class Widget extends Comp {
  // get widgetable() {
  //   $()
  //   const it = this
  //   return $(new Widgetable(this))
  // }
  get renderable() {
    $()
    const it = this
    class WidgetRenderable extends Renderable {
      position = Renderable.Position.Scroll
      // @fn draw(t: number, c: CanvasRenderingContext2D) {
      //   const { rect } = $.of(this)
      //   rect.fill(c, '#666')
      //   this.needDraw = false
      // }
    }
    return $(new WidgetRenderable(this.ctx))
  }
}

export namespace Widget {
  export enum Kind {
    Deco,
    Mark,
    Sub,
  }

  // export interface It extends Widget {
  //   renderable: $<Widget.Renderable>
  //   pointable?: $<Widget.Pointable>
  // }

  // export class Renderable extends RenderableBase {
  //   constructor(public it: Widget) {
  //     super(it.ctx)
  //   }
  //   position = RenderableBase.Position.Scroll
  //   @fx update_rect() {
  //     const { it, ctx, rect: r } = $.of(this)
  //     const { kind, dim, dimWidthExclusive, height, offsetX } = $.of(it)
  //     const { buffer, dims } = $.of(ctx)
  //     const { lines } = $.of(buffer)
  //     const { lineTops, lineBaseTops, lineBaseBottoms,
  //       decoHeights, extraDecoHeights,
  //       charWidth, lineHeight } = $.of(dims)
  //     const { sorted: { top, bottom } } = $.of(dim)
  //     const { line, col } = $.of(top)
  //     const { col: right } = $.of(bottom)
  //     $()

  //     // TODO: this can't be solved with a flush because dims can be late/async
  //     if (line >= lineTops.length) return

  //     r.x = col * charWidth + offsetX
  //     r.w = (right - col) * charWidth

  //     switch (kind) {
  //       case Widget.Kind.Deco:
  //         const eh = extraDecoHeights?.[line] ?? 0
  //         r.h = decoHeights[line] - 2 + eh
  //         let dex = dimWidthExclusive ? charWidth : 0
  //         r.x -= .5
  //         r.w += 2.5
  //         r.x += dex
  //         r.w -= dex * 2
  //         r.y = lineBaseTops[line] - decoHeights[line] + 4 - eh
  //         break
  //       case Widget.Kind.Mark:
  //         r.h = Math.round(lineHeight)
  //         r.y = Math.round(lineBaseTops[line] + 2)
  //         r.x -= 1.5
  //         r.w += 3.5
  //         break
  //       case Widget.Kind.Sub:
  //         r.h = height - 2
  //         r.y = lineBaseBottoms[line] + 2
  //         r.x += 1.5
  //         r.w -= 1
  //         break
  //     }
  //     this.needDraw = true
  //   }
  // }

  // export class Pointable extends PointableBase {

  // }
}
