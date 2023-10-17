import { $, fn, init } from 'signal'
import { Context } from './context.ts'
import { RenderScene } from './render-scene.ts'
import { TextScene } from './text.ts'
import { World } from 'std'

export class Editor extends RenderScene {
  constructor(public world: World) {
    super(world)
    this.ctx = $(new Context(world))
    this.text = $(new TextScene(this.ctx))
  }
  ctx: Context
  text: TextScene

  get scenes(): RenderScene[] {
    const { text } = $.of(this)
    return [text]
  }
  @init initResizeToWindow() {
    const { rect } = $.of(this)
    rect.resizeToWindow()
  }
  @fn render() { }
  @fn draw() {
    const { rect, world, scenes } = $.of(this)
    const { canvas } = $.of(world)
    const { c } = canvas
    rect.fill(c, '#224')
    for (const scene of scenes) {
      scene.render()
      scene.draw(c)
    }
  }
}
