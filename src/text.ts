import { $, fn, fx, init } from 'signal'
import { Point, Rect, Scene } from 'std'
import { arraysEqual } from 'utils'
import { Dims } from './dims.ts'
import { Context } from './context.ts'

class RenderScene extends Scene {
  pr = this.world.screen.$.pr
  rect = $(new Rect)
  needRender?: boolean
}

export class TextScene extends RenderScene {
  viewRect = $(new Rect)

  constructor(public ctx: Context) { super(ctx.world) }

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
    const { dims } = $.of(ctx)
    const {
      fontSize,
      lineBaseBottoms,
      lineHeight,
      charWidth,
      viewSpan,
      innerSize,
    } = $.of(dims)
    // TODO: scrollable? tokens?
    // scroll: { x, y },
    //   tokens,
    $.untrack()
    this.viewRect.setSize(innerSize)
    this.needRender = true
  }
}
  // .props<{ target: Target }>()
  // .mix(Renderable)
  // .mix(Canvasable, $ => ({
  //   rect: Rect(),
  //   resizeToWindow: true,
  //   initCanvas: $.fn(function slider_initCanvas(
  //     { pr, target: t },
  //     c: CanvasRenderingContext2D) {
  //     c.imageSmoothingEnabled = false
  //     c.miterLimit = 3
  //     c.lineJoin = 'round'
  //     c.lineCap = 'round'

  //     c.font = `100 ${t.fontSize}px ${skin.fonts.mono}`
  //     c.textAlign = 'left'
  //     c.textBaseline = 'bottom'
  //     c.lineWidth = t.fontSize / 100

  //     const dims = c.measureText('M')
  //     t.charWidth = dims.width
  //   })
  // }))
  // .local({ colors })
  // .local(class {
  //   viewRect = Rect()
  // })
  // .fx.auto(({ $, target }) => {
  //   const {
  //     fontSize,
  //     lineBaseBottoms,
  //     lineHeight,
  //     charWidth,
  //     viewSpan,
  //     innerSize,
  //     scroll: { x, y },
  //     tokens,
  //   } = target
  //   $.done()
  //   $.viewRect.setSize(innerSize)
  //   $.needRender = true
  //   //!: trigger render
  // })
  // .local($ => class implements RenderMethods {
  //   render = $.fn((
  //     { c, pr, rect, target },
  //     oc?: CanvasRenderingContext2D
  //   ) => {
  //     //!: render
  //     const {
  //       lineBaseBottoms,
  //       charWidth,
  //       viewSpan,
  //       scroll,
  //       tokens,
  //     } = target

  //     if (oc) {
  //       c = oc
  //     }
  //     else {
  //       rect.clear(c)
  //     }
  //     c.save()
  //     c.translate(scroll.x, scroll.y)
  //     for (let i = 0, t: SyntaxToken, x: number, y: number; i < tokens!.length; i++) {
  //       t = tokens![i]

  //       if (!t.type || !t.text) continue

  //       y = lineBaseBottoms[t.line]

  //       if (y > viewSpan.top && y < viewSpan.bottom) {
  //         x = t.col * charWidth + 1

  //         const color = (
  //           $.colors[t.text]
  //           ?? $.colors[Token.Type[t.type]]
  //         ) as keyof typeof skin.colors

  //         c.fillStyle
  //           = c.strokeStyle
  //           = skin.colors[color] ?? '#fff'

  //         c.fillText(t.text, x, y)
  //         c.strokeText(t.text, x, y)
  //       }
  //     }
  //     c.restore()

  //     $.needRender = false
  //     $.needDraw = true
  //   })
  //   draw = $.fn((
  //     { pr, rect, canvas, target: t },
  //     c: CanvasRenderingContext2D) => {
  //     rect.drawImage(c, canvas, pr, true)
  //     $.needDraw = false
  //   })
  // })
