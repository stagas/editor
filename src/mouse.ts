// log.active
import { $, fx } from 'signal'
import { Point, PointerEventType } from 'std'
import { Comp } from './comp.ts'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Linecol } from './linecol.ts'
import { Pointable } from './pointable.ts'

export class Mouse extends Comp {
  pos = this.ctx.world.pointer.$.pos
  linecol = $(new Linecol)

  downCount = 0
  downTime = 0
  downPos = $(new Point)

  hoverIt?: Pointable.It | null
  downIt?: Pointable.It | null | undefined

  _innerPos = $(new Point)
  get innerPos() {
    const { ctx: { misc, renderable: { pr, prRecip } } } = $.of(this)
    const { innerMatrix: m } = $.of(misc)
    const { a, b, c, d, e, f } = m
    const { pos } = $.of(this)
    const { x, y } = $.of(pos)
    $()
    this._innerPos.set(pos).normalizeMatrixPr(m, pr, prRecip).round()
    return this._innerPos
  }

  *getItPointable(it: Pointable.It): Generator<Pointable.It> {
    let item: Pointable.It | false | undefined

    if (item = it.pointable.getItAtPoint(it.pointable.mouse.pos)) {
      yield item
    }

    if ('pointables' in it) {
      for (const i of it.pointables) {
        const { pointable: p } = i
        if (!p.it.renderable.isVisible) continue

        yield* this.getItPointable(i)
      }
    }
  }

  *getItsUnderPointer(it: Pointable.It) {
    const { downIt } = this

    // the down It is always the first under the pointer.
    if (downIt) yield downIt

    yield *this.getItPointable(it)
  }

  @fx update_it_pointable_isDown() {
    const { downIt } = $.of(this)
    $()
    downIt.pointable.isDown = true
    return () => {
      downIt.pointable.isDown = false
    }
  }

  @fx update_it_pointable_isHovering() {
    const { hoverIt, ctx: { world } } = $.of(this)
    $()
    hoverIt.pointable.isHovering = true
    world.screen.cursor = hoverIt.pointable.cursor
    return () => {
      hoverIt.pointable.isHovering = false
    }
  }

  @fx handle_pointer_event() {
    const { ctx } = $.of(this)
    const { world, misc, buffer, dims } = $.of(ctx)
    const { charWidth } = $.of(dims)
    const { pointer } = $.of(world)
    const { time, real } = $.of(pointer)
    $()
    const { type } = pointer
    const { pos, innerPos, linecol, downIt, hoverIt } = this

    const kind = PointerEventMap[type]

    log(Mouse.EventKind[kind])

    switch (kind) {
      case Down:
        if (time - this.downTime < DOUBLE_CLICK_MS) {
          this.downCount++
        }
        else {
          this.downCount = 1
        }
        this.downTime = time
        break

      case Leave:
        if (downIt) break

      case Up:
        this.hoverIt
          = this.downIt
          = null
        if (kind === Leave) return
        break
    }

    let i = 0
    const its = this.getItsUnderPointer(ctx)
    for (const it of its) {
      if (!i && this.hoverIt !== it) {
        this.hoverIt = it
      }

      // switch (kind) {
      //   case Up:
      //     if (downIt && it !== downIt) {
      //       return
      //     }
      // }

      if (it.pointable.onMouseEvent?.(kind)) {
        switch (kind) {
          case Down:
            this.downIt = it
            break
        }
        return
      }
      else {
        switch (kind) {
          case Up:
            if (time - this.downTime < SINGLE_CLICK_MS && it === downIt) {
              it.pointable.onMouseEvent?.(Click)
              return
            }
            break
        }
      }

      i++
    }
  }
}

export namespace Mouse {
  export enum EventKind {
    Wheel,
    Move,
    Down,
    Up,
    Enter,
    Leave,
    Click,
    Menu,
  }
}

const { Wheel, Down, Up, Leave, Move, Menu, Click, Enter } = Mouse.EventKind

const PointerEventMap = {
  [PointerEventType.Wheel]: Wheel,
  [PointerEventType.Down]: Down,
  [PointerEventType.Up]: Up,
  [PointerEventType.Leave]: Leave,
  [PointerEventType.Move]: Move,
  [PointerEventType.Menu]: Menu,
} as const
