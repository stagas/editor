log.active
import { $, fn, fx } from 'signal'
import { Render } from './render.ts'
import { AnimScrollStrategy } from './scroll.ts'

const dimOpp = {
  x: 'y',
  y: 'x',
} as const

const sides = {
  x: 'w',
  y: 'h',
} as const

const sidesOpp = {
  x: 'h',
  y: 'w',
} as const

class Scrollbar extends Render {
  canFocus = false
  dim?: 'x' | 'y'
  scrollBegin = 0
  pointerBegin = 0

  // isReady: rect.hasSize || void 0
  // .local($ => class {
  // onWheel = (e: WheelEvent) => {
  //   $.target.onWheel!(e)
  // }
  @fn onPointerDown() {
    const { world: { pointer: p }, dim, ctx: sa } = $.of(this)
    this.scrollBegin = sa.scroll[dim]
    this.pointerBegin = p.pos[dim]
  }
  @fn onHoldMove() {
    const { world: { pointer: p }, dim, ctx } = $.of(this)
    const { dims, scroll } = $.of(ctx)
    const { rect, innerSize } = $.of(dims)
    const side = sides[dim]
    scroll.pos[dim] = 1
    // const co = rect[side] / innerSize[side]
    // scroll.pos[dim] =
    //   scroll.targetScroll[dim] =
    //   this.scrollBegin
    //   - (p.pos[dim] - this.pointerBegin) / co

    scroll.animScrollStrategy = AnimScrollStrategy.Fast
    this.needUpdate = true
  }
  // })
  @fx update_scrollbar() {
    const { dim, ctx, rect: r } = $.of(this)
    const { dims, scroll } = $.of(ctx)
    const { scrollSize } = $.of(scroll)
    const { rect, scrollbarSize } = $.of(dims)

    const s = sides[dim]
    const so = sidesOpp[dim]
    const co = rect[s] / scrollSize[s]
    const x = -scroll[dim] * co
    const w = rect[s] * co
    const y = rect[so] - scrollbarSize[so]
    $._()
    if (this.isVisible = co < 1) {
      r[dim] = x
      r[dimOpp[dim]] = y
    }
    r[s] = w
    r[so] = scrollbarSize[so]
  }

  initCanvas() { }
  update() { return 0 }
  updateOne() { return 0 }
  @fn render() {
    const { canvas, pr, rect, isHovering, ctx } = $.of(this)
    const { c } = $.of(canvas)
    const { skin } = $.of(ctx)
    const alpha = '66'
    c.restore()
    c.save()
    c.scale(pr, pr)
    c.clearRect(0, 0, rect.w, rect.h)
    c.fillStyle =
      (isHovering
        ? skin.colors.bgBright2
        : skin.colors.bgBright1) + alpha
    c.fillRect(0, 0, rect.w, rect.h)

    c.beginPath()
    c.moveTo(0, rect.h)
    c.lineTo(rect.w, rect.h)
    c.lineTo(rect.w, 0)
    c.lineWidth = 3
    c.strokeStyle = skin.colors.bgBright015 //+ alpha
    c.stroke()

    c.beginPath()
    c.moveTo(0, rect.h)
    c.lineTo(0, 0)
    c.lineTo(rect.w, 0)
    c.lineWidth = 3
    c.strokeStyle = skin.colors.bgBright25 + alpha
    c.stroke()

    c.restore()

    $.needRender = false
    $.needDraw = true
  }
  @fn draw(c: CanvasRenderingContext2D) {
    const { pr, canvas, rect } = this
    rect.drawImage(c, canvas, pr, true)
    $.needDraw = false
  }
  @fx trigger_needRender() {
    const { isReady, rect: { w, h }, isHovering } = this
    $.done()
    $.needRender = true
  }
  @fx trigger_needDraw() {
    const { isReady, rect: { x, y } } = this
    $.done()
    $.needDraw = true
  }
}

// export type Scrollbars = typeof Scrollbars.type
// export const Scrollbars = Fx.tag('scrollbars')
//   .mix(Sceneable)
//   .mix(Renderable)
//   .mix(Pointable, {
//     isPointerTarget: false
//   })
//   .props<{
//     target: ScrollingArea
//   }>()
//   .from('target').pick([
//     'rect',
//     'scroll',
//     'scrollSize',
//     'scrollbarSize',
//   ])
//   .computed(({ $, target, scene }) => ({
//     scrollbarY: Scrollbar({ dim: 'y', scene, target }),
//     scrollbarX: Scrollbar({ dim: 'x', scene, target }),
//   }))
//   .computed(({ scrollbarX, scrollbarY }) => ({
//     sceneItems: [scrollbarX, scrollbarY],
//     pointerItems: [scrollbarX, scrollbarY],
//   }))
//   .local($ => class {
//     draw = $.fn((
//       { sceneItems },
//       c: CanvasRenderingContext2D) => {
//       for (const item of sceneItems) {
//         if (item.needRender) {
//           item.render()
//           item.draw(c)
//         }
//         else if (item.isVisible) {
//           item.draw(c)
//         }
//       }
//       $.needRender
//         = $.needDraw
//         = false
//     })
//   })
