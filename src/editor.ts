log.active
import { $, fn, fx, init } from 'signal'
import { Context } from './context.ts'
import { Render } from './render.ts'
import { Text } from './text.ts'
import { World } from 'std'

export class Editor extends Render {
  constructor(public world: World) {
    super(world)
    this.canvas.fullWindow = true
    this.ctx = $(new Context(world, this.rect))
    this.text = $(new Text(this.ctx))
  }
  ctx: Context
  text: Text

  get scenes(): Render[] {
    const { text } = $.of(this)
    return [text]
  }
  @fx maybe_needDraw() {
    const { scenes } = $.of(this)
    let d = false
    for (const scene of scenes) {
      const { needRender, needDraw } = scene
      d ||= needRender || needDraw || false
    }
    if (d) {
      this.needDraw = true
    }
  }
  @fx when_needDraw_trigger_draw() {
    $.when(this).needDraw
    requestAnimationFrame(() => this.draw())
  }
  @fn initCanvas() {
    const { c } = $.of(this.canvas)
    c.imageSmoothingEnabled = false
  }
  @fn render() {
  }
  @fn draw() {
    const { rect, scenes, canvas } = $.of(this)
    const { c } = canvas

    rect.fill(c, '#224')

    for (const scene of scenes) {
      if (scene.needInit) scene.initCanvas(scene.canvas.c)
      scene.render()
      scene.draw(c)
    }

    this.needDraw = false
  }
}
