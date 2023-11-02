// log.active
import { $, fn, fx, of, when } from 'signal'
import { Point, Rect, Renderable } from 'std'
import { Comp } from './comp.ts'
import { Linecol } from './linecol.ts'
import { Range } from './range.ts'
import { BRACKET, Close, TOKEN, closers, findMatchingBrackets, parseWords } from './util.ts'

const tempPoint = $(new Point)

export class Selection extends Comp {
  selection = $(new Range)
  sorted = this.selection.$.sorted
  start = this.selection.$.start
  end = this.selection.$.end
  text = ''

  _deleteKeyEvent = new KeyboardEvent('keydown', { key: 'Delete' })

  get hasSelection() {
    return !this.start.equals(this.end)
  }
  @fn getSelectionIndexes() {
    const { buffer } = of(this.ctx)
    const { top, bottom } = this.selection.sorted
    const a = buffer.getIndexFromLineCol(top)
    const b = buffer.getIndexFromLineCol(bottom)
    tempPoint.left = a
    tempPoint.right = b
    return tempPoint
  }
  get deleteSelection() {
    const { history, buffer, keyboard } = of(this.ctx)
    return history.historic(() => {
      const { code } = buffer
      const { selection } = this
      if (selection.start.equals(selection.end)) return ''

      const { top, bottom } = selection.sorted
      const a = buffer.getIndexFromLineCol(top)
      const b = buffer.getIndexFromLineCol(bottom)
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
        keyboard.handleKey(this._deleteKeyEvent)
      }
      return removing
    })
  }
  @fn resetTo(p: Point) {
    this.start.set(p)
    this.end.set(p)
  }
  @fn selectLine(line: number) {
    const { ctx, selection } = of(this)
    const { buffer } = of(ctx)
    const { lines } = of(buffer)

    selection.start.set({ x: 0, y: line })
    selection.end.set({ x: lines[line].length, y: line })
    return true
  }
  @fn selectMatchingBrackets(p: Linecol, exclusive?: boolean) {
    const { ctx, selection } = of(this)
    const { buffer } = of(ctx)
    const { code } = of(buffer)

    const index = buffer.getIndexFromLineCol(p)
    const match = findMatchingBrackets(code, index)
    if (match) {
      const exn = Number(exclusive ?? 0)
      let start = match[0] + exn
      let end = match[1] - exn + 1
      // swap direction depending on which side we are closest.
      if (Math.abs(end - index) > Math.abs(start - index)) {
        [start, end] = [end, start]
      }
      buffer.getLineColFromIndex(start, selection.start)
      buffer.getLineColFromIndex(end, selection.end)
      return true
    }
    return false
  }
  @fn selectWordBoundary(p: Linecol, expand?: boolean) {
    const { ctx, selection } = of(this)
    const { sorted: { forward } } = selection.sorted
    const { buffer } = of(ctx)
    const { code, lines } = of(buffer)
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
    const { ctx, selection } = of(this)
    const { buffer, keyboard } = of(ctx)
    const { line, col } = of(buffer)
    const { shift } = when(keyboard)
    $()
    selection.end.set({ x: col, y: line })
  }
  // @fn updateTextareaText = () => {
  //   const { ctx, text } = of(this)
  //   const { input } = of(ctx)
  //   input.textarea.value = text
  //   input.textarea.select()
  // }
  // updateTextareaTextDebounced = debounce(250, this.updateTextareaText)
  @fx update_text() {
    const { ctx, selection } = of(this)
    const { start: { xy: sxy }, end: { xy: exy } } = selection
    const { buffer } = of(ctx)
    const { source, code } = of(buffer)
    $()
    const { top, bottom } = selection.sorted
    const a = buffer.getIndexFromLineCol(top)
    const b = buffer.getIndexFromLineCol(bottom)
    this.text = code.slice(a, b)
    // this.updateTextareaTextDebounced()
  }
  get renderable() {
    $()
    const it = this
    const { ctx, selection } = of(it)
    const { buffer, dims, scroll, skin } = of(ctx)
    class SelectionRenderable extends Renderable {
      viewRect = $(new Rect)
      dirtyRect = $(new Rect)
      isHidden = false
      topPx = $(new Point)
      bottomPx = $(new Point)
      @fx triggerRender() {
        const { viewRect: vr, topPx, bottomPx } = of(this)
        const { selection: { start: { xy: sxy }, end: { xy: exy } } } = of(it)
        const { charWidth } = of(dims)
        $()
        const top = buffer.getPointFromLineCol(selection.sorted.top, topPx)
        const bottom = buffer.getPointFromLineCol(selection.sorted.bottom, bottomPx)
        bottom.y += dims.lineHeight
        vr.top = top.y
        // TODO: top.x since its sorted?
        vr.left = Math.min(top.x, bottom.x)
        vr.w = Math.max(top.x, bottom.x) - vr.left
        vr.h = bottom.y - top.y
        this.need |= Renderable.Need.Render
      }
      @fx triggerRenderOnScroll() {
        const { scroll: { xy }, charWidth } = of(dims)
        $()
        this.need |= Renderable.Need.Render
      }
      @fn render(c: CanvasRenderingContext2D, t: number, clear?: boolean) {
        const { canvas, rect, dirtyRect: dr } = of(this)
        const { selection, hasSelection, ctx } = of(it)
        const { sorted } = selection
        const { charWidth } = of(dims)

        if (hasSelection) {
          log('top', sorted.top.text, 'bottom', sorted.bottom.text)
          if (clear) {
            rect.clear(c)
          }
          c.save()
          // TODO: maybe use viewRect for everything?
          c.translate(scroll.x, scroll.y)
          const br = buffer.fillTextRange(c, sorted, skin.colors.bgBright2, true)
          if (br) dr.set(br)
          c.restore()
          this.need |= Renderable.Need.Draw
        }

        this.need &= ~Renderable.Need.Render
      }
      @fn draw(c: CanvasRenderingContext2D,t: number) {
        const { pr, canvas, rect, dirtyRect: dr } = of(this)
        const { hasSelection } = of(it)

        if (hasSelection) {
          dr.drawImage(canvas.el, c, pr, true)
        }

        this.need &= ~Renderable.Need.Draw
      }
    }
    return $(new SelectionRenderable(this.ctx, this.ctx.renderable.rect))
  }
}
