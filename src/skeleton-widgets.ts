import { $, fn } from 'signal'
import { Widget } from './widget.ts'

export class SkeletonDeco extends Widget {
  @fn draw(t: number, c: CanvasRenderingContext2D) {
    const { rect } = $.of(this).renderable
    rect.fill(c, '#666')
  }
  get renderable() {
    $()
    const it = this
    class SkeletonDecoRenderable extends Widget.Renderable {
    }
    return $(new SkeletonDecoRenderable(this))
  }
}
