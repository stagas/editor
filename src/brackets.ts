// log.active
import { $, fn, fx, of } from 'signal'
import { Point, Rect, Renderable } from 'std'
import { Comp } from './comp.ts'
import { Editor } from './editor.ts'

export class Bracket extends Comp {
  constructor(public view: $<Rect>, public ctx: Editor) { super(ctx) }
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
      @fx trigger_draw_on_isHidden__() {
        const { isHidden } = this
        $()
        this.needDraw = true
      }
      @fx update_rect() {
        const { view: v } = this
        const { w, h } = it.view
        $()
        v.w = w
        v.h = h
      }
      @fx update_view() {
        const { view: v } = this
        const { x, y } = it.view
        $()
        v.x = x
        v.y = y
      }
      @fn draw(c: CanvasRenderingContext2D, point: Point) {
        const { view } = of(this)
        c.save()
        let { x, y } = point
        x += this.offset.x
        y += this.offset.y
        c.strokeRect(
          x + 4,
          y + 4,
          view.w - 6,
          view.h - 6
        )
        c.restore()
      }
    }
    return $(new BracketRenderable(it as Renderable.It))
  }
}
export class Brackets extends Comp {
  v1 = $(new Rect)
  v2 = $(new Rect)
  b1 = $(new Bracket(this.v1, this.ctx))
  b2 = $(new Bracket(this.v2, this.ctx))
  get renderable() {
    $()
    const it = this
    const { ctx, v1, v2, b1, b2 } = of(it)
    const { buffer, dims } = of(ctx)
    class BracketsRenderable extends Renderable {
      @fx update_rects() {
        const { lineHeight, charWidth } = of(dims)
        $()
        v1.w = v2.w = Math.floor(charWidth + 5)
        v1.h = v2.h = Math.floor(lineHeight + 4)
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
          buffer.getPointFromLineCol(open, v1)
          buffer.getPointFromLineCol(close, v2)
          v1.translate(-3).round()
          v2.translate(-3).round()
          v2.x -= 1
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
    return $(new BracketsRenderable(it as Renderable.It, false), {
      copyView: it.ctx.world.render.view
    })
  }
}
