import { $, alias, fn, fx, init } from 'signal'
import { Point, Line, Rect, World } from 'std'
import { debounce } from 'utils'
import { Context } from './context.ts'
import { RenderScene } from './render-scene.ts'
import { Close, TOKEN, closers, findMatchingBrackets, parseWords } from './util.ts'

const tempPoint = $(new Point)

class SortedLine extends Line {
  forward?: boolean
}

export class SelectionScene extends RenderScene {
  constructor(public world: World, public target: Selection) { super(world) }
  viewRect = $(new Rect)
  isHidden = false
  selectionSorted?: SortedLine
  topPx = $(new Point)
  bottomPx = $(new Point)

  @fx triggerRender() {
    const { viewRect: vr, target: t, topPx, bottomPx } = $.of(this)
    const { ctx } = $.of(t)
    const { buffer, dims } = $.of(ctx)
    const selectionSorted = t.getSelectionSorted()
    $.untrack()
    this.selectionSorted = selectionSorted
    const a = buffer.getPointFromLineCol(selectionSorted.top, topPx)
    const b = buffer.getPointFromLineCol(selectionSorted.bottom, bottomPx)
    b.y += dims.lineHeight
    vr.top = a.y
    vr.left = Math.min(a.x, b.x)
    vr.w = Math.max(a.x, b.x) - vr.left
    vr.h = b.y - a.y
    this.needRender = true
  }

  @fx triggerRenderOnScroll() {
    const { target: t } = this
    const { ctx } = $.of(t)
    const { dims } = $.of(ctx)
    const { scroll: { xy } } = $.of(dims)
    $.untrack()
    this.needRender = true
  }

  render(oc?: CanvasRenderingContext2D) {
    const { canvas, selectionSorted, rect, target: t } = $.of(this)
    const { ctx } = $.of(t)
    const { skin, buffer, dims } = $.of(ctx)
    const { scroll } = $.of(dims)
    let { c } = $.of(canvas)

    //!: render
    if (t.hasSelection) {
      log('top', selectionSorted.top.text, 'bottom', selectionSorted.bottom.text)
      if (oc) {
        c = oc
      }
      else {
        rect.clear(c)
      }
      c.save()
      c.translate(scroll.x, scroll.y)
      buffer.fillTextRange(c, selectionSorted, skin.colors.bgBright2, true)
      c.restore()
    }
    this.needRender = false
    this.needDraw = true
  }
  draw(
    c: CanvasRenderingContext2D) {
    const { pr, canvas, rect, target: t } = this
    if (t.hasSelection) {
      //!: draw
      rect.drawImage(canvas.el, c, pr, true)
    }
    this.needDraw = false
  }
}

export class Selection {
  constructor(public ctx: Context) { }

  selection = $(new Line)
  start = this.selection.$.start
  end = this.selection.$.end
  selectionSorted = $(new SortedLine)
  selectionText = ''

  get hasSelection() {
    return !this.start.equals(this.end)
  }

  @fn getSelectionSorted = () => {
    const { selection, selectionSorted } = this
    // Line & forward
    let top: Point
    let bottom: Point
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
    selectionSorted.top.set(top)
    selectionSorted.bottom.set(bottom)
    selectionSorted.forward = forward
    return selectionSorted
  }
  @fn getSelectionIndexes() {
    const { buffer } = $.of(this.ctx)
    const { top, bottom } = this.getSelectionSorted()
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

      const { top, bottom } = this.getSelectionSorted()
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

  selectLine(line: number) {
    const { ctx, selection } = $.of(this)
    const { buffer } = $.of(ctx)
    const { lines } = $.of(buffer)

    selection.start.set({ x: 0, y: line })
    selection.end.set({ x: lines[line].length, y: line })
    return true
  }
  selectMatchingBrackets(p: Point, exclusive?: boolean) {
    const { ctx, selection } = $.of(this)
    const { buffer } = $.of(ctx)
    const { code } = $.of(buffer)

    const index = buffer.getIndexFromCoords(p)
    const match = findMatchingBrackets(code, index)
    if (match) {
      const exn = Number(exclusive ?? 0)
      buffer.getLineColFromIndex(match[0] + exn, selection.start)
      buffer.getLineColFromIndex(match[1] - exn + 1, selection.end)
      return true
    }
    return false
  }
  selectWordBoundary(p: Point) {
    const { ctx, selection } = $.of(this)
    const { buffer } = $.of(ctx)
    const { code, lines } = $.of(buffer)
    const { line, col } = p
    const words = parseWords(TOKEN, lines[line])
    for (let i = 0, word: any, next: any; i < words.length; i++) {
      word = words[i]
      next = i < words.length - 1 ? words[i + 1] : { index: Infinity }
      if (col >= word.index && col < next.index) {
        selection.start.set({ x: word.index, y: line })
        selection.end.set({ x: word.index + word[0].length, y: line })
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
    $.untrack()
    selection.end.set({ x: col, y: line })
  }
  updateTextareaText() {
    const { ctx, selectionText } = $.of(this)
    const { input } = $.of(ctx)
    input.textarea.value = selectionText
    input.textarea.select()
  }
  updateTextareaTextDebounced = debounce(250, () => this.updateTextareaText())

  @fx update_selectionText() {
    const { ctx, selection: { start: { xy: sxy }, end: { xy: exy } } } = $.of(this)
    const { buffer, input } = $.of(ctx)
    const { code } = $.of(buffer)
    $.untrack()
    const { top, bottom } = this.getSelectionSorted()
    const a = buffer.getIndexFromCoords(top)
    const b = buffer.getIndexFromCoords(bottom)
    this.selectionText = code.slice(a, b)
    this.updateTextareaTextDebounced()
  }
}
