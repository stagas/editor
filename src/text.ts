log.active
import { $, fn, fx } from 'signal'
import { Rect } from 'std'
import { Context } from './context.ts'
import { SourceToken } from './source.ts'
import { RenderScene } from './render-scene.ts'

export class TextScene extends RenderScene {
  constructor(public ctx: Context) { super(ctx.world) }

  // TODO: where is this used??
  viewRect = $(new Rect)

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

    const em = c.measureText('M')
    dims.charWidth = em.width
  }

  @fx triggerRender() {
    const { ctx } = this
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
    const { tokens, Token } = $.of(buffer)
    $.untrack()
    this.viewRect.setSize(wh)
    this.needRender = true
  }

  render(oc?: CanvasRenderingContext2D) {
    //!: render
    const { canvas, rect, ctx } = $.of(this)
    const { buffer, dims, colors, skin } = $.of(ctx)
    const { lineBaseBottoms, charWidth, viewSpan, scroll } = $.of(dims)
    const { tokens, Token } = $.of(buffer)

    const c = oc ?? canvas.c

    if (!oc) {
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

        const color = (
          colors[t.text]
          ?? colors[Token.Type[t.type]]
        ) as keyof typeof skin.colors

        c.fillStyle
          = c.strokeStyle
          = skin.colors[color] ?? '#fff'

        c.fillText(t.text, x, y)
        c.strokeText(t.text, x, y)
      }
    }
    c.restore()

    this.needRender = false
    this.needDraw = true
  }

  draw(c: CanvasRenderingContext2D) {
    //!: draw
    const { pr, canvas, rect } = $.of(this)
    rect.drawImage(canvas.el, c, pr, true)
    this.needDraw = false
  }
}
