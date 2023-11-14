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
  constructor(public it: TextToken) { super(it) }
  // preferDirectDraw = true
  text = ''
  offset = $(new Point(1.5, 1))
  @fx update_dims() {
    const { it, offset } = this
    const { ctx, token: t } = of(it)
    const { view } = of(this)
    const { dims } = ctx
    const { hasSize } = when(dims.view)
    const { charWidth, charHeight, lineHeight, lineBaseBottoms } = of(dims)
    $()
    this.text = t.text
    view.x = Math.round(t.col * charWidth) //- .5
    view.y = Math.round(lineBaseBottoms[t.line] - lineHeight - (lineHeight - charHeight) / 2)
    view.w = t.text.length * charWidth + 2
    view.h = lineHeight + offset.y * 2
    // rect.w = Math.max(rect.w, view.w)
    // rect.h = Math.max(rect.h, view.h)
  }
  @fx trigger_render() {
    const { text } = of(this)
    $()
    this.needDraw = true
    this.needRender = true
  }
  // @fx trigger_draw() {
  //   const { ctx: { scroll: { x, y } } } = of(this.it)
  //   const { didRender } = when(this)
  //   $()
  //   this.need |= Renderable.Need.Draw
  // }
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
    c.font = ctx.renderable.font
    c.lineWidth = text.renderable.lineWidth
  }
  @fn draw(c: CanvasRenderingContext2D, { x, y }: Point) {
    const { it, color } = this
    const { ctx, token: t } = of(it)
    const { view, offset } = of(this)
    const { dims, text } = ctx
    if (!dims.charWidth) return

    y += view.height - offset.y
    c.strokeStyle = '#000'
    c.lineWidth = 2
    c.strokeText(t.text, x, y)
    c.fillStyle = c.strokeStyle = color
    c.lineWidth = text.renderable.lineWidth * 2
    c.strokeText(t.text, x, y)
    c.fillText(t.text, x, y)
  }
}
