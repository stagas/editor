// log.active
import { $, fn, fx, of } from 'signal'
import { Point, Rect, Renderable } from 'std'
import { Comp } from './comp.ts'
import { Editor } from './editor.ts'

export class Bracket extends Comp {
  constructor(public rect: $<Rect>, public ctx: Editor) { super(ctx) }
  get renderable() {
    $()
    const it = this
    const { ctx } = of(it)
    class BracketRenderable extends Renderable {
      isHidden = true
      @fn init(c: CanvasRenderingContext2D) {
        c.strokeStyle = '#f2a'
        c.lineWidth = 1
        this.need &= ~Renderable.Need.Init
        this.need |= Renderable.Need.Render
      }
      @fn render() {
        const { canvas, rect } = of(this)
        const { c } = of(canvas)
        rect.clear(c)
        c.save()
        c.translate(.5, .5)
        c.strokeRect(
          3,
          4,
          rect.w - 6,
          rect.h - 6
        )
        c.restore()
        this.need &= ~Renderable.Need.Render
        this.need |= Renderable.Need.Draw
      }
      @fn draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
        const { pr, canvas, rect, isHidden } = of(this)
        if (!isHidden) {
          rect.drawImageTranslated(
            canvas.el, c, pr, true, scroll)
        }
        this.need &= ~Renderable.Need.Draw
      }
    }
    return $(new BracketRenderable(it as Renderable.It, it.rect))
  }
}
export class Brackets extends Comp {
  r1 = $(new Rect)
  r2 = $(new Rect)
  b1 = $(new Bracket(this.r1, this.ctx))
  b2 = $(new Bracket(this.r2, this.ctx))
  get renderable() {
    $()
    const it = this
    const { ctx, r1, r2, b1, b2 } = of(it)
    const { buffer, dims } = of(ctx)
    class BracketsRenderable extends Renderable {
      @fx update_rects() {
        const { pr, rect } = of(this)
        const { lineHeight, charWidth } = of(dims)
        $()
        r1.w = r2.w = Math.floor(charWidth + 6)
        r1.h = r2.h = Math.floor(lineHeight + 6)
      }
      @fx update_brackets() {
        const { lineBaseTops, charWidth } = of(dims)
        const {
          hasBrackets,
          bracketsPair: {
            open,
            close
          }
        } = of(buffer)
        const { x: ox, y: oy } = open
        const { x: cx, y: cy } = close
        $()
        if (!hasBrackets) {
          b1.renderable.isHidden
          = b2.renderable.isHidden = true
        }
        else {
          buffer.getPointFromLineCol(open, r1)
          buffer.getPointFromLineCol(close, r2)
          r1.translate(-2).floor()
          r2.translate(-2).floor()
          b1.renderable.isHidden
          = b2.renderable.isHidden = false
        }
        b1.renderable.need |= Renderable.Need.Draw
        b2.renderable.need |= Renderable.Need.Draw
      }
      get its() {
        return [b1, b2]
      }
    }
    return $(new BracketsRenderable(this.ctx))
  }
}
