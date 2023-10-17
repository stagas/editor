import { $, alias, fn, fx, init } from 'signal'
import { Point } from 'std'
import { Context } from './context'

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

export class Scroll {
  constructor(public ctx: Context) { }

  pos = $(new Point)
  scroll = alias(this, 'pos')
  minScroll = $(new Point)
  scrollSize = $(new Point)
  targetScroll = $(new Point)
  animScrollStrategy: AnimScrollStrategy = AnimScrollStrategy.Fast

  @fx updateMatrixTranslate() {
    const { misc, dims, world } = $.of(this.ctx)
    const { innerMatrix: m } = $.of(misc)
    const { scroll: { x, y } } = $.of(dims)
    const { pr } = $.of(world.screen)
    $.untrack()
    m.e = x * pr
    m.f = y * pr
  }

  @fx update_y() {
    const { buffer, dims } = $.of(this.ctx)
    const { rect, line } = $.of(dims)
    const { line, viewState } = $.of(buffer)


    if (prevViewState !== viewState) return

    const { targetScroll, lineTops, lineBottoms, lineHeight, scrollbarSize } = $

    const viewTop = -targetScroll.top
    const viewBottom = viewTop + rect.h + lineHeight

    let y = lineTops[line]!

    let dy

    dy = viewTop - y
    if (dy > 0) {
      $.animScrollStrategy = AnimScrollStrategy.Slow
      $.targetScroll.top += dy
    }
    else {
      if (!(line in lineBottoms)) {
        throw new Error('Invalid line state.')
      }
      y = lineBottoms[line] + lineHeight + scrollbarSize.h + 2
      dy = y - viewBottom
      if (dy > 0) {
        $.animScrollStrategy = AnimScrollStrategy.Slow
        $.targetScroll.top -= dy
      }
    }
  }
  .fx.last(({ $, rect, col, viewState, charWidth, targetScroll }) => {
  if ($.prevViewState !== viewState) return

  const viewLeft = -targetScroll.left
  const viewRight = viewLeft + rect.w

  let x = col * charWidth

  let dx

  dx = viewLeft - (x - charWidth * 10)
  if (dx > 0) {
    $.animScrollStrategy = AnimScrollStrategy.Slow
    $.targetScroll.left += dx
  }
  else {
    x += charWidth * 10
    dx = x - viewRight
    if (dx > 0) {
      $.animScrollStrategy = AnimScrollStrategy.Slow
      $.targetScroll.left -= dx
    }
  }
})
  .fx.auto(({ $, rect, innerSize, lineBottoms, overscrollX }) => {
  $.minScroll.top = -innerSize.h
    + Math.min(
      lineBottoms.at(-1) || 0,
      rect.h
    )
  $.minScroll.left = -Math.max(0, (innerSize.w - rect.w) + overscrollX)
})
  .fx.auto(({ $, targetScroll, minScroll }) => {
    $.targetScroll.top = Math.round(clamp(minScroll.top, 0,
      targetScroll.top
    ))
  })
  .fx.auto(({ $, targetScroll, minScroll }) => {
    $.targetScroll.left = Math.round(clamp(minScroll.left, 0,
      targetScroll.left
    ))
  })
  .fx.auto(({ $, scroll, minScroll }) => {
    $.scroll.top = clamp(minScroll.top, 0,
      scroll.top
    )
  })
  .fx.auto(({ $, scroll, minScroll }) => {
    $.scroll.left = clamp(minScroll.left, 0,
      scroll.left
    )
  })
  .fx.auto(({ $, innerSize, scrollSize, overscrollX }) => {
    const w = innerSize.w + overscrollX
    const h = innerSize.h
    $.done()
    scrollSize.w = w
    scrollSize.h = h
  })

}
