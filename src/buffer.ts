import { $, fn, fx, init } from 'signal'
import { Point, PointLike } from 'std'
import { Source } from './source.ts'
import { Context } from './context.ts'
import { clamp } from 'utils'

const tempPoint = $(new Point)

export class Buffer {
  constructor(public ctx: Context, public Token: any) { }

  source?: $<Source>

  get code() { return $.of(this).source.code ?? '' }
  set code(v: string) { $.of(this).source.code = v }

  get tokens() { return $.of(this).source.tokens }
  get lines() { return $.of(this).source.lines }

  // tokens = $.from(this).source!.$.tokens
  // lines = $.from(this).source!.$.lines
  // get tokens() {
  //   return $.of($.of(this).source).tokens
  // }

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

  @fx clampLineCol() {
    const { lines, line, coli } = $.of(this)
    $.untrack()
    this.col = Math.min(coli, lines[line]?.length ?? 0)
    this.line = Math.min(line, lines.length)
  }

  @fx trimLines() {
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
    const { lineCol, line, col, code, bracketsPair: { open, close } } = this
    const index = this.getIndexFromCoords(lineCol)
    const brackets = findMatchingBrackets(code, index)

    if (brackets) {
      $.hasBrackets = true
      $.getLineColFromIndex(brackets[0], open)
      $.getLineColFromIndex(brackets[1], close)
    }
    else {
      $.hasBrackets = false
    }
  }
}
