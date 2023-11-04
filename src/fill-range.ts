// log.active
import { $, fn, fx, of } from 'signal'
import { FixedArray, Point, Rect, Renderable } from 'std'
import { poolArrayGet } from 'utils'
import { Comp } from './comp.ts'
import { Editor } from './editor.ts'
import { Range } from './range.ts'

export class FillRange extends Range
  implements Comp, Renderable.It {
  drawDirect = false
  full = false
  padBottom = 0
  colors?: {
    color: string,
    light?: string,
    dark?: string,
  }

  constructor(public ctx: Editor) { super() }

  fillRects = $(new FixedArray<$<Rect>>())

  get rects() {
    const { drawDirect, full, sorted: { top, bottom }, fillRects, padBottom, ctx } = of(this)
    const { dims } = of(ctx)
    const {
      lineHeight,
      charWidth,
      lines,
      lineTops,
      lineBaseTops,
      lineHeights,
      visibleSpan,
    } = of(dims)

    if (drawDirect) {
      const { top: vt, bottom: vb } = visibleSpan
    }
    const { line: tl, col: tc } = top
    const { line: bl, col: bc } = bottom

    $()

    if (top.equals(bottom)) {
      fillRects.count = 0
      fillRects.updated++

      return fillRects
    }

    let i = 0
    let r: Rect

    const manyLines = top.line !== bottom.line

    // iterate each line and produce its fill rect
    for (let line = top.line; line <= bottom.line; line++) {
      const x = line === top.y
        ? top.x * charWidth
        : 0

      const y = full
        ? lineTops[line] + 3
        : lineBaseTops[line] + 2

      const w = (line === top.line ?
        line === bottom.line
          ? (bottom.col - top.col) * charWidth
          : ((lines[line]?.length ?? 0) - top.col) * charWidth + 2
        : line === bottom.line
          ? bottom.col * charWidth
          : ((lines[line]?.length ?? 0) * charWidth + 2))

      const h = full
        ? lineHeights[line] - (line === bottom.line ? padBottom : 0)
        : lineHeight + 0.5

      if (y + h < visibleSpan.top || y > visibleSpan.bottom) continue

      r = poolArrayGet(fillRects.array, i++, Rect.create)

      r.x = x
      r.y = y
      r.w = w  // + avoids flicker rounding
      r.h = h
      // r.floorCeil()

      // TODO: aesthetics
      if (top.line !== bottom.line) {
        if (line === bottom.y) {
          // r.w += 2
          // r.h += 1
        }
        else if (line === top.y) {
          // r.h += 1
          // r.w += 2
          // r.x -= 2
        }
      }
    }

    fillRects.count = i
    fillRects.updated++

    return fillRects
  }
  get renderable() {
    $()
    const it = this
    return $(new FillRangeRenderable(it))
  }
}

class FillRangeRenderable extends Renderable {
  constructor(public it: FillRange) {
    super(it)
    this.canDirectDraw = it.drawDirect
  }
  // canDirectDraw = true
  view = $(new Rect)
  @fx update_rect_dims() {
    const { rect, view } = this
    const { charWidth } = of(this.it.ctx.dims)
    const { rects, colors } = of(this.it)
    const { updated, count } = rects
    $()
    view.combineRects(rects.array, rects.count).round()
    rect.w = Math.max(rect.w, view.w)
    rect.h = Math.max(rect.h, view.h)
    this.need |= Renderable.Need.Render
    log('rects', view.text, rect.text)
  }
  @fn init() {
    this.need &= ~Renderable.Need.Init
    this.need |= Renderable.Need.Render
  }
  @fn render(c: CanvasRenderingContext2D, t: number, clear: boolean) {
    const { rect, view } = this
    const {
      colors: { color, light, dark },
      rects
    } = of(this.it)

    c.save()
    view.pos.translateNegative(c)
    if (clear) {
      view.clear(c)
    }

    c.beginPath()
    Rect.pathAround(c, rects.array, rects.count)
    c.fillStyle = color
    c.fill()

    if (dark || light) {
      c.save()
      c.lineCap = 'square'
      c.translate(.5, .5)
      if (dark) {
        c.beginPath()
        Rect.pathAroundRight(c, rects.array, rects.count)
        c.strokeStyle = dark
        c.stroke()
      }

      if (light) {
        c.beginPath()
        Rect.pathAroundLeft(c, rects.array, rects.count)
        c.strokeStyle = light
        c.stroke()
      }
      c.restore()
    }

    c.restore()

    this.need &= ~Renderable.Need.Render
    this.need |= Renderable.Need.Draw
  }
  @fn draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
    const { pr, canvas, rect, view } = of(this)
    view.round().drawImageTranslated(
      canvas.el, c, pr, true, scroll)
    this.need &= ~Renderable.Need.Draw
  }
}
