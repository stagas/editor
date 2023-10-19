log.active
import { $, fn, fx } from 'signal'
import { Rect } from 'std'
import { Editor } from './editor.ts'
import { Render } from './render.ts'
import { SourceToken } from './source.ts'

export class Text extends Render {
  constructor(public ctx: Editor) {
    super(ctx, ctx.rect)
  }

  didInitCanvas = false

  // TODO: where is this used??
  viewRect = $(new Rect)

  @fx measure_charWidth() {
    const { didInitCanvas } = $.when(this)
    const { canvas, ctx } = $.of(this)
    const { dims } = $.of(ctx)
    const { c } = $.of(canvas)
    const em = c.measureText('M')
    dims.charWidth = em.width
    console.log('read')
  }

  @fx trigger_render() {
    const { ctx, pr, rect } = this
    const { size: { wh: size_wh } } = rect
    const { buffer, dims } = $.of(ctx)
    const {
      fontSize,
      lineBaseBottoms,
      lineHeight,
      charWidth,
      viewSpan,
      innerSize: { wh },
      scroll: { xy },
    } = $.of(dims)
    const { source, tokens, Token } = $.of(buffer)
    $.untrack()
    this.viewRect.setSize(wh)

    this.needRender = true
  }

  @fn initCanvas(c: CanvasRenderingContext2D) {
    const { dims, skin } = $.of(this.ctx)

    c.imageSmoothingEnabled = false
    c.miterLimit = 3
    c.lineJoin = 'round'
    c.lineCap = 'round'

    c.font = `100 ${dims.fontSize}px ${skin.fonts.mono}`
    c.textAlign = 'left'
    c.textBaseline = 'bottom'
    c.lineWidth = dims.fontSize / 100

    this.needInit = false
    this.didInitCanvas = true
  }
  update(dt: number) { return 0}
  updateOne(dt: number) { return 0}
  @fn render(t: number, c: CanvasRenderingContext2D, clear: boolean) {
    const { canvas, rect, ctx } = $.of(this)
    const { buffer, dims, colors, skin } = $.of(ctx)
    const { lineBaseBottoms, charWidth, viewSpan, scroll } = $.of(dims)
    const { tokens, Token } = $.of(buffer)

    // log('tokens', tokens)
    if (clear) {
      rect.clear(c)
    }

    c.save()
    c.translate(scroll.x, scroll.y)
    for (let i = 0, t: SourceToken, x: number, y: number; i < tokens!.length; i++) {
      t = tokens![i]

      if (!t.type || !t.text) continue

      y = lineBaseBottoms[t.line]

      if (y > viewSpan.top && y < viewSpan.bottom) {
        x = t.col * charWidth + 1

        // const color = (
        //   colors?.[t.text]
        //   ?? colors?.[Token.Type[t.type]]
        // ) as keyof typeof skin.colors

        c.fillStyle
          = c.strokeStyle
          = '#fff'
        // = skin.colors[color] ?? '#fff'

        c.strokeText(t.text, x, y)
        c.fillText(t.text, x, y)
      }
    }
    c.restore()

    this.needRender = false
    this.needDraw = true
  }

  @fn draw(t: number, c: CanvasRenderingContext2D) {
    const { pr, canvas, rect } = $.of(this)
    rect.drawImage(canvas.el, c, pr, true)

    this.needDraw = false
  }
}
