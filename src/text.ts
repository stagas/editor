// log.active
import { $, fn, fx } from 'signal'
import { Rect } from 'std'
import { MouseButtons, prevent } from 'utils'
import { Comp } from './comp.ts'
import { Mouse } from './mouse.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './renderable.ts'
import { Scroll } from './scroll.ts'
import { SourceToken } from './source.ts'

export class Text extends Comp {
  get renderable(): $<Renderable> {
    $()
    const it = this
    const { ctx } = $.of(it)
    const { buffer, dims, skin } = $.of(ctx)

    class TextRenderable extends Renderable {
      get colors() {
        const op = 'red'
        const brace = 'yellow'
        const c = skin.colors
        return {
          Id: c.brightRed,
          Number: c.white,
          String: c.brightYellow,
          Comment: c.brightBlack,
          BlockComment: c.brightBlack,
          '[': brace,
          ']': brace,
          '{': brace,
          '}': brace,
          '(': brace,
          ')': brace,
          '+': op,
          '-': op,
          '*': op,
          '^': op,
          '%': op,
          '!': op,
          '/': op,
          'L': c.brightCyan,
          'R': c.brightCyan,
          'LR': c.brightCyan,
          '=': op,
          '+=': op,
          '*=': op,
          '-=': op,
          '/=': op,
          '%=': op,
          '^=': op,
          ':=': op,
          '\\': c.brightPurple,
          '@': c.brightPurple,
          '@~': c.brightPurple,
          ':': c.red,
          '.': c.red,
          ',': c.brightPurple,
          't': c.brightPurple,
          'M': c.brightRed,
          'S': c.brightCyan,
          'pick': c.brightPurple,
          'floor': c.brightPurple,
          'slide': c.brightPurple,
          'to_audio': c.brightPurple,
        }
      }
      // TODO: where is this used??
      viewRect = $(new Rect)
      canDirectDraw = true
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
        const { rect, colors } = $.of(this)
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

            c.fillStyle
              = c.strokeStyle
              = colors?.[t.text]
              ?? colors?.[Token.Type[t.type]]
              ?? '#fff'

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
    const it = this
    const { ctx } = $.of(it)
    const { world, misc, buffer, scroll, selection,
      input: { textarea, mouse } } = $.of(ctx)
    const { linecol } = $.of(mouse)
    const { pointer } = $.of(world)
    const { wheel } = pointer
    const { Wheel, Down, Up, Leave, Move, Menu, Click } = Mouse.EventKind

    class TextPointable extends Pointable {
      cursor = 'text'
      hitArea = it.renderable.rect
      @fn onMouseEvent(kind: Mouse.EventKind) {
        const { mouse: { pos, btns }, isDown } = this

        if (kind !== Wheel) {
          buffer.getLineColFromPoint(pos, true, linecol)
        }

        misc.isTyping = false

        switch (kind) {
          case Click:
          case Up:
            textarea.focus()
            return true

          case Wheel:
            scroll.targetScroll.mulSub(wheel, 0.2)
            scroll.animSettings = Scroll.AnimSettings.Medium
            return true

          case Move:
            if (isDown && (btns & MouseButtons.Left)) {
              selection.end.set(linecol)
              buffer.linecol.set(linecol)
              buffer.coli = linecol.col
            }
            return true

          case Down:
            const { real } = $.of(pointer)
            const { shift } = pointer

            if (!(btns & MouseButtons.Left)) return

            prevent(real)

            const { downCount } = this

            buffer.linecol.set(linecol)
            buffer.coli = linecol.col

            switch (downCount) {
              case 1:
                if (shift) {
                  selection.end.set(linecol)
                }
                else {
                  selection.resetTo(linecol)
                }
                break

              case 2:
                if (selection.selectWordBoundary(linecol, shift)) {
                  mouse.downCount = 2
                  break
                }
              case 3:
                if (selection.selectMatchingBrackets(linecol)) {
                  mouse.downCount = 3
                  break
                }
              case 4:
                selection.selectLine(linecol.line)
                break
            }
            return true
        }
      }
    }

    return $(new TextPointable(this))
  }
}
