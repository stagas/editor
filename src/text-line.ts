// log.active
import { $, fn, fx, nu, of, when } from 'signal'
import { Point, Rect, Renderable } from 'std'
import type { UI } from 'ravescript-vm'
import { Comp } from './comp.ts'
import { SourceToken } from './source.ts'
import { assign } from 'utils'

export function bounds(tokens: SourceToken[]): UI.Dim {
  let line: number = Infinity
  let col: number = Infinity
  let right: number = 0
  let bottom: number = 0
  for (const t of tokens) {
    let t_right = t.col + t.text.length
    if (t.line < line) line = t.line
    if (t.line > bottom) bottom = t.line
    if (t.col < col && t.line === line) col = t.col
    if (t_right > right) right = t_right
  }

  return { line, col, right, bottom }
}

export class TextLine extends Comp
  implements Renderable.It {
  tokens?: SourceToken[]
  get renderable() {
    $(); return $(new TextLineRenderable(this))
  }
}

class TextLineRenderable extends Renderable {
  constructor(public it: TextLine) { super(it) }
  // preferDirectDraw = true
  text = ''
  offset = $(new Point(1.5, 1))
  _tokensBounds: UI.Dim = {
    line: 0,
    col: 0,
    right: 0,
    bottom: 0,
  }
  @nu get tokensBounds() {
    const { it } = this
    const { tokens } = of(it)
    $()
    const b = bounds(tokens)
    const curr = this._tokensBounds
    if (
      b.line !== curr.line
      || b.col !== curr.col
      || b.right !== curr.right
      || b.bottom !== curr.bottom) {
      this._tokensBounds = b
      return b
    }
    return curr
  }
  get tokensByColor() {
    const { it } = this
    const { ctx, tokens } = of(it)
    const { text, buffer } = of(ctx)
    const { Token } = of(buffer)
    const { renderable: { colors } } = of(text)
    $()
    const obj: Record<string, SourceToken[]> = {}
    for (const t of tokens) {
      const color = (t.text.length <= 2
        && colors?.[t.text]) // TODO: this is slow
        || (colors?.[Token.Type[t.type]] ?? '#fff')

      if (color in obj) obj[color].push(t)
      else obj[color] = [t]
    }
    return obj
  }
  @fx update_dims() {
    const { it, offset, tokensBounds: t } = this
    const { ctx, tokens } = of(it)
    const { view } = of(this)
    const { dims } = ctx
    const { hasSize } = when(dims.rect)
    const { charWidth, charHeight, lineHeight, lineBaseBottoms } = of(dims)
    $()
    this.text = tokens.map(t => t.text).join(' ')
    // const t = bounds(tokens)
    view.x = Math.round(t.col * charWidth) //- .5
    view.y = Math.round(lineBaseBottoms[t.line] - lineHeight - (lineHeight - charHeight) / 2)
    view.w = (t.right - t.col) * charWidth + 2
    view.h = lineHeight + offset.y * 2
  }
  @fx trigger_render() {
    const { text } = of(this)
    $()
    this.needDraw = true
    this.needRender = true
  }
  // get color() {
  //   const { it } = this
  //   const { ctx, token: t } = of(it)
  //   const { text, buffer } = of(ctx)
  //   const { Token } = of(buffer)
  //   const { renderable: { colors } } = of(text)
  //   return (t.text.length <= 2
  //     && colors?.[t.text]) // TODO: this is slow
  //     || (colors?.[Token.Type[t.type]] ?? '#fff')
  // }
  @fn init(c: CanvasRenderingContext2D) {
    const { it } = this
    const { ctx, tokens } = of(it)
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
    const { it, tokensByColor, tokensBounds } = this
    const { ctx, tokens } = of(it)
    const { view, offset } = of(this)
    const { dims, text } = ctx
    const { charWidth } = dims
    if (!charWidth) return

    y += view.height - offset.y

    const startCol = tokensBounds.col
    c.strokeStyle = '#000'
    c.lineWidth = text.renderable.lineWidth

    for (const t of tokens) {
      c.strokeText(t.text, x + (t.col - startCol) * charWidth, y)
    }

    for (const color in tokensByColor) {
      c.fillStyle = c.strokeStyle = color
      for (const t of tokensByColor[color]) {
        const tx = x + (t.col - startCol) * charWidth
        c.strokeText(t.text, tx, y)
        c.fillText(t.text, tx, y)
      }
    }
  }
}
