// log.active
import { $, fn, fx } from 'signal'
import { Point, PointerEventType } from 'std'
import { Comp } from './comp.ts'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Pointable } from './pointable.ts'

const { Wheel, Down, Up, Leave, Move } = PointerEventType

const PointerEventMap = {
  [Wheel]: 'onWheel',
  [Down]: 'onDown',
  [Up]: 'onUp',
  [Leave]: 'onLeave',
  [Move]: 'onMove',
} as const

export class Mouse extends Comp {
  lineCol = $(new Point)

  downCount = 0
  downTime = 0
  downPos = $(new Point)

  hoverIt?: Pointable.It | null
  downIt?: Pointable.It | null | undefined

  @fn findItemsAtPoint(p: Point): Pointable.It[] {
    const { ctx } = $.of(this)
    const { pointables: pointerTargets, text } = $.of(ctx)
    const items: Pointable.It[] = [text]

    let item: Pointable.It | false | undefined
    for (const target of pointerTargets) {
      if (item = target.pointable.getItAtPoint(p)) {
        items.push(item)
      }
    }

    return items
  }

  @fx handle_pointer_event() {
    const { ctx } = $.of(this)
    const { world, buffer, pointables, input, text, scrollbars, dims } = $.of(ctx)
    const { charWidth } = $.of(dims)
    const { mouse } = $.of(input)
    // const { pointable } = $.of(text)

    // scrollbars.items.forEach(x => {
    //   const { pointable } = $.of(x)
    // })

    const { pointer } = $.of(world)
    const { time, real } = $.of(pointer)
    $()
    const { type, pos } = pointer
    const { lineCol, downIt, hoverIt } = this

    const downItem = downIt?.pointable
    const hoverItem = hoverIt?.pointable

    buffer.getLineColFromPoint(pos, true, lineCol)

    console.log(PointerEventMap[type])

    if (type === Move && downItem) {
      downItem[PointerEventMap[type]]?.()
      return
    }

    const items = this.findItemsAtPoint(pos)
    if (type !== Up && downItem) items.push(downIt)

    let itemIndex = -1
    let currentIt = items.at(itemIndex)!

    if (type === Up && downItem) {
      downItem.isDown = false
    }

    if (!downItem?.isDown && hoverIt !== currentIt) {
      this.hoverIt = currentIt

      if (hoverItem) {
        hoverItem.isHovering = false
        hoverItem.onLeave?.()
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
          downItem?.onClick?.()
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
    while (receiver && !receiver[handler]) {
      receiver = items.at(--itemIndex)
    }
    receiver?.[handler]?.()
  }
}
