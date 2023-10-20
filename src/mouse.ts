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

  hoverItem?: Pointable | null
  downItem?: Pointable | null | undefined

  @fn findItemsAtPoint(p: Point): Pointable[] {
    const { ctx } = $.of(this)
    const { pointerTargets, text } = $.of(ctx)
    const items: Pointable[] = [text.pointable]

    let item: Pointable | false | undefined
    for (const target of pointerTargets) {
      if (item = target.pointable.getItemAtPoint(p)) {
        items.push(item)
      }
    }

    return items
  }

  @fx handle_pointer_event() {
    const { ctx } = $.of(this)
    const { world, buffer, pointerTargets, input, text, scrollbars, dims } = $.of(ctx)
    const { charWidth } = $.of(dims)
    const { mouse } = $.of(input)
    const { pointable } = $.of(text)

    scrollbars.items.forEach(x => {
      const { pointable } = $.of(x)
    })

    const { pointer } = $.of(world)
    const { time, real } = $.of(pointer)
    $._()
    const { type, pos } = pointer
    const { lineCol, downItem, hoverItem } = this

    buffer.getLineColFromPoint(pos, true, lineCol)

    console.log(PointerEventMap[type])

    if (type === Move && downItem) {
      downItem[PointerEventMap[type]]?.()
      return
    }

    const items = this.findItemsAtPoint(pos)
    if (type !== Up && downItem) items.push(downItem)

    let itemIndex = -1
    let currentItem = items.at(itemIndex)!

    if (type === Up && downItem) {
      downItem.it.isDown = false
    }

    console.log('HNMM', hoverItem?.it, currentItem.it)
    if (!downItem?.it.isDown && hoverItem !== currentItem) {
      this.hoverItem = currentItem

      if (hoverItem) {
        console.log('WHAT', hoverItem.it, hoverItem.it.isHovering)
        hoverItem.it.isHovering = false
        hoverItem.onLeave?.()
      }

      if (this.hoverItem) {
        this.hoverItem.it.isHovering = true
        world.screen.cursor = this.hoverItem.cursor
        this.hoverItem.onEnter?.()
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
        this.downItem = currentItem
        this.downItem.it.isDown = true
        currentItem.onDown?.(this.downCount)
        return

      case PointerEventType.Up:
        this.downItem = null
        if (time - this.downTime < SINGLE_CLICK_MS) {
          downItem?.onClick?.()
          return
        }
        break

      case PointerEventType.Leave:
        pointerTargets.forEach(t => {
if (t.isHovering) {console.log("YOO", t)}
          t.isHovering = false
        })
        break
    }

    const handler = PointerEventMap[type]
    let receiver: Pointable | undefined = currentItem
    while (receiver && !receiver[handler]) {
      receiver = items.at(--itemIndex)
    }
    receiver?.[handler]?.()
  }
}
