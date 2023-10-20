// log.active
import { $, fn, fx } from 'signal'
import { Rect } from 'std'
import { Comp } from './comp.ts'
import { Renderable } from './renderable.ts'

export class Brackets extends Comp {
  r1 = $(new Rect)
  r2 = $(new Rect)
  get renderable() {
    $()
    const it = this
    const { ctx, r1, r2 } = $.of(it)
    const { buffer, dims } = $.of(ctx)
    class BracketsRenderable extends Renderable {
      viewRect = $(new Rect)
      @fx update_rect() {
        const { pr, rect } = $.of(this)
        const { lineHeight, charWidth } = $.of(dims)
        $()
        rect.w = r1.w = r2.w = Math.floor(charWidth + 6)
        rect.h = r1.h = r2.h = Math.floor(lineHeight + 6)
        this.needRender = true
      }
      @fx update_brackets() {
        const { viewRect } = $.of(this)
        const { lineBaseTops, charWidth } = $.of(dims)
        const {
          hasBrackets,
          bracketsPair: {
            open,
            close
          }
        } = $.of(buffer)
        const { x: ox, y: oy } = open
        const { x: cx, y: cy } = close
        $()
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
        c.strokeStyle = '#f2a'
        c.lineWidth = 1

        this.needInit = false
        this.needRender = true
      }
      @fn render() {
        const { canvas, rect } = $.of(this)
        const { c } = $.of(canvas)
        rect.clear(c)
        c.strokeRect(
          3,
          4,
          r1.w - 6,
          r1.h - 6
        )
        this.needRender = false
        this.needDraw = true
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { pr, canvas, isHidden } = $.of(this)
        if (!isHidden) {
          r1.drawImage(canvas.el, c, pr, true)
          r2.drawImage(canvas.el, c, pr, true)
        }
        this.needDraw = false
      }
    }
    return $(new BracketsRenderable(this.ctx))
  }
}
