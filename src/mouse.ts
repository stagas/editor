log.active
import { $, fn, fx } from 'signal'
import { Point } from 'std'
import { Comp } from './comp.ts'
import { AnimScrollStrategy } from './scroll.ts'
import { PointerLikeEvent } from 'utils'

export class Mouse extends Comp {
  hoveringLineCol = $(new Point)
  @fx update_hovering() {
    const { ctx } = $.of(this)
    const { world, misc, buffer, scroll } = $.of(ctx)
    const { pointer } = $.of(world)
    const { lines} = $.of(buffer)
    const { x, y } = pointer.pos
    const { x: sx, y: sy } = scroll.pos
    $.untrack()
    if (misc.isScrolling || misc.wasScrolling || !ctx.isHovering) return
    buffer.getLineColFromPoint(pointer.pos, true, this.hoveringLineCol)
  }
  @fx onWheel () {
    const { world: { pointer }, scroll } = $.of(this.ctx)
    const e = pointer.event
    const { deltaTimeStamp, deltaX, deltaY } = $.of(e)
    $.untrack()
    scroll.targetScroll.y -= e.deltaY * 0.2
    scroll.targetScroll.x -= e.deltaX * 0.2
    scroll.animScrollStrategy = AnimScrollStrategy.Medium
  }
  @fn onPointerUp(){
    const { input: { textarea } } = $.of(this.ctx)
    textarea.focus()
  }
  @fn onPointerMove(e: PointerLikeEvent) {
    this.ctx.misc.isTyping = false
  }
  @fn onWindowMove(e: PointerLikeEvent) {
    const { hoveringLineCol: p, ctx } = $.of(this)
    const { buffer: b, selection } = $.of(ctx)
    selection.end.set(p)
    b.line = selection.end.y
    b.coli = selection.end.x
  }
  @fn onPointerDown (e: PointerEvent) {
    const { hoveringLineCol: p, ctx } = $.of(this)
    const { world: { pointer }, buffer: b, selection } = $.of(ctx)

    e.preventDefault()

    b.getLineColFromPoint(pointer.pos, true, p)
    b.line = p.y
    b.coli = p.x

    selection.start.set(p)
    selection.end.set(p)

    switch (pointer.downCount) {
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
