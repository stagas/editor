// log.active
import { $, fn, fx } from 'signal'
import { Point, PointerEventType } from 'std'
import { Comp } from './comp.ts'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Pointable as Pointable.It } from './pointable.ts'

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
    const { lineCol, downIt: downItem, hoverIt: hoverItem } = this

    buffer.getLineColFromPoint(pos, true, lineCol)

    // console.log(PointerEventMap[type])

    if (type === Move && downItem) {
      downItem[PointerEventMap[type]]?.()
      return
    }

    const items = this.findItemsAtPoint(pos)
    if (type !== Up && downItem) items.push(downItem)

    let itemIndex = -1
    let currentItem = items.at(itemIndex)!

    if (type === Up && downItem) {
      downItem.isDown = false
    }

    if (!downItem?.isDown && hoverItem !== currentItem) {
      this.hoverIt = currentItem

      if (hoverItem) {
        hoverItem.isHovering = false
        hoverItem.onLeave?.()
      }

      if (this.hoverIt) {
        this.hoverIt.isHovering = true
        world.screen.cursor = this.hoverIt.cursor
        this.hoverIt.onEnter?.()
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
        this.downIt = currentItem
        this.downIt.isDown = true
        currentItem.onDown?.(this.downCount)
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
          this.hoverIt.isHovering = false
          this.hoverIt = null
        }
        pointables.forEach(t =>
          t.pointable.isHovering = false
        )
        break
    }

    const handler = PointerEventMap[type]
    let receiver: Pointable.It | undefined = currentItem
    while (receiver && !receiver[handler]) {
      receiver = items.at(--itemIndex)
    }
    receiver?.[handler]?.()
  }
}
