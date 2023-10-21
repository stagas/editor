// log.active
import $, { fn, fx } from 'signal'
import { Comp } from './comp.ts'
import { Indicator } from './indicator.ts'
import { Renderable } from './renderable.ts'
import { Linecol } from './linecol.ts'

export class Caret extends Comp {
  linecol = this.ctx.buffer.linecol
  blink = false
  ind = $(new Indicator(this.ctx))
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
    const { ctx, ind } = $.of(it)
    const { misc, dims, text } = $.of(ctx)
    class CaretRenderable extends Renderable {
      @fx update_indicator_focused_color() {
        const {
          color1, color2,
          color1Focused, color2Focused,
        } = $.of(it)
        const { pointable: { isFocused } } = $.of(ctx)
        $()
        ind.color1 = isFocused ? color1Focused : color1
        ind.color2 = isFocused ? color2Focused : color2
      }
      @fx update_rect() {
        const { rect: r } = $.of(this)
        const { charWidth, lineBaseTops } = $.of(dims)
        const { linecol } = $.of(it)
        const { line, col } = linecol
        $()
        r.x = col * charWidth
        r.y = lineBaseTops[line]
      }
      @fx update_caret() {
        const { pr, rect: r } = $.of(this)
        const { blink, linecol } = $.of(it)
        const { pointable: { isFocused } } = $.of(ctx)
        const { lineHeight, charWidth } = $.of(dims)
        $()
        const { hideWhenAway } = it
        const { pointable: { isHovering } } = $.of(text)
        r.w = charWidth || 1
        r.h = lineHeight + 1
        ind.renderable.rect.w = r.w + 10
        ind.renderable.rect.h = r.h + 5.5
        $.flush()
        if (blink) {
          it.isBlinking = isFocused
        }
        it.isHidden = hideWhenAway ? !isHovering : false
        this.needRender = true
      }
      @fx hide_when_typing() {
        const { hideWhenTyping } = $.when(it)
        const { isTyping } = $.of(misc)
        $()
        it.isHidden = isTyping
      }
      @fx hide_when_away() {
        const { hideWhenAway } = $.when(it)
        const { pointable: { isHovering } } = $.of(text)
        $()
        it.isHidden = !isHovering
      }
      @fx start_blinking() {
        const { blink, isBlinking } = $.when(it)
        const { linecol: { line, col } } = $.of(it)
        const { blinkDelay } = $.of(dims)

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
        const { rect: { x, y } } = $.of(this)
        const { isHidden, linecol } = $.of(it)
        const { charWidth } = $.of(dims)
        $()
        this.needDraw = true
      }
      @fn render() {
        const { ind } = $.of(it)
        if (ind.renderable.needRender) {
          ind.renderable.render()
        }
        this.needRender = false
        this.needDraw = true
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { isHidden, linecol } = $.of(it)
        const { charWidth, lineBaseTops } = $.of(dims)
        const { line, col } = linecol
        if (!isHidden) {
          // log('lineCol', line, col)
          c.save()
          c.translate(
            Math.floor(col * charWidth),
            // TODO: this can be undefined, how to deal with these
            // lineDims getter
            Math.floor(lineBaseTops[line] + 1)
          )
          ind.renderable.draw(t, c)
          c.restore()
        }
        this.needDraw = false
      }
    }
    return $(new CaretRenderable(this.ctx))
  }
}
