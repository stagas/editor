import { $, init } from 'signal'
import { Context } from './context.ts'
import { RenderScene } from './render-scene.ts'
import { TextScene } from './text.ts'

export class Editor extends RenderScene {
  ctx?: Context

  text?: TextScene

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

    rect.fill(c, '#214')
  }
}
