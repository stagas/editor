import { $, fn, fx, of } from 'signal'
import { Point, Rect, Renderable } from 'std'
import { Comp } from './comp.ts'

export class ActiveLine extends Comp
  implements Renderable.It {
  get renderable() {
    $()
    const it = this
    const { ctx } = of(it)
    const { skin, buffer, dims } = of(ctx)
    class ActiveLineRenderable extends Renderable {
      view = $(new Rect)
      @fx update_rect() {
        const { rect: r, view: vr } = this
        const { line } = of(buffer)
        const { rect: { w: rw }, lineHeight, lineBaseTops, innerSize, overscrollX } = of(dims)
        const { w } = innerSize
        $()
        r.h = vr.h = lineHeight + 2
        r.w = vr.w = Math.max(rw, w + overscrollX)
        vr.y = lineBaseTops[line]
        this.need |= Renderable.Need.Render
      }
      @fn render(c: CanvasRenderingContext2D, t: number, clear: boolean) {
        const { rect } = this
        if (clear) rect.clear(c)
        rect.fill(c, skin.colors.bgBright015)
        this.need &= ~Renderable.Need.Render
        this.need |= Renderable.Need.Draw
      }
      @fn draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
        const { pr, canvas, view } = this
        view.drawImageTranslated(
          canvas.el, c, pr, true, scroll)
        this.need &= ~Renderable.Need.Draw
      }
    }
    return $(new ActiveLineRenderable(it as Renderable.It))
  }
}
