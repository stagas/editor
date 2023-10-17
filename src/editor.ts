import { $ } from 'signal'
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

  draw() {
    const { rect, canvas } = $.of(this)
    const { c } = canvas
    rect.fill(c, '#39a')
  }
}