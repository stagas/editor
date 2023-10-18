log.active
import $, { fn, fx } from 'signal'
import { Render } from './render.ts'
import { Indicator } from './indicator.ts'

export class Caret extends Render {
  pos = this.ctx.buffer.$.lineCol
  ind = $(new Indicator(this.ctx))
  blink?= false
  isBlinking = false
  isHidden = false
  hideWhenTyping?= false
  hideWhenAway?= true
  color1?= '#727'
  color2?= '#555'
  color1Focused?= '#f0f'
  color2Focused?= '#fff'
  caretColor?= '#fff'

  @fx update_indicator_focused_color() {
    const {
      ind,
      color1, color2,
      color1Focused, color2Focused,
      ctx,
    } = $.of(this)
    const { isFocused } = $.of(ctx)
    $.untrack()
    ind.color1 = isFocused ? color1Focused : color1
    ind.color2 = isFocused ? color2Focused : color2
  }
  @fx update_rect() {
    const { rect: r, pos, ctx } = $.of(this)
    const { dims } = $.of(ctx)
    const { charWidth, lineBaseTops } = $.of(dims)
    const { line, col } = pos
    $.untrack()
    if (!charWidth) return
    r.x = col * charWidth!
    r.y = lineBaseTops[line]
  }
  @fx update_caret() {
    const { rect: r, ctx, ind, blink } = $.of(this)
    const { isFocused, dims } = $.of(ctx)
    const { lineHeight, charWidth } = $.of(dims)
    $.untrack()
    r.w = charWidth || 1
    r.h = lineHeight + 1
    ind.rect.w = r.w + 10
    ind.rect.h = r.h + 5.5
    $.flush()
    if (blink) {
      this.isBlinking = isFocused
    }
    this.isHidden = false
    this.needRender = true
  }
  @fx hide_when_typing() {
    const { hideWhenTyping, ctx } = $.when(this)
    const { misc: { isTyping } } = $.of(ctx)
    $.untrack()
    this.isHidden = isTyping
  }
  @fx hide_when_away() {
    const { hideWhenAway, ctx } = $.when(this)
    const { isHovering } = $.of(ctx)
    $.untrack()
    this.isHidden = !isHovering
  }
  @fx start_blinking() {
    const { blink, isBlinking, ctx, pos: { line, col } } = $.when(this)
    const { dims } = $.of(ctx)
    const { blinkDelay } = $.of(dims)

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
      clearTimeout(st)
      clearInterval(iv)
    }
  }
  @fx trigger_draw() {
    const { isHidden } = $.of(this)
    $.untrack()
    this.needDraw = true
  }
  @fn initCanvas() {

  }
  @fn render() {
    const { ind } = $.of(this)
    if (ind.needRender) {
      ind.render()
    }
    this.needRender = false
    this.needDraw = true
  }
  @fn draw(c: CanvasRenderingContext2D) {
    const { ind, pos, ctx, isHidden } = $.of(this)
    const { dims } = $.of(ctx)
    const { charWidth, lineBaseTops } = $.of(dims)
    const { line, col } = pos

    if (!isHidden) {
      log('lineCol', line, col)
      c.save()
      c.translate(
        Math.floor(col * charWidth!),
        Math.floor(lineBaseTops[line] + 1)
      )
      ind.draw(c)
      c.restore()
    }

    this.needDraw = false
  }
}
