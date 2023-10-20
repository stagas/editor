// log.active
import { $, fn, fx } from 'signal'
import { MouseButtons } from 'utils'
import { Comp } from './comp.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './renderable.ts'
import { Scroll } from './scroll.ts'

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

type Dim = 'x' | 'y'

export class Scrollbar extends Comp {
  dim?: Dim
  scrollBegin = 0
  pointerBegin = 0
  @fx update_scrollbar() {
    const { renderable, dim, ctx } = $.of(this)
    const { dims, scroll } = $.of(ctx)
    const { scrollSize, targetScroll } = $.of(scroll)
    const { hasSize } = $.when(scrollSize)
    const { rect: r } = $.of(renderable)
    const { rect, scrollbarSize } = $.of(dims)

    const s = sides[dim]
    const so = sidesOpp[dim]
    const co = rect[s] / scrollSize[s]
    const x = -targetScroll[dim] * co
    const w = rect[s] * co
    const y = rect[so] - scrollbarSize[so]
    $()
    if (renderable.isVisible = co < 1) {
      r[dim] = x
      r[dimOpp[dim]] = y
    }
    r[s] = w
    r[so] = scrollbarSize[so]
  }
  get renderable() {
    $()
    const it = this
    const { ctx } = $.of(it)
    const { skin } = $.of(ctx)
    class ScrollbarRenderable extends Renderable {
      @fx trigger_needRender() {
        const { rect, pr } = $.of(this)
        const { hasSize } = $.when(rect)
        const { w, h } = $.of(rect)
        const { pointable } = $.of(it)
        const { isHovering } = $.of(pointable)
        $()
        this.needRender = true
      }
      @fx trigger_needDraw() {
        const { rect } = $.of(this)
        const { hasSize } = $.when(rect)
        const { x, y } = $.of(rect)
        $()
        this.needDraw = true
      }
      @fn render() {
        const { canvas, pr, rect } = $.of(this)
        const { c } = $.of(canvas)
        const { pointable } = $.of(it)
        const { isHovering } = $.of(pointable)

        const alpha = '66'
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

        this.needRender = false
        this.needDraw = true
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { pr, canvas, rect } = this
        rect.drawImage(canvas.el, c, pr, true)
        this.needDraw = false
      }
    }
    return $(new ScrollbarRenderable(this.ctx))
  }
  get pointable(): $<Pointable> {
    $()
    const it = this
    const { dim, ctx } = $.of(it)
    const { world: { pointer }, dims, scroll } = $.of(ctx)
    const { rect, innerSize } = $.of(dims)
    class ScrollbarPointable extends Pointable {
      hitArea = it.renderable.rect
      @fn onDown() {
        it.scrollBegin = scroll[dim]
        it.pointerBegin = pointer.pos[dim]
      }
      @fn onMove() {
        const { buttons } = pointer
        if (this.isDown && (buttons & MouseButtons.Left)) {
          const side = sides[dim]
          const co = rect[side] / innerSize[side]

          scroll.animSettings = Scroll.AnimSettings.Fast

          scroll.targetScroll[<Dim>dim] =
            it.scrollBegin
            - (pointer.pos[dim] - it.pointerBegin) / co
        }
      }
    }
    return $(new ScrollbarPointable(this))
  }
}
