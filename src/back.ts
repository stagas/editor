// log.active
import { $, fn, init } from 'signal'
import { Renderable } from 'std'
import { Comp } from './comp.ts'

export class Back extends Comp
  implements Renderable.It {
  get renderable() {
    $()
    const it = this
    class BackRenderable extends Renderable {
      clearBeforeRender = false
      @init full_window_canvas_on_init() {
        this.rect.setParameters(0, 0, 300, 300)
        this.view.setParameters(0, 0, 300, 300)
      }
      @fn init(c: CanvasRenderingContext2D) {
        c.imageSmoothingEnabled = false
      }
      // @fn draw(c: CanvasRenderingContext2D, point: Point) {

      // }
    }
    return $(new BackRenderable(
      it as Renderable.It
    ))
  }
}
