// log.active
import { $, fn, fx , of } from 'signal'
import { MouseButtons } from 'utils'
import { Comp } from './comp.ts'
import { Mouse } from './mouse.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './renderable.ts'
import { Scroll } from './scroll.ts'

type Axis = 'x' | 'y'

const AxisOpp = {
  x: 'y',
  y: 'x',
} as const

const Sides = {
  x: 'w',
  y: 'h',
} as const

const SidesOpp = {
  x: 'h',
  y: 'w',
} as const

export class Scrollbar extends Comp {
  axis?: Axis
  scrollBegin = 0
  pointerBegin = 0
  @fx update_scrollbar() {
    const { renderable, axis, ctx } = of(this)
    const { dims, scroll } = of(ctx)
    const { scrollSize, targetScroll } = of(scroll)
    const { hasSize } = when(scrollSize)
    const { rect: r } = of(renderable)
    const { rect, scrollbarSize } = of(dims)

    const s = Sides[axis]
    const so = SidesOpp[axis]
    const co = rect[s] / scrollSize[s]
    const x = -targetScroll[axis] * co
    const w = rect[s] * co
    const y = rect[so] - scrollbarSize[so]
    $()
    if (renderable.isVisible = co < 1) {
      r[axis] = x
      r[AxisOpp[axis]] = y
    }
    r[s] = w
    r[so] = scrollbarSize[so]
  }
  get renderable() {
    $()
    const it = this
    const { ctx } = of(it)
    const { skin } = of(ctx)
    class ScrollbarRenderable extends Renderable {
      @fx trigger_needRender() {
        const { rect, pr } = of(this)
        const { hasSize } = when(rect)
        const { w, h } = of(rect)
        const { pointable } = of(it)
        const { isHovering, isDown } = of(pointable)
        $()
        this.needRender = true
      }
      @fx trigger_needDraw() {
        const { rect } = of(this)
        const { hasSize } = when(rect)
        const { x, y } = of(rect)
        $()
        this.needDraw = true
      }
      @fn initCanvas(c: CanvasRenderingContext2D) {
        c.lineWidth = 3
        this.needInit = false
        this.needRender = true
      }
      @fn render() {
        const { canvas, pr, rect } = of(this)
        const { c } = of(canvas)
        const { pointable } = of(it)
        const { isHovering, isDown } = of(pointable)

        c.save()
        //
        const alpha = '66'
        c.clearRect(0, 0, rect.w, rect.h)
        c.fillStyle =
          (isHovering || isDown
            ? skin.colors.bgBright2
            : skin.colors.bgBright1) + alpha
        c.fillRect(0, 0, rect.w, rect.h)

        c.beginPath()
        c.moveTo(0, rect.h)
        c.lineTo(rect.w, rect.h)
        c.lineTo(rect.w, 0)

        c.strokeStyle = skin.colors.bgBright015 //+ alpha
        c.stroke()

        c.beginPath()
        c.moveTo(0, rect.h)
        c.lineTo(0, 0)
        c.lineTo(rect.w, 0)

        c.strokeStyle = skin.colors.bgBright25 + alpha
        c.stroke()
        //
        c.restore()

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
  get pointable() {
    $()
    const it = this
    const { axis, ctx } = of(it)
    const { world: { pointer }, dims, scroll } = of(ctx)
    const { rect, innerSize } = of(dims)
    const { Down, Move } = Mouse.EventKind

    class ScrollbarPointable extends Pointable {
      hitArea = it.renderable.rect
      @fn onMouseEvent(kind: Mouse.EventKind) {
        const { mouse: { pos, btns }, isDown } = of(this)
        switch (kind) {
          case Down:
            it.scrollBegin = scroll[axis]
            it.pointerBegin = pointer.pos[axis]
            return true

          case Move:
            if (isDown && (btns & MouseButtons.Left)) {
              const side = Sides[axis]
              const co = rect[side] / innerSize[side]

              scroll.animSettings = Scroll.AnimSettings.Fast

              scroll.targetScroll[<Axis>axis] =
                it.scrollBegin
                - (pos[axis] - it.pointerBegin) / co
              return true
            }
            break
        }
      }
    }
    return $(new ScrollbarPointable(this))
  }
}
