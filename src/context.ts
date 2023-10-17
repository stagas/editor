import { $, fn, fx, init } from 'signal'
import { Point, Rect, Scene, World } from 'std'
import { arraysEqual } from 'utils'
import { Dims } from './dims.ts'

interface Skin {
  fonts: {
    mono: string
  }
}

class Buffer {

}

export class Context extends Scene {
  target?: Buffer
  dims?: Dims
  skin?: Skin
}

