log.active
import { $, fn, fx } from 'signal'
import { Point } from 'std'
import { Comp } from './comp.ts'
import { AnimScrollStrategy } from './scroll.ts'
import { PointerLikeEvent } from 'utils'

export class Mouse extends Comp {
  hoveringLineCol = $(new Point)
  downCount = 0

  @fx handle_pointer_event() {
    const { ctx } = $.of(this)
    const { world, misc, buffer, scroll } = $.of(ctx)
    const { pointer } = $.of(world)
    const { event, pos, wheel, buttons, alt, ctrl, shift } = pointer
    $._()

    switch (event.type) {
      case 'move':
        break
      case 'wheel':
        break
      case 'down':
        break
      case 'up':
        break
      case 'leave':
        break
    }
  }

  @fx update_hovering() {
    const { ctx } = $.of(this)
    const { world, misc, buffer, scroll } = $.of(ctx)
    const { pointer } = $.of(world)
    const { lines } = $.of(buffer)
    const { x, y } = pointer.pos
    const { x: sx, y: sy } = scroll.pos
    $._()
    ctx.isHovering = pointer.pos.withinRect(ctx.rect)
    if (misc.isScrolling || misc.wasScrolling || !ctx.isHovering) return
    buffer.getLineColFromPoint(pointer.pos, true, this.hoveringLineCol)
  }
  @fx onWheel() {
    const { isHovering } = $.when(this.ctx)
    const { world: { pointer }, scroll } = $.of(this.ctx)
    const e = pointer.event
    const { deltaTimeStamp, deltaX, deltaY } = $.of(e)
    $._()
    if (e.type !== 'wheel') return
    scroll.targetScroll.y -= deltaY * 0.2
    scroll.targetScroll.x -= deltaX * 0.2
    scroll.animScrollStrategy = AnimScrollStrategy.Medium
  }
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
    const { hoveringLineCol: p, ctx } = $.of(this)
    const { buffer: b, selection } = $.of(ctx)
    selection.end.set(p)
    b.line = selection.end.y
    b.coli = selection.end.x
  }
  @fx onPointerDown() {
    const { isHovering } = $.when(this.ctx)
    const { hoveringLineCol: p, ctx } = $.of(this)
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
