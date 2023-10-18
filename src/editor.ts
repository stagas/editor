log.active
import { $, fn, fx, init } from 'signal'
import { Context } from './context.ts'
import { RenderScene } from './render.ts'
import { TextScene } from './text.ts'
import { World } from 'std'

export class Editor extends RenderScene {
  constructor(public world: World) {
    super(world)
    this.ctx = $(new Context(world, this.rect))
    this.text = $(new TextScene(this.ctx))
  }
  ctx: Context
  text: TextScene

  get scenes(): RenderScene[] {
    const { text } = $.of(this)
    return [text]
  }
  @fx resize_editor_to_world() {
    const { rect, world } = $.of(this)
    const { size } = $.of(world.canvas)
    rect.setSize(size)
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
  @fx trigger_draw() {
    $.when(this).needDraw
    // this.draw()
    requestAnimationFrame(() => this.draw())
  }
  @fn initCanvas() {
    const { c } = $.of(this.world.canvas)
    c.imageSmoothingEnabled = false
  }
  @fn render() {
  }
  @fn draw() {
    const { rect, world, scenes } = $.of(this)
    const { canvas } = $.of(world)
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
