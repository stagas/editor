log.active
import { $, fn, fx, init, nulls } from 'signal'
import { Point, Rect } from 'std'
import { arraysEqual } from 'utils'
import { WidgetLike } from './widgets.ts'
import { Context } from './context.ts'

interface PointerItem { }

export class Dims {
  constructor(
    public ctx: Context,
    public rect = ctx.rect
  ) { }

  get lines() {
    return this.ctx.buffer?.source?.lines
  }

  sub: (WidgetLike | (WidgetLike & PointerItem))[] = []
  deco: WidgetLike[] = []

  blinkDelay = 270 // TODO: sync to beat
  fontSize = 12
  fontsReady = true //?: boolean

  // TODO: single point? char.width char.height ?
  charWidth: number = 1
  get lineHeight() {
    return Math.round(this.fontSize * 1.5)
  }

  // this is a temporary rect for dims
  // TODO: we shouldn't need this, handled in the deco/widget instead
  dimRect = $(new Rect, { w: 1, h: 1 })
  scrollbarSize = $(new Point, { x: 13, y: 7 })

  get scroll() {
    return this.ctx.scroll.pos
  }

  get overscrollX() {
    return this.charWidth * 2
  }

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

  @nulls get innerSizeWidth() {
    const { lines, longestLine, charWidth, scrollbarSize } = $.of(this)
    return longestLine * charWidth + scrollbarSize.w
  }

  innerSize = $(new Point)
  @fx update_innerSize_width() {
    const { lines, innerSize, longestLine, charWidth, scrollbarSize } = $.of(this)
    const w = longestLine * charWidth + scrollbarSize.w
    $.untrack()
    innerSize.w = this.innerSizeWidth
    log('innerSize.w', w)
  }

  viewSpan = $(new Point)
  @fx update_viewSpan() {
    const { scroll, rect, lineHeight, viewSpan } = $.of(this)
    const top = -scroll.y
    const bottom = top + rect.h + lineHeight
    $.untrack()
    viewSpan.top = top
    viewSpan.bottom = bottom
  }

  get lastVisibleLine() {
    const { lines, deco, sub } = $.of(this)
    return Math.max(
      lines.length,
      ...deco.map(wi => wi.dim.line),
      ...sub.map(wi => wi.dim.line),
    ) + 1
  }

  get decoHeights() {
    const { lastVisibleLine, deco } = $.of(this)
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
    const { lastVisibleLine, sub } = $.of(this)
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

  @fx update_lineDims() {
    const { innerSize, lines, lineHeight, decoHeights, subHeights, lastVisibleLine } = $.of(this)
    $.untrack()
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

  get longestLine() {
    const { lines } = $.of(this)
    let longest = 0
    for (let i = 0, len = 0; i < lines.length; i++) {
      len = lines[i].length
      if (len > longest) longest = len
    }
    return longest
  }
}
