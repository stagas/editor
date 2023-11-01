log.active
import { $, fn, fx, of, when } from 'signal'
import { Keyboard, Keyboardable, Mouse, Mouseable, Point, Renderable } from 'std'
import { MouseButtons, prevent } from 'utils'
import { Comp } from './comp.ts'
import { Linecol } from './linecol.ts'
import { Scroll } from './scroll.ts'
import { SourceToken } from './source.ts'

export class Text extends Comp
  implements Keyboardable.It, Mouseable.It, Renderable.It {
  linecol = $(new Linecol)
  get keyboardable() {
    $()
    const it = this
    const { Down, Up, Copy, Cut, Paste } = Keyboard.EventKind
    const { Char, Special } = Keyboard.KeyKind
    class TextKeyboardable extends Keyboardable {
      onKeyboardEvent(kind: Keyboard.EventKind): string | true | void | undefined {
        const { key, char, special, alt, ctrl, shift } = this.kbd
        switch (kind) {
          case Down:
            break
          case Up:
            break
          case Copy:
            break
          case Cut:
            break
          case Paste:
            break
        }
      }
    }
    return $(new TextKeyboardable(it as Keyboardable.It))
  }
  get mouseable(): Mouseable {
    $()
    const it = this
    const { ctx, linecol } = of(it)
    const { misc, buffer, scroll, selection, keyboard } = of(ctx)
    const { Wheel, Down, Up, Move, Click } = Mouse.EventKind

    class TextMouseable extends Mouseable {
      cursor = 'text'
      @fn onMouseEvent(kind: Mouse.EventKind) {
        const { mouse, isDown } = this

        if (kind !== Wheel) {
          buffer.getLineColFromPoint(
            mouse.pos,
            true,
            linecol
          )
        }

        misc.isTyping = false

        switch (kind) {
          case Click:
          case Up:
            keyboard.textarea.focus()
            return true

          case Wheel:
            scroll.targetScroll.mulSub(mouse.wheel, 0.28)
            scroll.animSettings = Scroll.AnimSettings.Medium
            return true

          case Move:
            if (isDown && (mouse.buttons & MouseButtons.Left)) {
              selection.end.set(linecol)
              buffer.linecol.set(linecol)
              buffer.coli = linecol.col
            }
            return true

          case Down:
            if (!(mouse.buttons & MouseButtons.Left)) return

            prevent(of(mouse).real)

            const { downCount } = mouse

            buffer.linecol.set(linecol)
            buffer.coli = linecol.col

            switch (downCount) {
              case 1:
                if (mouse.shift) {
                  selection.end.set(linecol)
                }
                else {
                  selection.resetTo(linecol)
                }
                break

              case 2:
                if (selection.selectWordBoundary(linecol, mouse.shift)) {
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
    return $(new TextMouseable(it as Mouseable.It))
  }
  get renderable() {
    $()
    const it = this
    const { ctx } = of(it)
    const { buffer, dims, skin, scroll } = of(ctx)
    const { visibleSpan } = dims
    const { Token } = buffer
    class TextRenderable extends Renderable {
      canDirectDraw = true
      didInitCanvas = false
      get colors(): Record<string, string> {
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
      @fx measure_charWidth() {
        const { didInitCanvas } = when(this)
        const { canvas } = of(this)
        const { c } = of(canvas)
        const em = c.measureText('M')
        dims.charWidth = em.width
      }
      @fx trigger_render_when_scroll() {
        const { charWidth, scroll: { x, y } } = of(dims)
        $()
        this.need |= Renderable.Need.Render
      }
      @fx trigger_render_when_misc() {
        const { pr, rect } = this
        const { size: { wh: size_wh } } = rect
        const {
          fontSize,
          lineBaseBottoms,
          lineHeight,
          charWidth,
          innerSize: { wh },
        } = of(dims)
        const { source, tokens, Token } = of(buffer)
        $()
        // this.viewRect.setSize(wh)
        this.need |= Renderable.Need.Render
      }
      get font() {
        return `100 ${dims.fontSize}px ${skin.fonts.mono}`
      }
      get lineWidth() {
        return dims.fontSize / 100
      }
      @fn init(c: CanvasRenderingContext2D) {
        c.imageSmoothingEnabled = false
        c.miterLimit = 3
        c.lineJoin = 'round'
        c.lineCap = 'round'
        c.textAlign = 'left'
        c.textBaseline = 'bottom'
        c.font = this.font
        c.lineWidth = this.lineWidth
        this.need ^= Renderable.Need.Init
        this.didInitCanvas = true
      }
      @fn render(c: CanvasRenderingContext2D, t: number, clear: boolean) {
        const { rect, colors } = this
        const { charWidth } = of(dims)
        const { lineBaseBottoms } = dims
        const { tokens } = buffer

        // log('tokens', tokens)
        if (clear) {
          rect.clear(c)
        }

        c.save()
        c.translate(Math.round(scroll.x), Math.round(scroll.y))
        for (let i = 0, t: SourceToken, x: number, y: number; i < tokens!.length; i++) {
          t = tokens![i]

          if (!t.type || !t.text) continue

          y = lineBaseBottoms[t.line]

          if (y > visibleSpan.top && y < visibleSpan.bottom) {
            x = t.col * charWidth + 1

            c.fillStyle
              = c.strokeStyle
              =
              // colors?.[t.text]
              // ??
              colors?.[Token.Type[t.type]]
              ?? '#fff'

            c.strokeText(t.text, x, y)
            c.fillText(t.text, x, y)
          }
        }
        c.restore()

        this.need ^= Renderable.Need.Render
        this.need |= Renderable.Need.Draw
      }
      @fn draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
        const { pr, canvas, rect } = of(this)
        rect.round().drawImageTranslated(
          canvas.el,
          c,
          pr,
          true,
          scroll
        )
        this.need ^= Renderable.Need.Draw
      }
    }
    return $(new TextRenderable(
      it as Renderable.It,
      it.ctx.renderable.rect
    ))
  }
}
