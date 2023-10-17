import { $, init } from 'signal'
import { Context } from './context.ts'
import { RenderScene } from './render-scene.ts'
import { TextScene } from './text.ts'

export class Editor extends RenderScene {
  get ctx() {
    $.untrack()
    return $(new Context(this.world))
  }
  get text() {
    $.untrack()
    return $(new TextScene(this.ctx))
  }
  get scenes(): RenderScene[] {
    const { text } = $.of(this)
    return [text]
  }

  @init initResizeToWindow() {
    const { rect } = $.of(this)
    rect.resizeToWindow()
  }

  draw() {
    const { rect, world } = $.of(this)
    const { canvas } = $.of(world)
    const { c } = canvas
    console.log(canvas)

    rect.fill(c, '#222')
  }
}
