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
  misc?: Misc
  skin?: Skin
  colors?: any
  history?: History
  buffer?: Buffer
  dims?: Dims
  scroll?: Scroll
  input?: Input
  selection?: Selection
}

