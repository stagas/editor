import { $, fn, fx, init } from 'signal'
import { Point, Rect, Scene, World } from 'std'
import { arraysEqual } from 'utils'
import { Dims } from './dims.ts'
import { Buffer } from './buffer.ts'
import { Scroll } from './scroll.ts'
import { Misc } from './misc.ts'
import { History } from './history.ts'
import { Input } from './input.ts'
import { Selection } from './selection.ts'

interface Skin {
  colors: Record<string, string>
  fonts: {
    mono: string
  }
}

export class Context extends Scene {
  // world?: World
  rect?: Rect

  misc = $(new Misc)
  skin = { colors: {}, fonts: { mono: 'monospace' } }
  colors = {}
  history = $(new History(this))
  buffer = $(new Buffer(this, { Type: {} }))
  scroll = $(new Scroll(this))
  dims = $(new Dims(this))
  input = $(new Input(this))
  selection = $(new Selection(this))

  // misc!: $<Misc>
  // skin!: Skin
  // colors!: Record<string, string>
  // history!: $<History>
  // buffer!: $<Buffer>
  // scroll!: $<Scroll>
  // dims!: $<Dims>
  // input!: $<Input>
  // selection!: $<Selection>

  _props: any
  constructor(
    world: World,
    rect: Rect
  ) {
    super(world)
    this._props = { rect }
  }

  @init init() {
    this.rect = this._props.rect
  }
}


// export class Context extends Scene {
//   misc!: $<Misc>
//   skin!: Skin
//   colors!: Record<string, string>
//   history!: $<History>
//   buffer!: $<Buffer>
//   scroll!: $<Scroll>
//   dims!: $<Dims>
//   input!: $<Input>
//   selection!: $<Selection>

//   constructor(public world: World, public rect: Rect) {
//     super(world)
//   }

//   @init init() {
//     this.misc = $(new Misc)
//     this.skin = { colors: {}, fonts: { mono: 'monospace' } }
//     this.colors = {}
//     this.history = $(new History(this))
//     this.buffer = $(new Buffer(this, { Type: {} }))
//     this.scroll = $(new Scroll(this))
//     this.dims = $(new Dims(this))
//     this.input = $(new Input(this))
//     this.selection = $(new Selection(this))
//   }
// }

