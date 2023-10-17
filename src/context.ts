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
  misc = $(new Misc)
  skin: Skin = { colors: {}, fonts: { mono: 'monospace' } }
  colors: Record<string, string> = {}
  history = $(new History(this))
  buffer = $(new Buffer(this, { Type: {} }))
  dims = $(new Dims(this))
  scroll = $(new Scroll(this))
  input = $(new Input(this))
  selection = $(new Selection(this))
}

