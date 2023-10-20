// log.active
import { $, fn, fx } from 'signal'
import { Line, Point, Rect } from 'std'
import { debounce } from 'utils'
import { Renderable } from './renderable.ts'
import { BRACKET, Close, TOKEN, closers, findMatchingBrackets, parseWords } from './util.ts'
import { Comp } from './comp.ts'

const tempPoint = $(new Point)

class SortedLine extends Line {
  forward?: boolean
}

export class Selection extends Comp {
  get renderable(): $<Renderable> {
    $()
    const it = this
    class SelectionRenderable extends Renderable {
      viewRect = $(new Rect)
      isHidden = false
      topPx = $(new Point)
      bottomPx = $(new Point)
      @fx triggerRender() {
        const { viewRect: vr, topPx, bottomPx } = $.of(this)
        const { ctx, selection: { start: { xy: sxy }, end: { xy: exy } } } = $.of(it)
        const { buffer, dims } = $.of(ctx)
        const { charWidth } = $.of(dims)
        $()
        const top = buffer.getPointFromLineCol(it.sorted.top, topPx)
        const bottom = buffer.getPointFromLineCol(it.sorted.bottom, bottomPx)
        bottom.y += dims.lineHeight
        vr.top = top.y
        // TODO: top.x since its sorted?
        vr.left = Math.min(top.x, bottom.x)
        vr.w = Math.max(top.x, bottom.x) - vr.left
        vr.h = bottom.y - top.y
        this.needRender = true
      }
      @fx triggerRenderOnScroll() {
        const t = this
        const { ctx } = $.of(t)
        const { dims } = $.of(ctx)
        const { scroll: { xy }, charWidth } = $.of(dims)
        $()
        this.needRender = true
      }
      @fn render(t: number, c: CanvasRenderingContext2D, clear?: boolean) {
        const { canvas, rect } = $.of(this)
        const { sorted, hasSelection, ctx } = $.of(it)
        const { skin, buffer, dims } = $.of(ctx)
        const { scroll, charWidth } = $.of(dims)

        if (hasSelection) {
          log('top', sorted.top.text, 'bottom', sorted.bottom.text)
          if (clear) {
            rect.clear(c)
          }
          c.save()
          c.translate(scroll.x, scroll.y)
          buffer.fillTextRange(c, sorted, skin.colors.bgBright2, true)
          c.restore()
          this.needDraw = true
        }

        this.needRender = false
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { pr, canvas, rect } = $.of(this)
        const { hasSelection } = $.of(it)

        if (hasSelection) {
          rect.drawImage(canvas.el, c, pr, true)
        }

        this.needDraw = false
      }
    }
    return $(new SelectionRenderable(this.ctx, this.ctx.renderable.rect))
  }

  selection = $(new Line)
  start = this.selection.$.start
  end = this.selection.$.end
  text = ''

