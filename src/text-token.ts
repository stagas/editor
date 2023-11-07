// log.active
import { $, fn, fx, of } from 'signal'
import { Point, Rect, Renderable } from 'std'
import { Comp } from './comp.ts'
import { SourceToken } from './source.ts'

export class TextToken extends Comp
  implements Renderable.It {
  token?: SourceToken
  get renderable() {
    $(); return $(new TextTokenRenderable(
      this
    ))
  }
}

class TextTokenRenderable extends Renderable {
  constructor(public it: TextToken) {
    super(it,
      true,
      it.ctx.canvas.rect,
      it.ctx.canvas)
  }
  view = $(new Rect)
  preferDirectDraw = true
  padding = $(new Point, { x: .5, y: .5 })
  @fx update_dims() {
    const { it } = this
    const { ctx, token: t } = of(it)
    const { prRecip, rect, view } = of(this)
    const { dims } = ctx
    const { charWidth, charHeight, lineHeight, lineBaseBottoms } = of(dims)
    $()
    view.x = t.col * charWidth + 1
    view.y = lineBaseBottoms[t.line] - charHeight
    view.w = t.text.length * charWidth
    view.h = lineHeight
    this.need |= Renderable.Need.Render
  }
  @fx trigger_draw() {
    const { ctx: { scroll: { x, y } } } = of(this.it)
    $()
    this.need |= Renderable.Need.Render
  }
  get color() {
    const { it } = this
    const { ctx, token: t } = of(it)
    const { text, buffer } = of(ctx)
    const { Token } = of(buffer)
    const { renderable: { colors } } = of(text)
    return (t.text.length <= 2
      && colors?.[t.text]) // TODO: this is slow
      ||
      (colors?.[Token.Type[t.type]] ?? '#fff')
  }
  @fn init(c: CanvasRenderingContext2D) {
    const { it } = this
    const { ctx, token: t } = of(it)
    const { text, buffer } = of(ctx)
    const { Token } = of(buffer)
    c.imageSmoothingEnabled = false
    c.miterLimit = 3
    c.lineJoin = 'round'
    c.lineCap = 'round'
    c.textAlign = 'left'
    c.textBaseline = 'top'
    c.font = text.renderable.font
    c.lineWidth = text.renderable.lineWidth
  }
  @fn render(c: CanvasRenderingContext2D) {
    const { token: t } = of(this.it)
    const { color } = this
    c.fillStyle = c.strokeStyle = color
    c.strokeText(t.text, 0, 0)
    c.fillText(t.text, 0, 0)
  }
}
