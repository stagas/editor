import { $, fn, fx, of } from 'signal'
import { Renderable } from './renderable.ts'
import { Comp } from './comp.ts'
import { Rect } from 'std'

export class Indicator extends Comp {
  color1?= '#f0f'
  color2?= '#ff0'
  get renderable() {
    $()
    const it = this
    class IndicatorRenderable extends Renderable {
      // offset = { x: -7, y: -5.5 }
      rect = $(new Rect, { x: -7, y: -5.5 })
      @fx trigger_needRender() {
        const { pr, rect: { w, h } } = of(this)
        const { color1 ,color2} = of(it)
        $()
        this.needRender = true
      }
      @fn render() {
        const { canvas, rect } = of(this)
        const { color1 ,color2} = of(it)
        const { c } = of(canvas)
        const { w, h } = rect
        const x = 0
        const y = 0
        c.save()
        c.translate(8.5, 5)
        c.fillStyle = color1
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
        c.fillStyle = color2
        c.fill()
        c.restore()
        this.needRender = false
        this.needDraw = true
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { pr, canvas, rect } = of(this)
        // c.save()
        // c.translate(offset.x, offset.y)
        // console.log(rect.x, rect.y)
        rect.drawImage(canvas.el, c)
        // c.restore()
        this.needDraw = false
      }
    }
    return $(new IndicatorRenderable(this.ctx))
  }
}