  get hasSelection() {
    return !this.start.equals(this.end)
  }
  _sorted = $(new SortedLine)
  get sorted() {
    const { selection, _sorted } = this
    // Line & forward
    let top: $<Point>
    let bottom: $<Point>
    let forward = false

    if (selection.start.y === selection.end.y) {
      if (selection.start.x < selection.end.x) {
        top = selection.start
        bottom = selection.end
        forward = true
      }
      else {
        top = selection.end
        bottom = selection.start
      }
    }
    else if (selection.start.y < selection.end.y) {
      top = selection.start
      bottom = selection.end
      forward = true
    }
    else {
      top = selection.end
      bottom = selection.start
    }
    $()
    _sorted.top = top
    _sorted.bottom = bottom
    _sorted.forward = forward
    return _sorted
  }
  @fn getSelectionIndexes() {
    const { buffer } = $.of(this.ctx)
    const { top, bottom } = this.sorted
    const a = buffer.getIndexFromCoords(top)
    const b = buffer.getIndexFromCoords(bottom)
    tempPoint.left = a
    tempPoint.right = b
    return tempPoint
  }
  get deleteSelection() {
    const { history, buffer, input } = $.of(this.ctx)
    const { keyboard } = $.of(input)
    return history.historic(() => {
      const { code } = buffer
      const { selection } = this
      if (selection.start.equals(selection.end)) return ''

      const { top, bottom } = this.sorted
      const a = buffer.getIndexFromCoords(top)
      const b = buffer.getIndexFromCoords(bottom)
      const removing = code.slice(a, b)
      const charRight = code[b]!

      buffer.code = code.slice(0, a) + code.slice(b)
      buffer.line = top.y
      buffer.coli = buffer.col = top.x

      const res = { x: buffer.coli, y: buffer.line }
      selection.start.set(res)
      selection.end.set(res)

      // KEEP: needed for animation to work
      $.flush()

      if (closers.has(charRight) && removing === Close[charRight]) {
        keyboard.handleKey({ key: 'Delete' })
      }
      return removing
    })
  }
  @fn resetTo(p: Point) {
    this.start.set(p)
    this.end.set(p)
  }
  @fn selectLine(line: number) {
    const { ctx, selection } = $.of(this)
    const { buffer } = $.of(ctx)
    const { lines } = $.of(buffer)

    selection.start.set({ x: 0, y: line })
    selection.end.set({ x: lines[line].length, y: line })
    return true
  }
  @fn selectMatchingBrackets(p: Point, exclusive?: boolean) {
    const { ctx, selection } = $.of(this)
    const { buffer } = $.of(ctx)
    const { code } = $.of(buffer)

    const index = buffer.getIndexFromCoords(p)
    const match = findMatchingBrackets(code, index)
    if (match) {
      const exn = Number(exclusive ?? 0)
      let start = match[0] + exn
      let end = match[1] - exn + 1
      if (Math.abs(end - index) > Math.abs(start - index)) {
        [start, end] = [end, start]
      }
      buffer.getLineColFromIndex(start, selection.start)
      buffer.getLineColFromIndex(end, selection.end)
      return true
    }
    return false
  }
  @fn selectWordBoundary(p: Point, expand?: boolean) {
    const { ctx, selection, sorted: { forward } } = $.of(this)
    const { buffer } = $.of(ctx)
    const { code, lines } = $.of(buffer)
    const { line, col } = p
    const words = parseWords(TOKEN, lines[line])
    for (let i = 0, word: any, next: any; i < words.length; i++) {
      word = words[i]
      next = i < words.length - 1 ? words[i + 1] : { index: Infinity }
      if (col >= word.index && col < next.index) {
        const start = { x: word.index, y: line }
        const end = { x: word.index + word[0].length, y: line }
        if (expand) {
          selection.end.set(forward ? end : start)
        }
        else {
          selection.start.set(start)
          selection.end.set(end)
        }
        // We exclude brackets from being selected as words, so
        // that we fall back to a matching brackets selection in mouse.
        if (word[0].length === 1 && BRACKET.test(word)) return false
        return Boolean(word[0].trim().length)
      }
    }
    return false
  }
  @fx shiftKeyPressedExtendsSelection() {
    const { ctx, selection } = $.of(this)
    const { buffer, input } = $.of(ctx)
    const { line, col } = $.of(buffer)
    const { keyboard } = $.of(input)
    const { shiftKey } = $.when(keyboard)
    $()
    selection.end.set({ x: col, y: line })
  }
  @fn updateTextareaText = () => {
    const { ctx, text } = $.of(this)
    const { input } = $.of(ctx)
    input.textarea.value = text
    input.textarea.select()
  }
  // updateTextareaTextDebounced = debounce(250, this.updateTextareaText)
  @fx update_text() {
    const { ctx, selection: { start: { xy: sxy }, end: { xy: exy } } } = $.of(this)
    const { buffer, input } = $.of(ctx)
    const { source, code } = $.of(buffer)
    $()
    const { top, bottom } = this.sorted
    const a = buffer.getIndexFromCoords(top)
    const b = buffer.getIndexFromCoords(bottom)
    this.text = code.slice(a, b)
    // this.updateTextareaTextDebounced()
  }
}
