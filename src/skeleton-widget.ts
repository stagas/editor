import { $, fn } from 'signal'
import { Widget } from './widget.js'

export class SkeletonWidget extends Widget {
  get renderable() {
    $()
    const it = this
    class SkeletonWidgetRenderable extends Widget.Renderable {
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { rect } = $.of(this)
        rect.fill(c, '#666')
      }
    }
    return $(new SkeletonWidgetRenderable(this))
  }
}
