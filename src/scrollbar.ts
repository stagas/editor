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

type Dim = 'x' | 'y'

export class Scrollbar extends Render {
  canFocus = false
  dim?: Dim
  scrollBegin = 0
  pointerBegin = 0
  @fn onPointerDown() {
    const { world: { pointer: p }, dim, ctx: { scroll } } = $.of(this)
    this.scrollBegin = scroll[dim]
    this.pointerBegin = p.pos[dim]
  }
  @fn onHoldMove() {
    const { world: { pointer: p }, dim, ctx } = $.of(this)
    const { dims, scroll } = $.of(ctx)
    const { rect, innerSize } = $.of(dims)
    const side = sides[dim]
    const co = rect[side] / innerSize[side]

    scroll.pos[<Dim>dim] =
      scroll.targetScroll[<Dim>dim] =
      this.scrollBegin
      - (p.pos[dim] - this.pointerBegin) / co

    scroll.animScrollStrategy = AnimScrollStrategy.Fast

    // ctx.needUpdate = true
  }
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
  initCanvas() {   }
  update() { return 0 }
  updateOne() { return 0 }
  @fn render() {
    const { canvas, pr, rect, isHovering, ctx } = $.of(this)
    const { c } = $.of(canvas)
    const { skin } = $.of(ctx)
    const alpha = '66'
    // c.restore()
    // c.save()
    // c.scale(pr, pr)
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

    // c.restore()

    this.needRender = false
    this.needDraw = true
  }
  @fn draw(t: number, c: CanvasRenderingContext2D) {
    const { pr, canvas, rect } = this
    rect.drawImage(canvas.el, c, pr, true)
    this.needDraw = false
  }
  @fx trigger_needRender() {
    const { rect: { w, h }, isHovering } = $.of(this)
    $._()
    this.needRender = true
  }
  @fx trigger_needDraw() {
    const { rect: { x, y } } = $.of(this)
    $._()
    this.needDraw = true
  }
}