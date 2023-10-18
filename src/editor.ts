log.active
import { $, fn, fx, init } from 'signal'
import { Render } from './render.ts'
import { Text } from './text.ts'
import { Selection } from './selection.ts'
import { Input } from './input.ts'
import { Dims } from './dims.ts'
import { Scroll } from './scroll.ts'
import { Buffer } from './buffer.ts'
import { History } from './history.ts'
import { Misc } from './misc.ts'
import { WidgetLike } from './widgets.ts'
import { World } from 'std'

interface PointerItem { }

interface Skin {
  colors: Record<string, string>
  fonts: {
    mono: string
  }
}

type Colors = Record<string, string>

export class Editor extends Render {
  constructor(public world: World) {
    super({ world } as any)
  }
  misc = $(new Misc)
  skin = {
    colors: {
      bgBright2: '#555'
    }, fonts: { mono: 'monospace' }
  }
  colors: Colors = {}
  history = $(new History(this))
  buffer = $(new Buffer(this, { Type: {} }))
  scroll = $(new Scroll(this))
  dims = $(new Dims(this))
  input = $(new Input(this))
  selection = $(new Selection(this))
  text = $(new Text(this))
  sub: (WidgetLike | (WidgetLike & PointerItem))[] = []
  deco: WidgetLike[] = []

  @init init_Editor() {
    this.canvas.fullWindow = true
  }
  get scenes(): Render[] {
    const t = $.of(this)
    return [
      t.selection,
      t.text,
    ]
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
    this.draw()
    // requestAnimationFrame(() => this.draw())
  }
  @fn initCanvas() {
    const { c } = $.of(this.canvas)
    c.imageSmoothingEnabled = false
    this.needDraw = true
  }
  render() {}
  @fn draw() {
    const { rect, scenes, canvas } = $.of(this)
    const { c } = canvas

    rect.fill(c, '#224')

    for (const scene of scenes) {
      scene.needInit && scene.initCanvas(scene.canvas.c)
      scene.needRender && scene.render()
      scene.draw(c)
    }

    this.needDraw = false
  }
}
