log.active
import { $, fn, fx } from 'signal'
import { Render } from './render.ts'
import { Rect } from 'std'

export class Brackets extends Render {
  rect1 = $(new Rect)
  rect2 = $(new Rect)
  viewRect = $(new Rect)
  isHidden = false

  @fx update_rect() {
    const { ctx, pr, rect, rect1, rect2 } = $.of(this)
    const { dims } = $.of(ctx)
    const { lineHeight, charWidth } = $.of(dims)
    $.untrack()
    if (!charWidth) return
    rect.w = rect1.w = rect2.w = Math.floor(charWidth + 6)
    rect.h = rect1.h = rect2.h = Math.floor(lineHeight + 6)
    this.needRender = true
  }
  @fx update_brackets() {
    const { ctx, rect1: r1, rect2: r2, viewRect } = $.of(this)
    const { buffer, dims } = $.of(ctx)
    const { lineBaseTops } = $.of(dims)
    const {
      hasBrackets,
      bracketsPair: {
        open,
        close
      }
    } = $.of(buffer)
    const { x: ox, y: oy } = open
    const { x: cx, y: cy } = close
    $.untrack()
    if (!hasBrackets) {
      this.isHidden = true
    }
    else {
      buffer.getPointFromLineCol(open, r1)
      buffer.getPointFromLineCol(close, r2)
      r1.translate(-2).floor()
      r2.translate(-2).floor()
      viewRect.zero().combine(r1).combine(r2)
      this.isHidden = false
    }
    this.needDraw = true
  }
  @fn initCanvas(c: CanvasRenderingContext2D) {
    c.translate(.5, .5)
    this.needRender = true
  }
  @fn render() {
    const { canvas, rect1, rect } = $.of(this)
    const { c } = $.of(canvas)
    c.strokeStyle = '#f2a'
    c.lineWidth = 1

    rect.clear(c)
    c.strokeRect(
      3,
      4,
      rect1.w - 6,
      rect1.h - 6
    )
    this.needRender = false
    this.needDraw = true
  }
  @fn draw(c: CanvasRenderingContext2D) {
    const { pr, canvas, rect1, rect2, isHidden } = $.of(this)
    if (!isHidden) {
      rect1.drawImage(canvas.el, c, pr, true)
      rect2.drawImage(canvas.el, c, pr, true)
    }
    this.needDraw = false
  }
}
