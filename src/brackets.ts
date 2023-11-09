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
    class BracketRenderable extends Renderable {
      isHidden = true
      offset = $(new Point(.5, .5))
      @fn init(c: CanvasRenderingContext2D) {
        c.strokeStyle = '#f2a'
        c.lineWidth = 1
      }
      @fn draw(c: CanvasRenderingContext2D, point: Point) {
        const { rect } = of(this)
        c.save()
        point.translate(c)
        c.strokeRect(
          4,
          4,
          rect.w - 6,
          rect.h - 6
        )
        c.restore()
      }
    }
    return $(new BracketRenderable(it as Renderable.It, true, it.rect))
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
        r1.h = r2.h = Math.floor(lineHeight + 4)
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
          r1.translate(-3).round()
          r2.translate(-3).round()
          b1.renderable.isHidden
            = b2.renderable.isHidden = false
        }
        b1.renderable.needDraw = true
        b2.renderable.needDraw = true
      }
      get its() {
        return [b1, b2]
      }
    }
    return $(new BracketsRenderable(it as Renderable.It, false))
  }
}
