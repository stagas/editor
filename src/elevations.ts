// log.active
import { $, fn, fx } from 'signal'
import { Point } from 'std'
import { poolArrayGet } from 'utils'
import { Comp } from './comp.ts'
import { Range } from './range.ts'
import { Renderable } from './renderable.ts'
import { SourceToken } from './source.ts'
import { Open, openers } from './util.ts'

const colors = {
  hover: {
    fill: '#ffffff05',
    light: '#fff4',
    dark: '#fff2',
  },
  caret: {
    fill: '#7755ff18',
    light: '#75f7',
    dark: '#75f4',
  }
}

export class Elevation extends Range {
  depth = 0
}

export class Elevations extends Comp {
  elevations: $<Elevation>[] = []
  elevated: $<Point>[] = []
  drawnElevations: Set<$<Elevation>> = new Set()
  hoverElevationPoint = $(new Point)
  caretElevationPoint?: Point
  elevationsPool: $<Elevation>[] = []
  elevationsStack: SourceToken[] = []
  get renderable() {
    $()
    const it = this
    const { ctx, drawnElevations } = $.of(it)
    const { misc, buffer, dims, scroll, input: { mouse }, brackets } = $.of(ctx)
    class ElevationsRenderable extends Renderable {
      @fx trigger_needRender() {
        const { rect: r } = $.of(this)
        // TODO: replace 'code' dependency with 'currentLineLength' when implemented
        const { line, col, code, hasBrackets, bracketsPair: { open } } = $.of(buffer)
        const { xy: oxy } = open
        const { lineTops, charWidth } = $.of(dims)
        const { isScrolling } = $.of(misc)
        const { scroll: { xy } } = $.of(scroll)
        const { linecol: { line: _l, col: _c } } = $.of(mouse)
        const { isHovering } = $.of(ctx.pointable)
        $()

        if (isScrolling) {
          this.needRender = true
          return
        }

        it.hoverElevationPoint.set(mouse.linecol)
        it.caretElevationPoint = hasBrackets ? open : buffer.linecol

        this.needRender = true
      }

      @fx update_elevations() {
        const { elevationsPool, elevationsStack: stack } = $.of(it)
        const { tokens } = $.of(buffer)
        $()

        let top: SourceToken | undefined
        const elevations: $<Elevation>[] = []
        // needle = length, we use it to avoid poping the stack array
        // because it is slower.
        let needle = 0
        for (const t of tokens) {
          if (openers.has(t.text)) {
            top = t
            // t.text === '{'
            //   ? true
            //   : elevated.some((x) =>
            //     x.line === t.line && x.col === t.col
            //   )
            // ]
            if (stack.length === needle) {
              needle = stack.push(top)
            }
            else {
              stack[needle++] = top
            }
          }
          else if (top && t.text === Open[top.text]) {
            const item = stack[--needle]
            needle = Math.max(0, needle)
            top = stack[needle - 1]
            if (item) {
              const start = item
              const end = t
              const el = poolArrayGet(elevationsPool, elevations.length, () => $(new Elevation))
              el.start.col = start.col
              el.start.line = start.line
              el.end.col = end.col + 1
              el.end.line = end.line
              el.depth = needle
              elevations.push(el)
            }
          }
        }
        it.elevations = elevations.sort((a, b) =>
          a.depth - b.depth
        )
      }

      @fn drawElevation(c: CanvasRenderingContext2D, p: Point, colors: any) {
        const { elevations } = $.of(it)

        const eligible: $<Elevation>[] = []

        // elevations
        for (let i = 0, el: $<Elevation>; i < elevations.length; i++) {
          el = elevations[i]

          if (el.isPointWithin(p)) {
            eligible.push(el)
          }
        }

        eligible.sort((a, b) =>
          a.start.y === b.start.y
            ? a.start.x - b.start.x
            : a.start.y - b.start.y
        )

        const [earliest] = eligible

        if (earliest) for (let i = 0; i < elevations.length; i++) {
          const el = elevations[i]
          if (earliest.isLineWithin(el)) {
            if (drawnElevations.has(el)) continue
            drawnElevations.add(el)
            buffer.fillTextRange(
              c,
              el,
              colors.fill,
              true,
              2,
              colors.light,
              colors.dark,
            )
            console.log(c.canvas)
            console.log('FILL!', el.text)
          }
        }

        const latest = eligible.at(-1)

        if (latest && !drawnElevations.has(latest)) {
          drawnElevations.add(latest)
          buffer.fillTextRange(
            c,
            latest,
            colors.fill,
            true,
            2,
            colors.light,
            colors.dark,
          )
          console.log('FILL!')
        }
      }
      @fn render(t: number, c: CanvasRenderingContext2D, clear?: boolean) {
        const { rect } = $.of(this)
        const { isTyping } = $.of(misc)
        if (clear) {
          rect.clear(c)
        }
        c.save()
        c.translate(scroll.x, scroll.y)
        it.drawnElevations.clear()
        if (it.caretElevationPoint) this.drawElevation(c, it.caretElevationPoint, colors.caret)
        if (!isTyping) this.drawElevation(c, it.hoverElevationPoint, colors.hover)
        c.restore()

        this.needRender = false
        this.needDraw = true
      }
      @fn draw(t: number, c: CanvasRenderingContext2D) {
        const { canvas, rect, pr } = $.of(this)
        rect.drawImage(canvas.el, c, pr, true)
        this.needDraw = false
      }

    }
    return $(new ElevationsRenderable(this.ctx))
  }
}
