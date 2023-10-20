log.active
import { $, alias, fx } from 'signal'
import { Point } from 'std'
import { clamp } from 'utils'
import { Comp } from './comp.ts'

export interface AnimScrollStrategy {
  tension: number
  distance: number
  amount: number
  min: number
}

export const AnimScrollStrategy: Record<string, AnimScrollStrategy> = {
  "Fast": {
    "tension": 1,
    "distance": 100,
    "amount": 0.5,
    "min": 0.5
  },
  "Medium": {
    "tension": 2.93,
    "distance": 500,
    "amount": 0.6,
    "min": 0.25
  },
  "Slow": {
    "tension": 0.015,
    "distance": 1000,
    "amount": 0.29,
    "min": 0.01
  }
}

export class Scroll extends Comp {
  pos = $(new Point)
  x = this.pos.$.x
  y = this.pos.$.y
  scroll = alias(this, 'pos')
  minScroll = $(new Point)
  scrollSize = $(new Point)
  targetScroll = $(new Point)
  animScrollStrategy: AnimScrollStrategy = AnimScrollStrategy.Fast

  @fx update_innerMatrix_translation() {
    const { misc, dims, world } = $.of(this.ctx)
    const { innerMatrix: m } = $.of(misc)
    const { scroll: { x, y } } = $.of(dims)
    const { pr } = $.of(world.screen)
    $._()

    m.e = x * pr
    m.f = y * pr
  }

  @fx update_targetScroll_top() {
    const { history, buffer, dims } = $.of(this.ctx)
    const { rect } = $.of(dims)
    const { line } = $.of(buffer)
    const { viewState } = $.of(history)
    $._()

    if (history.prevViewState !== viewState) return

    const { lineTops, lineBottoms, lineHeight, scrollbarSize } = $.of(dims)
    const { targetScroll } = $.of(this)

    const viewTop = -targetScroll.top
    const viewBottom = viewTop + rect.h + lineHeight

    let y = lineTops[line]!

    let dy: number

    dy = viewTop - y
    if (dy > 0) {
      this.animScrollStrategy = AnimScrollStrategy.Slow
      targetScroll.top += dy
    }
    else {
      if (!(line in lineBottoms)) {
        throw new Error('Invalid line state.')
      }
      y = lineBottoms[line] + lineHeight + scrollbarSize.h + 2
      dy = y - viewBottom
      if (dy > 0) {
        this.animScrollStrategy = AnimScrollStrategy.Slow
        targetScroll.top -= dy
      }
    }
  }

  @fx update_targetScroll_left() {
    const { history, buffer, dims } = $.of(this.ctx)
    const { rect, charWidth } = $.of(dims)
    const { col } = $.of(buffer)
    const { viewState } = $.of(history)
    $._()

    if (history.prevViewState !== viewState) return

    const { targetScroll } = $.of(this)

    const viewLeft = -targetScroll.left
    const viewRight = viewLeft + rect.w

    let x = col * charWidth

    let dx: number

    dx = viewLeft - (x - charWidth * 10)
    if (dx > 0) {
      this.animScrollStrategy = AnimScrollStrategy.Slow
      targetScroll.left += dx
    }
    else {
      x += charWidth * 10
      dx = x - viewRight
      if (dx > 0) {
        this.animScrollStrategy = AnimScrollStrategy.Slow
        targetScroll.left -= dx
      }
    }
  }
  @fx update_minScroll() {
    const { ctx, minScroll } = $.of(this)
    const { dims } = $.of(ctx)
    const { rect, innerSize, lineBottoms, lineHeight, overscrollX } = $.of(dims)
    const { w, h } = $.of(innerSize)

    const top = -h
      + Math.min(
        lineBottoms.at(-1) || 0,
        rect.h
      )
    const left = -Math.max(0, (w - rect.w) + overscrollX)

    $._()

    minScroll.top = top
    minScroll.left = left
  }
  // TODO: for best experience we would need a `clampedScroll`
  // that the targetScroll animates to.
  // That will also make the edge bouncy.
  @fx clamp_targetScroll_top() {
    const { targetScroll, minScroll } = $.of(this)
    targetScroll.top = Math.round(
      clamp(
        minScroll.top,
        0,
        targetScroll.top
      )
    )
  }
  @fx clamp_targetScroll_left() {
    const { targetScroll, minScroll } = $.of(this)
    targetScroll.left = Math.round(
      clamp(
        minScroll.left,
        0,
        targetScroll.left
      )
    )
  }
  @fx clamp_scroll_top() {
    const { scroll } = $.of(this)
    scroll.top = Math.min(0, scroll.top)
  }
  @fx clamp_scroll_left() {
    const { scroll } = $.of(this)
    scroll.left = Math.min(0, scroll.left)
  }
  @fx update_scrollSize() {
    const { ctx, scrollSize } = $.of(this)
    const { dims } = $.of(ctx)
    const { innerSize, overscrollX } = $.of(dims)
    const w = innerSize.w + overscrollX
    const h = innerSize.h
    $.untrack()
    scrollSize.w = w
    scrollSize.h = h
  }
}
