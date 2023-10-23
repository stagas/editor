import { $, fn, fx, of } from 'signal'
import { Rect } from 'std'
import { Comp } from './comp.ts'
import { Renderable } from './renderable.ts'

export class ActiveLine extends Comp {
  get renderable() {
    $()
    const it = this
    const { ctx } = of(it)
    const { skin, buffer, dims } = of(ctx)
    class ActiveLineRenderable extends Renderable {
      dirtyRects = [$(new Rect)]
      position = Renderable.Position.Inner
      viewRect = $(new Rect)
      @fx update_rect() {
        const { rect: r, viewRect: vr } = this
        const { line } = of(buffer)
        const { lineHeight, lineBaseTops, innerSize, overscrollX } = of(dims)
        const { w } = innerSize
        $()
        r.h = vr.h = lineHeight + 2
        r.w = vr.w = w + overscrollX
        vr.y = lineBaseTops[line]
        this.needRender = true
      }
      @fn render(t: number, c: CanvasRenderingContext2D) {
        const { rect } = this
        rect.fill(c, skin.colors.bgBright015)
        this.needRender = false
        this.needDraw = true
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { pr, canvas, viewRect, dirtyRects: [dr] } = this
        viewRect.drawImage(canvas.el, c, pr, true)
        dr.set(viewRect)
        this.needDraw = false
      }
    }
    return $(new ActiveLineRenderable(this.ctx))
  }
}
