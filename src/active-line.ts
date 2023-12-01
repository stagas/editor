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
      @fx update_rect() {
        const { rect: r, view: vr } = this
        const { line } = of(buffer)
        const { view: { w: rw }, lineHeight, lineBaseTops, innerSize, overscrollX } = of(dims)
        const { w } = innerSize
        $()
        r.h = vr.h = lineHeight
        r.w = vr.w = Math.max(rw, w + overscrollX)
        vr.y = lineBaseTops[line]
      }
      @fn draw(c: CanvasRenderingContext2D, point: Point) {
        const { view } = this
        view.fillTranslated(c, point.sub(view.pos), skin.colors.bgBright015)
      }
    }
    return $(new ActiveLineRenderable(it as Renderable.It))
  }
}
