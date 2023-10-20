// log.active
import { $, fx, nu } from 'signal'
import { Point, Rect } from 'std'
import { arraysEqual } from 'utils'
import { Comp } from './comp.ts'

export class Dims extends Comp {
  rect = this.ctx.rect

  // this is a temporary rect for dims
  // TODO: we shouldn't need this, handled in the deco/widget instead
  dimRect = $(new Rect, { w: 1, h: 1 })

  fontSize = 12
  fontsReady = true //?: boolean

  blinkDelay = 270 // TODO: sync to beat
  scrollbarSize = $(new Point, { x: 13, y: 7 })

  // TODO: single point? char.width char.height ?
  charWidth?: number

  get lineHeight() {
    return Math.round(this.fontSize * 1.5)
  }
  get lines() {
    return this.ctx.buffer?.source?.lines
  }
  @nu get longestLine() {
    const { lines } = $.of(this)
    let longest = 0
    for (let i = 0, len = 0; i < lines.length; i++) {
      len = lines[i].length
      if (len > longest) longest = len
    }
    return longest
  }
  get scroll() {
    return this.ctx.scroll.pos
  }
  @nu get overscrollX() {
    return $.of(this).charWidth * 2
  }
  @nu get innerSizeWidth() {
    const { longestLine, charWidth, scrollbarSize } = $.of(this)
    return longestLine * charWidth + scrollbarSize.w
  }
  get innerSize() {
    return $(new Point, { x: $(this).$.innerSizeWidth })
  }
  get viewSpanTop() {
    const { scroll } = $.of(this)
    return -scroll.y
  }
  get viewSpanBottom() {
    const { rect, lineHeight, viewSpanTop } = $.of(this)
    return viewSpanTop + rect.h + lineHeight
  }
  get viewSpan() {
    return $(new Point, { y: $(this).$.viewSpanTop, x: $(this).$.viewSpanBottom })
  }
  get lastVisibleLine() {
    const { lines, ctx } = $.of(this)
    const { deco, sub } = $.of(ctx)
    return Math.max(
      lines.length,
      ...deco.map(wi => wi.dim.line),
      ...sub.map(wi => wi.dim.line),
    ) + 1
  }
  get decoHeights() {
    const { lastVisibleLine, ctx } = $.of(this)
    const { deco } = $.of(ctx)

    const decoHeights = Array.from<number>({ length: lastVisibleLine }).fill(0)
    for (const item of deco) {
      if (item.dim.line >= decoHeights.length) continue

      decoHeights[item.dim.line] = Math.max(
        decoHeights[item.dim.line],
        item.height
      )
    }
    return decoHeights
  }
  get subHeights() {
    const { lastVisibleLine, ctx } = $.of(this)
    const { sub } = $.of(ctx)

    const subHeights = Array.from<number>({ length: lastVisibleLine }).fill(0)
    for (const item of sub) {
      if (item.dim.line >= subHeights.length) continue

      subHeights[item.dim.line] = Math.max(
        subHeights[item.dim.line],
        item.height + 4
      )
    }
    return subHeights
  }
  /** Stores deco extra height when there are empty lines above. */
  get extraDecoHeights() {
    const { lines, lineHeight, lastVisibleLine } = $.of(this)
    let eh = 0
    return Array.from({ length: lastVisibleLine }, (_, i) => {
      let curr = eh
      const line = i < lines.length ? lines[i] : void 0
      if (line !== void 0 && !line.trim().length) eh += lineHeight
      else eh = 0
      return curr
    })
  }

  // TODO: LineDim[]

  /** Top of the line, above decorations. */
  lineTops: number[] = [0]
  /** Base line top, at the character's top position. */
  lineBaseTops: number[] = [0]
  /** Base line bottom, at the character's bottom position.  */
  lineBaseBottoms: number[] = [0]
  /** Bottom of the line, below subs. */
  lineBottoms: number[] = [0]
  /** Line heights, including decorations, extra and subs. */
  lineHeights: number[] = [0]

  @fx update_lineDims() {
    const { innerSize, lines, lineHeight, decoHeights, subHeights, lastVisibleLine } = $.of(this)
    $._()
    const lineTops = Array.from<number>({ length: lastVisibleLine }).fill(0)
    const lineBaseTops = Array.from<number>({ length: lastVisibleLine }).fill(0)
    const lineBaseBottoms = Array.from<number>({ length: lastVisibleLine }).fill(0)
    const lineBottoms = Array.from<number>({ length: lastVisibleLine }).fill(0)
    const lineHeights = Array.from<number>({ length: lastVisibleLine }).fill(0)

    for (let y = 0, top = 0, a, b; y <= lines.length; y++) {
      lineTops[y] = a = top
      top += decoHeights[y]
      lineBaseTops[y] = top
      top += lineHeight
      lineBaseBottoms[y] = top
      top += subHeights[y]
      lineBottoms[y] = b = top
      lineHeights[y] = b - a
    }

    if (!arraysEqual(lineTops, this.lineTops)) {
      this.lineTops = lineTops
    }
    if (!arraysEqual(lineBaseTops, this.lineBaseTops)) {
      this.lineBaseTops = lineBaseTops
    }
    if (!arraysEqual(lineBaseBottoms, this.lineBaseBottoms)) {
      this.lineBaseBottoms = lineBaseBottoms
    }
    if (!arraysEqual(lineBottoms, this.lineBottoms)) {
      this.lineBottoms = lineBottoms
    }
    if (!arraysEqual(lineHeights, this.lineHeights)) {
      this.lineHeights = lineHeights
    }

    innerSize.h = lineBottoms.at(-1) || 0
  }
}
