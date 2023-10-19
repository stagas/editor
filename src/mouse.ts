log.active
import { $, fn, fx } from 'signal'
import { Point, PointerEventType } from 'std'
import { prevent } from 'utils'
import { Comp } from './comp.ts'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { AnimScrollStrategy } from './scroll.ts'
import { Pointable } from './pointable.ts'
import { Render } from './render.ts'

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

  // isDown = false
  downCount = 0
  downTime = 0
  downPos = $(new Point)

  hoverItem?: Pointable | null
  downItem?: Pointable | null | undefined

  @fn findItemByPoint(p: Point): Pointable {
    const { ctx } = $.of(this)
    const { pointerTargets, text } = $.of(ctx)

    let item: Pointable | false | undefined

    for (const target of pointerTargets) {
      if (item = target.pointable.getItemAtPoint(p)) {
        return item
      }
    }

    return text.pointable
  }

  @fx handle_pointer_event() {
    const { ctx } = $.of(this)
    const { world, pointerTargets } = $.of(ctx)
    const { pointer } = $.of(world)
    const { time } = $.of(pointer)
    $._()
    const { type, pos } = pointer
    const { downItem, hoverItem } = this

    if (type === Move && downItem) {
      downItem[PointerEventMap[type]]?.()
      return
    }

    let currentItem =
      (type !== Up && downItem)
      || (this.findItemByPoint(pos))

    if (type === Up && downItem) {
      downItem.it.isDown = false
    }

    if (!downItem?.it.isDown && hoverItem !== currentItem) {
      this.hoverItem = currentItem

      if (hoverItem) {
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
        ctx.isHovering = false
        pointerTargets.forEach(t =>
          t.isHovering = false
        )
        break
    }

    currentItem[PointerEventMap[type]]?.()
  }
  // get pointable(): $<Pointable> {
  //   $._()
  //   const { ctx, lineCol } = $.of(this)
  //   const { world, buffer, scroll, selection, input: { textarea },
  //     pointerTargets } = $.of(ctx)
  //   const { pointer } = $.of(world)
  //   const { pos, wheel } = pointer

  //   return $(new Pointable(ctx), <Pointable>{
  //     isHovering: $(ctx).$.isHovering,
  //     getItemAtPoint: (p) => {
  //       return ctx.rect.isPointWithin(p) && ctx
  //     },
  //     onWheel: () => {
  //       scroll.targetScroll.mulSub(wheel, 0.2)
  //       scroll.animScrollStrategy = AnimScrollStrategy.Medium
  //     },
  //     onMove: () => {
  //       if (ctx.isDown) {
  //         selection.end.set(lineCol)
  //         buffer.lineCol.set(lineCol)
  //         buffer.coli = lineCol.col
  //       }
  //     },
  //     onDown: () => {
  //       const { time, real, shift } = $.of(pointer)

  //       prevent(real)

  //       ctx.isDown = true

  //       if (time - this.downTime < DOUBLE_CLICK_MS) {
  //         this.downCount++
  //       }
  //       else {
  //         this.downCount = 1
  //       }
  //       this.downTime = time

  //       this.downPos.set(pos)

  //       buffer.lineCol.set(lineCol)
  //       buffer.coli = lineCol.col

  //       switch (this.downCount) {
  //         case 1:
  //           if (shift) {
  //             selection.end.set(lineCol)
  //           }
  //           else {
  //             selection.resetTo(lineCol)
  //           }
  //           break

  //         case 2:
  //           if (selection.selectWordBoundary(lineCol, shift)) {
  //             this.downCount = 2
  //             break
  //           }
  //         case 3:
  //           if (selection.selectMatchingBrackets(lineCol)) {
  //             this.downCount = 3
  //             break
  //           }
  //         case 4:
  //           selection.selectLine(lineCol.line)
  //           break
  //       }
  //     },
  //     onUp: () => {
  //       const { time } = $.of(pointer)

  //       ctx.isDown = false
  //       this.downItem = null
  //       if (time - this.downTime < SINGLE_CLICK_MS) {
  //         //on click
  //       }
  //       textarea.focus()
  //     },
  //     onLeave: () => {
  //       ctx.isHovering = false
  //       pointerTargets.forEach(t =>
  //         t.isHovering = false
  //       )
  //     }
  //   })
  // }

  // @fx handle_pointer_event() {
  //   const { ctx, lineCol } = $.of(this)
  //   const { world, misc, buffer, dims, scroll,
  //     selection, input: { textarea },
  //     pointerTargets } = $.of(ctx)
  //   const { charWidth } = $.of(dims)
  //   const { lines } = $.of(buffer)
  //   const { pointer } = $.of(world)
  //   const { time, real } = $.of(pointer)
  //   $._()
  //   const { event, type, pos, wheel, buttons, alt, ctrl, shift } = pointer

  //   // if (!this.downItem || type === PointerEventType.Up) {
  //   //   out: {
  //   //     let hoverItem
  //   //     for (const target of pointerTargets) {
  //   //       if (hoverItem = target.pointable.getItemAtPoint(pos)) {
  //   //         if (hoverItem !== this.hoverItem) {
  //   //           if (this.hoverItem) {
  //   //             this.hoverItem.isHovering = false
  //   //           }
  //   //           this.hoverItem = hoverItem
  //   //           this.hoverItem.isHovering = true
  //   //         }
  //   //         break out
  //   //       }
  //   //     }
  //   //     if (this.hoverItem) {
  //   //       this.hoverItem.isHovering = false
  //   //     }
  //   //     this.hoverItem = null
  //   //   }
  //   // }

  //   // if (!ctx.isHovering) {
  //   //   if (type === PointerEventType.Down) {
  //   //     this.isDown = true
  //   //     this.downItem = this.hoverItem
  //   //   }
  //   //   if (this.downItem) {
  //   //     switch (type) {
  //   //       case PointerEventType.Down:
  //   //         this.downItem.onDown?.()
  //   //         return

  //   //       case PointerEventType.Move:
  //   //         this.downItem.onMove?.()
  //   //         return

  //   //       case PointerEventType.Up:
  //   //         this.isDown = false
  //   //         this.downItem.isHovering = false
  //   //         this.downItem = null
  //   //         return

  //   //       case PointerEventType.Leave:
  //   //         this.downItem.isHovering = false
  //   //         return
  //   //     }
  //   //   }
  //   // }

  //   // ctx.isHovering = pos.withinRect(ctx.rect)

  //   // buffer.getLineColFromPoint(pos, true, lineCol)

  //   // switch (type) {
  //   //   case PointerEventType.Move:
  //   //     if (this.isDown) {
  //   //       selection.end.set(lineCol)
  //   //       buffer.lineCol.set(lineCol)
  //   //       buffer.coli = lineCol.col
  //   //     }
  //   //     break

  //   //   case PointerEventType.Wheel:
  //   //     scroll.targetScroll.mulSub(wheel, 0.2)
  //   //     scroll.animScrollStrategy = AnimScrollStrategy.Medium
  //   //     break

  //   //   case PointerEventType.Down:
  //   //     prevent(real)
  //   //     this.isDown = true

  //   //     if (time - this.downTime < DOUBLE_CLICK_MS) {
  //   //       this.downCount++
  //   //     }
  //   //     else {
  //   //       this.downCount = 1
  //   //     }
  //   //     this.downTime = time

  //   //     this.downPos.set(pos)

  //   //     buffer.lineCol.set(lineCol)
  //   //     buffer.coli = lineCol.col

  //   //     switch (this.downCount) {
  //   //       case 1:
  //   //         if (shift) {
  //   //           selection.end.set(lineCol)
  //   //         }
  //   //         else {
  //   //           selection.resetTo(lineCol)
  //   //         }
  //   //         break

  //   //       case 2:
  //   //         if (selection.selectWordBoundary(lineCol, shift)) {
  //   //           this.downCount = 2
  //   //           break
  //   //         }
  //   //       case 3:
  //   //         if (selection.selectMatchingBrackets(lineCol)) {
  //   //           this.downCount = 3
  //   //           break
  //   //         }
  //   //       case 4:
  //   //         selection.selectLine(lineCol.line)
  //   //         break
  //   //     }
  //   //     break

  //   //   case PointerEventType.Up:
  //   //     this.isDown = false
  //   //     this.downItem = null
  //   //     if (time - this.downTime < SINGLE_CLICK_MS) {
  //   //       //on click
  //   //     }
  //   //     textarea.focus()
  //   //     break

  //   //   case PointerEventType.Leave:
  //   //     ctx.isHovering = false
  //   //     pointerTargets.forEach(t =>
  //   //       t.isHovering = false
  //   //     )
  //   //     break
  //   // }
  // }
}
