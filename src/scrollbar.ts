// log.active
import { $, fn, fx, of, when } from 'signal'
import { Point, Mouse, Mouseable, Renderable } from 'std'
import { MouseButtons } from 'utils'
import { Comp } from './comp.ts'
import { Scroll } from './scroll.ts'

export enum Axis {
  X = 'x',
  Y = 'y',
}

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

export class Scrollbar extends Comp
  implements Renderable.It {
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
    renderable.isHidden = co >= 1
    if (!renderable.isHidden) {
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
        const { world } = of(ctx)
        const { mouse } = of(world)
        const { mouseable } = of(it)
        const { isHovering, isDown } = of(mouseable)
        $()
        this.needRender = true
      }
      @fn init(c: CanvasRenderingContext2D) {
        c.lineWidth = 3
      }
      @fn draw(c: CanvasRenderingContext2D, point: Point) {
        const { rect } = of(this)
        const { mouseable } = of(it)
        const { isHovering, isDown } = of(mouseable)

        c.save()

        point.translate(c)
        //
        const alpha = '66'
        c.clearRect(0, 0, rect.w, rect.h)
        c.fillStyle =
        // skin.colors.bgBright1 + alpha
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
      }
    }
    return $(new ScrollbarRenderable(it as Renderable.It))
  }
  get mouseable() {
    $()
    const it = this
    const { axis, ctx } = of(it)
    const { dims, scroll } = of(ctx)
    const { rect, innerSize } = of(dims)
    const { Down, Move } = Mouse.EventKind

    class ScrollbarMouseable extends Mouseable {
      @fn onMouseEvent(kind: Mouse.EventKind) {
        const { mouse: { clampedPos: pos, buttons }, isDown } = of(this)

        switch (kind) {
          case Down:
            it.scrollBegin = scroll[axis]
            it.pointerBegin = pos[axis]
            return true

          case Move:
            if (isDown && (buttons & MouseButtons.Left)) {
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
    return $(new ScrollbarMouseable(it as Mouseable.It))
  }
}
