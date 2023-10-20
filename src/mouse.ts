// log.active
import { $, fn, fx } from 'signal'
import { Point, PointerEventType } from 'std'
import { Comp } from './comp.ts'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Pointable } from './pointable.ts'
import { Linecol } from './linecol.ts'

const { Wheel, Down, Up, Leave, Move, Menu } = PointerEventType

const PointerEventMap = {
  [Wheel]: 'onWheel',
  [Down]: 'onDown',
  [Up]: 'onUp',
  [Leave]: 'onLeave',
  [Move]: 'onMove',
  [Menu]: 'onMenu',
} as const

export class Mouse extends Comp {
  linecol = $(new Linecol)

  downCount = 0
  downTime = 0
  downPos = $(new Point)

  hoverIt?: Pointable.It | null
  downIt?: Pointable.It | null | undefined

  @fn findItemsAtPoint(p: Point): Pointable.It[] {
    const { ctx } = $.of(this)
    const { pointables, text } = $.of(ctx)
    const items: Pointable.It[] = []

    let item: Pointable.It | false | undefined
    for (const { pointable } of pointables) {
      if (item = pointable.getItAtPoint(p)) {
        items.push(item)
      }
    }

    return items
  }

  @fx handle_pointer_event() {
    const { ctx } = $.of(this)
    const { world, misc, buffer, pointables, dims } = $.of(ctx)
    const { charWidth } = $.of(dims)
    const { pointer } = $.of(world)
    const { time, real } = $.of(pointer)
    $()
    const { type, pos } = pointer
    const { linecol, downIt, hoverIt } = this

    // we update the mouse.linecol, but not when we are scrolling
    // or some element has focus. We also prevent updating right after
    // scroll at the arbitrary new position, because it's surprising,
    // so instead we see if we were scrolling and skip it, except when
    // it is Down, which means the user clicked.
    if (type === Down || (type !== Wheel && !misc.isScrolling && !misc.wasScrolling && ctx.pointable.isHovering)) {
      buffer.getLineColFromPoint(pos, true, linecol)
      misc.isTyping = false
    }
    // We return the state to normal at the next events,
    // unless it's a Wheel or user is pressing down on an item.
    if (type !== Wheel && !misc.isScrolling && misc.wasScrolling && !downIt?.pointable.isDown) {
      misc.wasScrolling = false
    }

    if (type === Move && downIt) {
      downIt.pointable[PointerEventMap[type]]?.()
      return
    }

    const items = this.findItemsAtPoint(pos)
    if (type !== Up && downIt) items.push(downIt)

    let itemIndex = -1
    let currentIt = items.at(itemIndex)!

    if (type === Up && downIt) {
      downIt.pointable.isDown = false
    }

    if (!downIt?.pointable.isDown && hoverIt !== currentIt) {
      this.hoverIt = currentIt

      if (hoverIt) {
        hoverIt.pointable.isHovering = false
        hoverIt.pointable.onLeave?.()
      }

      if (this.hoverIt) {
        this.hoverIt.pointable.isHovering = true
        world.screen.cursor = this.hoverIt.pointable.cursor
        this.hoverIt.pointable.onEnter?.()
      }
    }

    switch (type) {
      case PointerEventType.Down:
        if (time - this.downTime < DOUBLE_CLICK_MS) {
          this.downCount++
        }
        else {
          this.downCount = 1
        }
        this.downTime = time
        this.downPos.set(pos)
        this.downIt = currentIt
        this.downIt.pointable.isDown = true
        currentIt.pointable.onDown?.(this.downCount)
        return

      case PointerEventType.Up:
        this.downIt = null
        if (time - this.downTime < SINGLE_CLICK_MS) {
          downIt?.pointable.onClick?.()
          return
        }
        break

      case PointerEventType.Leave:
        if (this.hoverIt) {
          this.hoverIt.pointable.isHovering = false
          this.hoverIt = null
        }
        pointables.forEach(t =>
          t.pointable.isHovering = false
        )
        break
    }

    const handler = PointerEventMap[type]
    let receiver: Pointable.It | undefined = currentIt
    while (receiver && !receiver.pointable[handler]) {
      receiver = items.at(--itemIndex)
    }
    receiver?.pointable[handler]?.()
  }
}
