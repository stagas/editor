log.active
import { $, fn, fx } from 'signal'
import { Point, PointerEventType } from 'std'
import { PointerLikeEvent } from 'utils'
import { Comp } from './comp.ts'
import { AnimScrollStrategy } from './scroll.ts'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'

export class Mouse extends Comp {
  lineCol = $(new Point)

  isDown = false
  downCount = 0
  downPos = $(new Point)
  downTime = 0

  @fx handle_pointer_event() {
    const { ctx, lineCol } = $.of(this)
    const { world, misc, buffer, scroll, selection, input: { textarea } } = $.of(ctx)
    const { pointer } = $.of(world)
    const { time } = pointer
    $._()
    const { event, type, pos, wheel, buttons, alt, ctrl, shift } = pointer

    ctx.isHovering = pos.withinRect(ctx.rect)

    buffer.getLineColFromPoint(pos, true, lineCol)

    switch (type) {
      case PointerEventType.Move:
        break

      case PointerEventType.Wheel:
        scroll.targetScroll.mulSub(wheel, 0.2)
        scroll.animScrollStrategy = AnimScrollStrategy.Medium
        break

      case PointerEventType.Down:
        if (time - this.downTime < DOUBLE_CLICK_MS) {
          this.downCount++
        }
        else {
          this.downCount = 1
        }
        this.isDown = true
        this.downPos.set(pos)
        this.downTime = event.timeStamp

        buffer.lineCol.set(lineCol)

        switch (this.downCount) {
          case 1:
            selection.resetTo(lineCol)
            break

          case 2:
            if (selection.selectWordBoundary(lineCol)) {
              break
            }
          case 3:
            if (selection.selectMatchingBrackets(lineCol)) {
              break
            }
          case 4:
            selection.selectLine(lineCol.line)
            break
        }
        break

      case PointerEventType.Up:
        this.isDown = false
        if (time - this.downTime < SINGLE_CLICK_MS) {
          //on click
        }
        textarea.focus()
        break

      case PointerEventType.Leave:
        ctx.isHovering = false
        break
    }
  }

  // @fx update_hovering() {
  //   const { ctx } = $.of(this)
  //   const { world, misc, buffer, scroll } = $.of(ctx)
  //   const { pointer } = $.of(world)
  //   const { lines } = $.of(buffer)
  //   const { x, y } = pointer.pos
  //   const { x: sx, y: sy } = scroll.pos
  //   $._()
  //   ctx.isHovering = pointer.pos.withinRect(ctx.rect)
  //   if (misc.isScrolling || misc.wasScrolling || !ctx.isHovering) return
  //   buffer.getLineColFromPoint(pointer.pos, true, this.lineCol)
  // }
  // @fx onWheel() {
  //   const { isHovering } = $.when(this.ctx)
  //   const { world: { pointer }, scroll } = $.of(this.ctx)
  //   const e = pointer.event
  //   const { deltaTimeStamp, deltaX, deltaY } = $.of(e)
  //   $._()
  //   if (e.type !== 'wheel') return
  //   scroll.targetScroll.y -= deltaY * 0.2
  //   scroll.targetScroll.x -= deltaX * 0.2
  //   scroll.animScrollStrategy = AnimScrollStrategy.Medium
  // }
  @fn onPointerUp() {
    const { input: { textarea } } = $.of(this.ctx)
    textarea.focus()
  }
  @fx onPointerMove(e: PointerLikeEvent) {
    const { isHovering } = $.when(this.ctx)
    $._()
    if (e.type !== 'pointermove') return
    this.ctx.misc.isTyping = false
  }
  // TODO: holdMove?
  @fn onWindowMove(e: PointerLikeEvent) {
    const { lineCol: p, ctx } = $.of(this)
    const { buffer: b, selection } = $.of(ctx)
    selection.end.set(p)
    b.line = selection.end.y
    b.coli = selection.end.x
  }
  @fx onPointerDown() {
    const { isHovering } = $.when(this.ctx)
    const { lineCol: p, ctx } = $.of(this)
    const { world: { pointer }, buffer: b, selection } = $.of(ctx)
    const { event: e } = $.of(pointer)

    $.untrack()

    if (e.type !== 'pointerdown') return

    b.getLineColFromPoint(pointer.pos, true, p)
    b.line = p.y
    b.coli = p.x

    selection.start.set(p)
    selection.end.set(p)

    switch (++this.downCount) {
      case 2:
        if (selection.selectWordBoundary(p)) {
          break
        }
      case 3:
        if (selection.selectMatchingBrackets(p)) {
          break
        }
      case 4:
        selection.selectLine(p.y)
        break
    }
  }

}
