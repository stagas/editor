import { $, fn } from 'signal'
import { Widget } from './widget.ts'

export class SkeletonDeco extends Widget {
  get renderable() {
    $()
    const it = this
    class SkeletonDecoRenderable extends Widget.Renderable {
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { rect } = $.of(this)
        rect.fill(c, '#666')
      }
    }
    return $(new SkeletonDecoRenderable(this))
  }
}
