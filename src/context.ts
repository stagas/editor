import { $, fn, fx, init } from 'signal'
import { Point, Rect, Scene, World } from 'std'
import { arraysEqual } from 'utils'
import { Dims } from './dims.ts'
import { Buffer } from './buffer.ts'
import { Scroll } from './scroll.ts'
import { Misc } from './misc.ts'

interface Skin {
  colors: Record<string, string>
  fonts: {
    mono: string
  }
}

export class Context extends Scene {
  misc?: Misc
  buffer?: Buffer
  dims?: Dims
  skin?: Skin
  scroll?: Scroll
  colors?: any
}

