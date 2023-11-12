// log.active
import { $, fn, fx, of, whenNot } from 'signal'
import { FixedArray, Point, Renderable } from 'std'
import { partialSort, poolArrayGet, unique } from 'utils'
import { Comp } from './comp.ts'
import { FillRange } from './fill-range.ts'
import { SourceToken } from './source.ts'
import { Open, byDepth, openers } from './util.ts'

export class Elevation extends FillRange {
  depth = 0
}

export class ElevationFill extends Comp
  implements Renderable.It {
  constructor(
    public elevations: Elevations,
    public colors: Elevation['colors'],
    public point: $<Point>,
  ) { super(elevations.ctx) }

  ownElevations = new Set<$<Elevation>>()

  other?: ElevationFill

  get renderable() {
    $()
    const it = this
    class ElevationFillRenderable extends Renderable {
      eligible: $<Elevation>[] = []
      ownElevationsHash = ''
      get its() {
        const { eligible } = this
        const { point: p, ownElevations, colors } = of(it)
        const { elevations } = of(it.elevations)
        const { updated } = elevations
        const { x: px, y: py } = p
        $()

        ownElevations.clear()

        let x = 0

        // elevations
        for (let i = 0, el: $<Elevation>; i < elevations.count; i++) {
          el = elevations.array[i]

          if (!it.other?.ownElevations.has(el) && el.isPointWithin(p)) {
            eligible[x++] = el
          }
        }

        // return early
        if (!x) {
          this.ownElevationsHash = ''
          return []
        }

        partialSort(eligible, x, (a, b) =>
          a.start.y === b.start.y
            ? a.start.x - b.start.x
            : a.start.y - b.start.y
        )

        const earliest = eligible[0]

        if (earliest) for (let i = 0; i < elevations.count; i++) {
          const el = elevations.array[i]
          if (earliest.isLineWithin(el)
            && !it.other?.ownElevations.has(el)
            && !ownElevations.has(el)
          ) {
            ownElevations.add(el)
          }
        }

        const latest = eligible[x - 1] //at(-1)

        if (latest
          && !it.other?.ownElevations.has(latest)
          && !ownElevations.has(latest)
        ) {
          ownElevations.add(latest)
        }

        ownElevations.forEach(el => {
          el.colors = colors
        })

        const ownElevationsArray = [...ownElevations]
        const ownElevationsHash = ownElevationsArray.map(el => `${el.text}`).join(' ')
        if (this.ownElevationsHash !== ownElevationsHash) {
          this.ownElevationsHash = ownElevationsHash
          ownElevations.forEach(el => {
            el.renderable.needDraw = true
          })
        }
        // console.log('YEAH', ownElevations)
        return [...ownElevations]
      }
    }
    return $(new ElevationFillRenderable(it as Renderable.It, false))
  }
}

export class Elevations extends Comp
  implements Renderable.It {
  elevations = $(new FixedArray<$<Elevation>>)
  elevationsStack: SourceToken[] = []
  elevated: $<Point>[] = []

  get caretColors(): ElevationFill['colors'] {
    const it = this
    const { ctx } = of(it)
    const { skin } = of(ctx)
    return {
      color: skin.colors.black,
      light: skin.colors.fg,
      dark: skin.colors.bgDark15,
    }
  }
  get hoverColors(): ElevationFill['colors'] {
    const it = this
    const { ctx } = of(it)
    const { skin } = of(ctx)
    return {
      color: skin.colors.black,
      light: skin.colors.bgBright2,
      dark: skin.colors.bgDark15,
    }
  }
  createElevationTarget(colors: ElevationFill['colors']) {
    const point = $(new Point)
    const fill = $(new ElevationFill(
      this,
      colors,
      point,
    ))
    return { point, fill }
  }
  get caret() {
    $()
    return this.createElevationTarget($(this).$.caretColors)
  }
  get hover() {
    $()
    const target = this.createElevationTarget($(this).$.hoverColors)
    target.fill.other = this.caret.fill
    return target
  }
  get renderable() {
    $()
    const it = this
    const { ctx } = of(it)
    const { skin, misc, buffer, dims, scroll, mouse, text, brackets } = of(ctx)
    class ElevationsRenderable extends Renderable {
      @fx update_points() {
        const { rect: r, pr } = of(this)
        // TODO: replace 'code' dependency with 'currentLineLength' when implemented
        const { line, col, code, hasBrackets, bracketsPair: { open } } = of(buffer)
        const { xy: oxy } = open
        const { lineTops, charWidth } = of(dims)
        const { isScrolling } = of(misc)
        const { scroll: { xy } } = of(scroll)
        const { linecol: { line: _l, col: _c } } = of(text)
        const { isHovering } = of(text.mouseable)

        $()

        // Don't update elevation points while user is scrolling.
        if (isScrolling) {
          return
        }

        const caret = hasBrackets ? open : buffer.linecol
        const hover = text.linecol

        it.caret.point.set(caret)
        it.hover.point.set(hover)
      }

      @fn createElevation = () => {
        return $(new Elevation(it.ctx))
      }

      @fx update_elevations() {
        const { isHandlingSlider } = whenNot(misc)
        const { charWidth } = of(dims)
        const { elevations, elevationsStack: stack } = of(it)
        const { tokens } = of(buffer)
        $()

        elevations.count = 0
        let top: SourceToken | undefined
        // i = length, we use it to avoid poping the stack array
        // because it is slower.
        let i = 0
        for (const t of tokens) {
          if (openers.has(t.text)) {
            top = t
            // t.text === '{'
            //   ? true
            //   : elevated.some((x) =>
            //     x.line === t.line && x.col === t.col
            //   )
            // ]
            // if (stack.length === i) {
            //   i = stack.push(top)
            // }
            // else {
            stack[i++] = top
            // }
          }
          else if (top && t.text === Open[top.text]) {
            const item = stack[--i]
            i = Math.max(0, i)
            top = stack[i - 1]
            if (item) {
              const start = item
              const end = t
              const el = poolArrayGet(
                elevations.array,
                elevations.count++,
                this.createElevation
              )
              el.start.col = start.col
              el.start.line = start.line
              el.end.col = end.col + 1
              el.end.line = end.line
              el.depth = i
            }
          }
        }

        elevations.sort(elevations.count, byDepth)
        elevations.updated++
      }
      get its() {
        const { isTyping } = of(misc)
        const { mouseable: { isHovering } } = of(text)

        const its = [it.caret.fill]

        if (!isTyping) {
          its.push(it.hover.fill)
        }

        return unique(
          its.flatMap(x =>
            x.renderable.its
          )
        )
      }
    }
    return $(new ElevationsRenderable(it as Renderable.It, false))
  }
}
