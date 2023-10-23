// log.active
import $, { fn, fx, of, when } from 'signal'
import { Rect } from 'std'
import { Comp } from './comp.ts'
import { Editor } from './editor.ts'
import { Indicator } from './indicator.ts'
import { Linecol } from './linecol.ts'
import { Renderable } from './renderable.ts'

export class Caret extends Comp {
  constructor(
    public ctx: Editor,
    public linecol: $<Linecol>
  ) {
    super(ctx)
  }
  blink = false
  // get ind() { return $(new Indicator(this.ctx)) }
  isBlinking = false
  isHidden = false
  hideWhenTyping = false
  hideWhenAway = false
  color1 = '#727'
  color2 = '#555'
  color1Focused = '#f0f'
  color2Focused = '#fff'
  caretColor = '#fff'

  get renderable() {
    $()
    const it = this
    const { ctx } = of(it)
    const { misc, dims, text } = of(ctx)
    class CaretRenderable extends Renderable {
      dirtyRects = [$(new Rect)]
      @fx update_rect() {
        const { rect: r } = of(this)
        const { charWidth, lineBaseTops } = of(dims)
        const { linecol } = of(it)
        const { line, col } = linecol
        const { [line]: y } = of(lineBaseTops)
        $()
        r.x = Math.floor(col * charWidth) - 7
        r.y = Math.floor(y + 1) - 5.5
      }
      @fx update_caret() {
        const { pr, rect: r } = of(this)
        const { blink } = of(it)
        const { pointable: { isFocused } } = of(ctx)
        const { lineHeight, charWidth } = when(dims)
        $()
        const { hideWhenAway } = it
        const { pointable: { isHovering } } = of(text)
        r.w = charWidth + 10
        r.h = lineHeight + 6.5
        $.flush()
        if (blink) {
          it.isBlinking = isFocused
        }
        it.isHidden = hideWhenAway ? !isHovering : false
        this.needRender = true
      }
      @fx hide_when_typing() {
        const { hideWhenTyping } = when(it)
        const { isTyping } = of(misc)
        $()
        it.isHidden = isTyping
      }
      @fx hide_when_away() {
        const { hideWhenAway } = when(it)
        const { pointable: { isHovering } } = of(text)
        $()
        it.isHidden = !isHovering
      }
      @fx start_blinking() {
        const { blink, isBlinking } = when(it)
        const { linecol: { line, col } } = of(it)
        const { blinkDelay } = of(dims)

        let iv: any
        // TODO: better debounce here so we don't create/dispose tons of setTimeouts
        // TODO: we need a better setTimeout
        const st = setTimeout(() => {
          iv = setInterval(() =>
            it.isHidden = !it.isHidden,
            blinkDelay
          )
        }, 1250)
        return () => {
          it.isHidden = false
          clearTimeout(st)
          clearInterval(iv)
        }
      }
      @fx trigger_draw() {
        const { rect: { x, y } } = of(this)
        const { isHidden, linecol } = of(it)
        const { charWidth } = of(dims)
        $()
        this.needDraw = true
      }
      @fn render() {
        const { canvas, rect } = of(this)
        const { c } = of(canvas)
        const { w, h } = rect
        const { pointable: { isFocused } } = of(ctx)
        const { color1, color2, color1Focused, color2Focused } = of(it)
        const c1 = isFocused ? color1Focused : color1
        const c2 = isFocused ? color2Focused : color2
        const x = 0
        const y = 0
        c.save()
        c.translate(8.5, 5)
        c.fillStyle = c1
        c.beginPath()
        const a = 2.5
        c.moveTo(x, y + a)
        c.lineTo(x - w, y - w)
        c.lineTo(x + w, y - w)
        c.lineTo(x, y + a)
        c.fill()
        c.beginPath()
        c.moveTo(x + .5, y + a)
        c.lineTo(x + .5, y + h)
        c.lineTo(x - .5, y + h)
        c.lineTo(x - .5, y + a)
        c.fillStyle = c2
        c.fill()
        c.restore()

        this.needRender = false
        this.needDraw = true
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { pr, canvas, rect, dirtyRects: [dr] } = of(this)
        const { isHidden } = of(it)

        if (!isHidden) {
          rect.drawImage(canvas.el, c, pr, true)
          dr.set(rect)
        }

        this.needDraw = false
      }
    }
    return $(new CaretRenderable(this.ctx))
  }
}
