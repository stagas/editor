log.active
import { fn } from 'signal'
import { Render } from './render.ts'

// type Target = Misc & Buffer & Renderable

export class Caret extends Render {
  pos = this.ctx.buffer.$.lineCol

  blink?= false
  hideWhenTyping?= false
  hideWhenAway?= true
  color1?= '#727'
  color2?= '#555'
  color1Focused?= '#f0f'
  color2Focused?= '#fff'
  caretColor?= '#fff'

  @fn initCanvas() {

  }
  @fn render() {

  }
  @fn draw() {

  }
}
  // .props<{
  //   pos: Point
  //   target: Target
  // }>()
  // .props(class {
  //   blink?= false
  //   hideWhenTyping?= false
  //   hideWhenAway?= true
  //   color1?= '#727'
  //   color2?= '#555'
  //   color1Focused?= '#f0f'
  //   color2Focused?= '#fff'
  //   caretColor?= '#fff'
  // })
  // .local($ => class {
  //   ind = Indicator({
  //     renderParent: $
  //   })
  //   isBlinking = false
  //   isHidden = false
  // })
  // .local(class {
  //   rect = Rect()
  // })
  // .fx.auto((
  //   { $,
  //     ind,
  //     color1, color2,
  //     color1Focused, color2Focused,
  //     target: { isFocused }
  //   }) => {
  //   $.done()
  //   //!: upd indicator focused color
  //   ind.color1 = isFocused ? color1Focused : color1
  //   ind.color2 = isFocused ? color2Focused : color2
  // })
  // .fx.auto(({ $, rect: r, pos, target }) => {
  //   const { charWidth, lineBaseTops } = target
  //   const { line, col } = pos
  //   $.done()
  //   if (!charWidth) return
  //   r.x = col * charWidth!
  //   r.y = lineBaseTops[line]
  // })
  // .fx.auto(({ $, rect: r, target, ind, blink }) => {
  //   //!: update caret
  //   const { isFocused, lineHeight, charWidth } = target
  //   $.done()
  //   r.w = charWidth || 1
  //   r.h = lineHeight + 1
  //   ind.rect.w = r.w + 10
  //   ind.rect.h = r.h + 5.5
  //   $.flush()
  //   if (blink) {
  //     $.isBlinking = isFocused
  //   }
  //   $.isHidden = false
  //   $.needRender = true
  // })
  // .fx(({ $, hideWhenTyping }) => {
  //   if (hideWhenTyping) {
  //     return $.fx.auto(({ $, target: { isTyping } }) => {
  //       $.done()
  //       $.isHidden = isTyping
  //     })
  //   }
  // })
  // .fx(({ $, hideWhenAway }) => {
  //   if (hideWhenAway) {
  //     return $.fx.auto(({ $, target: { isHovering } }) => {
  //       $.done()
  //       $.isHidden = !isHovering
  //     })
  //   }
  // })
  // .fx(({ $, blink }) => {
  //   if (blink) {
  //     return $.fx.auto((
  //       { $, isBlinking,
  //         pos: { line, col },
  //         target: { blinkDelay } }) => {
  //       $.done()
  //       $.isHidden = false
  //       if (isBlinking) {
  //         let iv: any
  //         // TODO: better debounce here so we don't create/dispose tons of setTimeouts
  //         const st = setTimeout(() => {
  //           iv = setInterval($.toggle('isHidden'), blinkDelay)
  //         }, 1250)
  //         return () => {
  //           clearTimeout(st)
  //           clearInterval(iv)
  //         }
  //       }
  //     })
  //   }
  // })
  // .fx(({ $, isHidden }) => {
  //   $.needDraw = true
  // })
  // .local($ => class implements RenderMethods {
  //   render = $.fn(({ ind }) => {
  //     //!: render
  //     if (ind.needRender) {
  //       ind.render()
  //     }
  //     $.needRender = false
  //     $.needDraw = true
  //   })
  //   draw = $.fn((
  //     { ind, pos, target, isHidden },
  //     c: CanvasRenderingContext2D) => {
  //     //!: draw
  //     const { charWidth, lineBaseTops } = target
  //     const { line, col } = pos

  //     if (!isHidden) {
  //       log('lineCol', line, col)
  //       c.save()
  //       c.translate(
  //         Math.floor(col * charWidth!),
  //         Math.floor(lineBaseTops[line] + 1)
  //       )
  //       ind.draw(c)
  //       c.restore()
  //     }

  //     $.needDraw = false
  //   })
  // })
