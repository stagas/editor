log.active
import { $, init } from 'signal'
import { Rect, Scene, World } from 'std'
import { Dims } from './dims.ts'
import { Buffer } from './buffer.ts'
import { Scroll } from './scroll.ts'
import { Misc } from './misc.ts'
import { History } from './history.ts'
import { Input } from './input.ts'
import { Selection } from './selection.ts'
import { WidgetLike } from './widgets.ts'

interface PointerItem { }

interface Skin {
  colors: Record<string, string>
  fonts: {
    mono: string
  }
}

type Colors = Record<string, string>

export class Context extends Scene {
  constructor(
    public world: World,
    public rect: $<Rect>,
  ) {
    super(world)
  }

  misc!: $<Misc>
  skin!: Skin
  colors!: Colors
  history!: $<History>
  buffer!: $<Buffer>
  scroll!: $<Scroll>
  dims!: $<Dims>
  input!: $<Input>
  selection!: $<Selection>

  sub: (WidgetLike | (WidgetLike & PointerItem))[] = []
  deco: WidgetLike[] = []

  @init init() {
    this.misc = $(new Misc)
    this.skin = { colors: {
      bgBright2: '#444'
    }, fonts: { mono: 'monospace' } }
    this.colors = {}
    this.history = $(new History(this))
    this.buffer = $(new Buffer(this, { Type: {} }))
    this.scroll = $(new Scroll(this))
    this.dims = $(new Dims(this))
    this.input = $(new Input(this))
    this.selection = $(new Selection(this))
  }
}
