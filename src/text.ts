// log.active
import { $, fn, fx } from 'signal'
import { Rect } from 'std'
import { prevent } from 'utils'
import { Comp } from './comp.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './render.ts'
import { Scroll } from './scroll.ts'
import { SourceToken } from './source.ts'

export class Text extends Comp {
  get renderable(): $<Renderable> {
    $()
    const it = this
    const { ctx } = $.of(this)
    const { buffer, dims, skin } = $.of(ctx)

    class TextRenderable extends Renderable {
      // TODO: where is this used??
      viewRect = $(new Rect)
      didInitCanvas = false
      @fx measure_charWidth() {
        const { didInitCanvas } = $.when(this)
        const { canvas } = $.of(this)
        const { c } = $.of(canvas)
        const em = c.measureText('M')
        dims.charWidth = em.width
      }
      @fx trigger_render() {
        const { pr, rect } = this
        const { size: { wh: size_wh } } = rect
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
        $()
        this.viewRect.setSize(wh)

        this.needRender = true
      }
      @fn initCanvas(c: CanvasRenderingContext2D) {
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
      @fn render(t: number, c: CanvasRenderingContext2D, clear: boolean) {
        const { canvas, rect } = $.of(this)
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
    return $(new TextRenderable(this.ctx, this.ctx.renderable.rect))
  }

  get pointable(): $<Pointable> {
    $()
    const { ctx } = $.of(this)
    const { world, buffer, scroll, selection,
      input: { textarea, mouse } } = $.of(ctx)
    const { lineCol } = $.of(mouse)
    const { pointer } = $.of(world)
    const { wheel } = pointer
    const it = this

    class TextPointable extends Pointable {
      cursor = 'text'
      hitArea = it.renderable.rect
      @fn onClick() {
        textarea.focus()
      }
      @fn onUp() {
        textarea.focus()
      }
      @fn onWheel() {
        scroll.targetScroll.mulSub(wheel, 0.2)
        scroll.animSettings = Scroll.AnimSettings.Medium
      }
      @fn onMove() {
        if (it.renderable.isDown) {
          selection.end.set(lineCol)
          buffer.lineCol.set(lineCol)
          buffer.coli = lineCol.col
        }
      }
      @fn onDown(downCount: number) {
        const { real } = $.of(pointer)
        const { shift } = pointer

        prevent(real)

        buffer.lineCol.set(lineCol)
        buffer.coli = lineCol.col

        switch (downCount) {
          case 1:
            if (shift) {
              selection.end.set(lineCol)
            }
            else {
              selection.resetTo(lineCol)
            }
            break

          case 2:
            if (selection.selectWordBoundary(lineCol, shift)) {
              mouse.downCount = 2
              break
            }
          case 3:
            if (selection.selectMatchingBrackets(lineCol)) {
              mouse.downCount = 3
              break
            }
          case 4:
            selection.selectLine(lineCol.line)
            break
        }
      }
    }

    return $(new TextPointable(this))
  }
}
