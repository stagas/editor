log.active
import { $, fx, nu } from 'signal'
import { Line, Point, PointLike, Rect } from 'std'
import { clamp, poolArrayGet } from 'utils'
import { Editor } from './editor.ts'
import { Source } from './source.ts'
import { findMatchingBrackets } from './util.ts'

const tempPoint = $(new Point)

export class Buffer {
  constructor(public ctx: Editor, public Token: { Type: Record<string, string> }) { }

  source?: $<Source>
  @nu get code() { return $.of(this).source.code! }
  set code(v: string) { $.of(this).source.code = v }
  @nu get tokens() { return $.of(this).source.tokens }
  @nu get lines() { return $.of(this).source.lines }

  lineCol = $(new Point)
  lineColClamped = $(new Point)

  line = this.lineCol.$.line
  col = this.lineCol.$.col // actual col
  coli = 0 // col intent

  bracketsPair = {
    open: $(new Point),
    close: $(new Point)
  }
  hasBrackets = false

  fillRects: Rect[] = []

  @fx clamp_lineCol() {
    const { lines, line, coli } = $.of(this)
    $.untrack()
    this.col = Math.min(coli, lines[line]?.length ?? 0)
    this.line = Math.min(line, lines.length)
  }

  @fx trim_lines() {
    const { lines, line } = $.of(this)
    for (let i = 0; i < lines.length; i++) {
      if (i === line) continue
      lines[i] = lines[i].trimEnd()
    }
    // $.code = lines.join('\n')
  }

  getIndexFromCoords(
    { x, y }: PointLike): number {
    const { code } = this
    const lines = code
      .split('\n')
      .slice(0, y)
    return x
      + lines.join('\n').length
      // add the missing \n to the length when line >0
      + (lines.length ? 1 : 0)
  }
  getLineColFromIndex(
    index: number, tp: Point = tempPoint): Point {
    const { code } = this
    const slice = code.slice(0, index)
    const lines = slice.split('\n')
    const line = lines.length - 1
    const col = lines.at(-1)?.length ?? 0
    tp.line = line
    tp.col = col
    return tp
  }
  getLineColFromPoint(
    p: Point, clampPos = true, tp?: Point): Point {
    const { lines, ctx } = $.of(this)
    const { dims } = $.of(ctx)
    const { lineTops, scroll, rect, charWidth } = $.of(dims)

    const py = p.y - scroll.y - rect.y
    const px = p.x - scroll.x - rect.x

    let y = 0
    for (; y < lineTops.length; y++) {
      if (py <= lineTops[y]!) break
    }
    --y

    let x = Math.max(0, Math.round((px - 1) / charWidth))

    if (clampPos) {
      y = clamp(0, lines.length - 1, y)
      x = Math.min(lines[y]?.length ?? 0, x)
    }

    if (tp) {
      tp.x = x
      tp.y = y
      return tp
    }
    tempPoint.x = x
    tempPoint.y = y
    return tempPoint
  }
  getPointFromLineCol(
    { line, col }: Point,
    tp: PointLike): PointLike {
    const { dims } = $.of(this.ctx)
    const { lineBaseTops, charWidth } = $.of(dims)
    tp.x = charWidth * col
    tp.y = lineBaseTops[line]
    return tp
  }
  getPointFromIndex(index: number, tp: PointLike) {
    return this.getPointFromLineCol(
      this.getLineColFromIndex(index),
      tp
    )
  }
  @fx update_brackets() {
    const { code, lineCol, line, col, bracketsPair: { open, close } } = $.of(this)
    $.untrack()
    const index = this.getIndexFromCoords(lineCol)
    const brackets = findMatchingBrackets(code, index)

    if (brackets) {
      this.hasBrackets = true
      this.getLineColFromIndex(brackets[0], open)
      this.getLineColFromIndex(brackets[1], close)
    }
    else {
      this.hasBrackets = false
    }
  }
  fillTextRange(
    c: CanvasRenderingContext2D,
    range: Line,
    color: string,
    full: boolean = false,
    padBottom: number = 0,
    strokeLight?: string,
    strokeDark?: string,
  ) {
    const { fillRects, ctx } = $.of(this)
    const { dims } = $.of(ctx)
    const {
      lineHeight,
      charWidth,
      lines,
      lineTops,
      lineBaseTops,
      lineHeights,
      viewSpan,
    } = $.of(dims)

    const { top, bottom } = range
    let i = 0
    let r: Rect

    const manyLines = top.line !== bottom.line

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

      if (y + h < viewSpan.top || y > viewSpan.bottom) continue

      r = poolArrayGet(fillRects, i++, Rect.create)

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

    if (!i) return

    c.beginPath()
    Rect.pathAround(c, fillRects, i)
    c.fillStyle = color
    c.fill()

    c.save()
    c.lineCap = 'square'
    c.translate(.5, .5)
    if (strokeDark) {
      c.beginPath()
      Rect.pathAroundRight(c, fillRects, i)
      c.strokeStyle = strokeDark
      c.stroke()
    }

    if (strokeLight) {
      c.beginPath()
      Rect.pathAroundLeft(c, fillRects, i)
      c.strokeStyle = strokeLight
      c.stroke()
    }
    c.restore()
  }
}
