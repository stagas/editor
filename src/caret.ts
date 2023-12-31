// log.active
import $, { fn, fx, of, when } from 'signal'
import { Comp } from './comp.ts'
import { Editor } from './editor.ts'
import { Linecol } from './linecol.ts'
import { Point, Renderable } from 'std'

export class Caret extends Comp {
  constructor(
    public ctx: Editor,
    public linecol: $<Linecol>
  ) {
    super(ctx)
  }
  blink = false
  isBlinking = false
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
      @fx update_view_pos() {
        const { view: v } = of(this)
        const { charWidth, lineBaseTops } = of(dims)
        const { linecol } = of(it)
        const { line, col } = linecol
        const { [line]: y } = of(lineBaseTops)
        $()
        v.x = Math.floor(col * charWidth) - 7
        v.y = Math.floor(y + 1) - 8
      }
      @fx update_view_size() {
        const { pr, view: v } = of(this)
        const { blink } = of(it)
        const { mouseable: { isFocused } } = of(ctx)
        const { lineHeight, charWidth } = when(dims)
        $()
        const { hideWhenAway } = it
        const { mouseable: { isHovering } } = of(text)
        v.w = charWidth + 10
        v.h = lineHeight + 7
        $.flush()
        if (blink) {
          it.isBlinking = isFocused
        }
        this.isHidden = hideWhenAway ? !isHovering : false
        this.needRender = true
      }
      @fx hide_when_typing() {
        const { hideWhenTyping } = when(it)
        const { isTyping } = of(misc)
        $()
        this.isHidden = isTyping
      }
      @fx hide_when_away() {
        const { hideWhenAway } = when(it)
        const { mouseable: { isHovering } } = of(text)
        $()
        this.isHidden = !isHovering
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
            this.isHidden = !this.isHidden,
            blinkDelay
          )
        }, 1250)
        return () => {
          this.isHidden = false
          clearTimeout(st)
          clearInterval(iv)
        }
      }
      // @fx trigger_draw() {
      //   const { view: { x, y }, isHidden } = of(this)
      //   const { linecol } = of(it)
      //   const { charWidth } = of(dims)
      //   $()
      //   this.need |= Renderable.Need.Draw
      // }
      @fn draw(c: CanvasRenderingContext2D, { x, y }: Point) {
        const { view } = of(this)
        const { w, h } = view
        const { mouseable: { isFocused } } = of(ctx)
        const { color1, color2, color1Focused, color2Focused } = of(it)
        const c1 = isFocused ? color1Focused : color1
        const c2 = isFocused ? color2Focused : color2
        c.save()
        x += 8.5
        y += 4.5
        // c.translate(8.5, 5)
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
      }
    }
    return $(new CaretRenderable(it as Renderable.It))
  }
}
