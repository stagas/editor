// log.active
import { $, fn, fx } from 'signal'
import { Point, PointerEventType } from 'std'
import { Comp } from './comp.ts'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Pointable } from './pointable.ts'
import { Linecol } from './linecol.ts'
import { Renderable } from './renderable.ts'

const { Wheel, Down, Up, Leave, Move, Menu } = PointerEventType

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
    this._innerPos.set(pos).transformMatrixPr(m, pr, prRecip)
    return this._innerPos
  }

  *getItsUnderPointer() {
    const { ctx: { pointables } } = $.of(this)
    let it: Pointable.It | false | undefined

    const { downIt } = this

    if (downIt) yield downIt

    for (const { pointable: p } of pointables) {
      if (it = p.getItAtPoint(p.mouse.pos)) {
        yield it
      }
    }
  }

  @fx update_it_pointable_isDown() {
    const { downIt } = $.of(this)
    $()
    downIt.pointable.isDown = true
    return () => {
      downIt.pointable.isDown = false
    }
  }

  @fx handle_pointer_event() {
    const { ctx } = $.of(this)
    const { world, misc, buffer, pointables, dims } = $.of(ctx)
    const { charWidth } = $.of(dims)
    const { pointer } = $.of(world)
    const { time, real } = $.of(pointer)
    $()
    const { type } = pointer
    // const { pos, innerPos, linecol, downIt, hoverIt } = this

    const its = this.getItsUnderPointer()
    const kind = PointerEventMap[type]
    for (const it of its) {
      if (it.pointable.onMouseEvent?.(kind)) {
        return
      }
    }

    // let itIndex = -1
    // let topIt = its.at(itIndex)
    // if (!topIt) {
    //   if (downIt) topIt = downIt
    //   else return
    // }

    // if (type === Down) this.downIt = topIt

    // if (!this.downIt) {
    //   buffer.getLineColFromPoint(pos, true, linecol)
    //   misc.isTyping = false
    // }


    // return









    // if (type !== Up && downIt) its.push(downIt)

    // if (type !== Up && downIt) {
    //   downIt.pointable[PointerEventMap[type]]?.()
    //   return
    // }

    // if (!downIt) {
    //   buffer.getLineColFromPoint(pos, true, linecol)
    //   misc.isTyping = false
    // }

    // if (type !== Wheel && !misc.isScrolling && misc.wasScrolling && !downIt?.pointable.isDown) {
    //   misc.wasScrolling = false
    // }

    // let itemIndex = -1
    // let currentIt = its.at(itemIndex)!

    // if (type === Up && downIt) {
    //   downIt.pointable.isDown = false
    // }

    // if (!downIt?.pointable.isDown && hoverIt !== currentIt) {
    //   this.hoverIt = currentIt

    //   if (hoverIt) {
    //     hoverIt.pointable.isHovering = false
    //     hoverIt.pointable.onLeave?.()
    //   }

    //   if (this.hoverIt) {
    //     this.hoverIt.pointable.isHovering = true
    //     world.screen.cursor = this.hoverIt.pointable.cursor
    //     this.hoverIt.pointable.onEnter?.()
    //   }
    // }

    // switch (type) {
    //   case PointerEventType.Down:
    //     if (time - this.downTime < DOUBLE_CLICK_MS) {
    //       this.downCount++
    //     }
    //     else {
    //       this.downCount = 1
    //     }
    //     this.downTime = time
    //     this.downPos.set(pos)
    //     this.downIt = currentIt
    //     this.downIt.pointable.isDown = true
    //     currentIt.pointable.onDown?.(this.downCount)
    //     return

    //   case PointerEventType.Up:
    //     this.downIt = null
    //     if (time - this.downTime < SINGLE_CLICK_MS) {
    //       downIt?.pointable.onClick?.()
    //       return
    //     }
    //     break

    //   case PointerEventType.Leave:
    //     if (this.hoverIt) {
    //       this.hoverIt.pointable.isHovering = false
    //       this.hoverIt = null
    //     }
    //     pointables.forEach(t =>
    //       t.pointable.isHovering = false
    //     )
    //     break
    // }

    // const handler = PointerEventMap[type]
    // let receiver: Pointable.It | undefined = currentIt
    // while (receiver && !receiver.pointable[handler]) {
    //   receiver = its.at(--itemIndex)
    // }
    // receiver?.pointable[handler]?.()
  }
}

export namespace Mouse {
  export enum EventKind {
    Wheel,
    Move,
    Down,
    Up,
    Leave,
    Menu,
    Click,
  }
}

const PointerEventMap = {
  [Wheel]: Mouse.EventKind.Wheel,
  [Down]: Mouse.EventKind.Down,
  [Up]: Mouse.EventKind.Up,
  [Leave]: Mouse.EventKind.Leave,
  [Move]: Mouse.EventKind.Move,
  [Menu]: Mouse.EventKind.Menu,
} as const
