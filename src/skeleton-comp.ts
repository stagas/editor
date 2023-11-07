import { $ } from 'signal'
import { Keyboard, Keyboardable, Mouse, Mouseable, Renderable } from 'std'
import { Comp } from './comp.ts'

export class Skeleton extends Comp
  implements Renderable.It, Mouseable.It, Keyboardable.It {
  get renderables() {
    return []
  }
  get renderable() {
    $()
    const it = this
    class SkeletonRenderable extends Renderable {

    }
    return $(new SkeletonRenderable(it as Renderable.It))
  }
  get mouseables() {
    return []
  }
  get mouseable() {
    $()
    const it = this
    const { Wheel, Down, Up, Move, Click, Enter, Leave, Menu } = Mouse.EventKind
    class SkeletonMouseable extends Mouseable {
      onMouseEvent(kind: Mouse.EventKind): true | void | undefined {
        const { mouse } = this
        switch (kind) {
          case Wheel:
            break
          case Down:
            break
          case Up:
            break
          case Move:
            break
          case Click:
            break
          case Enter:
            break
          case Leave:
            break
          case Menu:
            break
        }
      }
    }
    return $(new SkeletonMouseable(it as Mouseable.It))
  }
  get keyboardable() {
    $()
    const it = this
    const { Down, Up, Copy, Cut, Paste } = Keyboard.EventKind
    const { Char, Special } = Keyboard.KeyKind
    class SkeletonKeyboardable extends Keyboardable {
      onKeyboardEvent(kind: Keyboard.EventKind): string | true | void | undefined {
        const { key, char, special, alt, ctrl, shift } = this.keypress
        switch (kind) {
          case Down:
            break
          case Up:
            break
          case Copy:
            break
          case Cut:
            break
          case Paste:
            break
        }
      }
    }
    return $(new SkeletonKeyboardable(it as Keyboardable.It))
  }
}
