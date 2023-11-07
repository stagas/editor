// log.active
import { $, fn, fx, of, when } from 'signal'
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
  preferDirectDraw = true
  view = $(new Rect)
  padding = $(new Point(1.5, 1))
  @fx update_dims() {
    const { it, padding } = this
    const { ctx, token: t } = of(it)
    const { prRecip, rect, view } = of(this)
    const { dims } = ctx
    const { hasSize } = when(dims.rect)
    const { charWidth, charHeight, lineHeight, lineBaseBottoms } = of(dims)
    $()
    view.x = Math.round(t.col * charWidth) - .5
    view.y = Math.round(lineBaseBottoms[t.line] - lineHeight - (lineHeight - charHeight) / 2)
    view.w = t.text.length * charWidth + 2
    view.h = lineHeight + padding.y * 2
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
      || (colors?.[Token.Type[t.type]] ?? '#fff')
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
    c.textBaseline = 'bottom'
    c.font = text.renderable.font
    c.lineWidth = text.renderable.lineWidth
  }
  @fn render(c: CanvasRenderingContext2D) {
    const { it, color } = this
    const { ctx, token: t } = of(it)
    const { view, padding } = of(this)
    const { dims, text } = ctx
    if (!dims.charWidth) return

    const y = view.height - padding.y * 2
    c.strokeStyle = '#000'
    c.lineWidth = 2
    c.strokeText(t.text, 0, y)
    c.fillStyle = c.strokeStyle = color
    c.lineWidth = text.renderable.lineWidth * 2
    c.strokeText(t.text, 0, y)
    c.fillText(t.text, 0, y)
  }
}
