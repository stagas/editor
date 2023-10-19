import { $, fn, fx } from 'signal'
import { Render } from './render.ts'

export class Indicator extends Render {
  color1?= '#f0f'
  color2?= '#ff0'

  @fx trigger_needRender() {
    const { pr, color1, color2, rect: { w, h } } = $.of(this)
    $.untrack()
    this.needRender = true
  }

  @fn initCanvas() {
    this.needInit = false
    this.needRender = true
  }
  update() { return 0}
  updateOne() { return 0}
  @fn render(){
    const { canvas, rect, color1, color2 }= $.of(this)
    const { c } = $.of(canvas)
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
  @fn draw(t: number, c: CanvasRenderingContext2D){
    const { pr, canvas, rect } = $.of(this)
    c.save()
    c.translate(-7, -5.5)
    rect.drawImage(canvas.el,c, pr, true)
    c.restore()
    this.needDraw = false
  }
}
