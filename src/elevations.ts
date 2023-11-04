// log.active
import { $, fn, fx, of } from 'signal'
import { FixedArray, Point, Renderable } from 'std'
import { partialSort, poolArrayGet } from 'utils'
import { Comp } from './comp.ts'
import { Editor } from './editor.ts'
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
      get its() {
        const { eligible } = this
        const { point: p, ownElevations, colors } = of(it)
        const { elevations } = of(it.elevations)
        const { updated } = elevations
        const { x: px, y: py } = p
        $()

        ownElevations.clear()

        // ownElevations.clear()
        // this.updated++

        let x = 0

        // elevations
        for (let i = 0, el: $<Elevation>; i < elevations.count; i++) {
          el = elevations.array[i]

          if (!it.other?.ownElevations.has(el) && el.isPointWithin(p)) {
            eligible[x++] = el
          }
        }

        // return early
        if (!x) return []

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

        return [...ownElevations]
      }
      // @fn before() {
      //   const { colors } = of(it)
      //   for (const it of this.its) {
      //     it.colors = colors
      //   }
      // }
      // get its() {
      //   this.updated
      //   $()
      //   return [...it.ownElevations]
      // }
    }
    return $(new ElevationFillRenderable(it as Renderable.It, false))
  }
}

export class Elevations extends Comp
  implements Renderable.It {
  elevations = $(new FixedArray<$<Elevation>>)
  elevationsStack: SourceToken[] = []
  // elevations: $<Elevation>[] = []
  elevated: $<Point>[] = []

  get caretColors(): ElevationFill['colors'] {
    const it = this
    const { ctx } = of(it)
    const { skin } = of(ctx)
    return {
      color: skin.colors.brand1 + '66',
      light: skin.colors.fg,
      dark: skin.colors.bgDark015 + '33',
    }
  }
  get hoverColors(): ElevationFill['colors'] {
    const it = this
    const { ctx } = of(it)
    const { skin } = of(ctx)
    return {
      color: skin.colors.bgBright05 + '66',
      light: skin.colors.bgBright1,
      dark: skin.colors.bgDark015 + '66',
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
          // log('YES')
          // this.need |= Renderable.Need.Render
          // it.hover.fill.renderable.need |= Renderable.Need.Render
          // it.caret.fill.renderable.need |= Renderable.Need.Render
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
        const { charWidth } = of(dims)
        const { elevations, elevationsStack: stack } = of(it)
        const { tokens } = of(buffer)
        $()
        let top: SourceToken | undefined
        let count = 0
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
                count++,
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

        partialSort(
          elevations.array,
          elevations.count = count,
          byDepth
        )

        elevations.updated++
      }
      // @fn render(c: CanvasRenderingContext2D, t: number, clear?: boolean) {
      //   // log('RENDER ELEVATIONS')
      //   // // TODO: i dont think this is correct
      //   // if (this.need & Renderable.Need.Draw) return

      //   // const { rect, colors, dirtyRects } = of(this)
      //   // const { isTyping } = of(misc)
      //   // const { mouseable: { isHovering } } = of(text)

      //   // dirtyRects[0].zero()
      //   // dirtyRects[1].zero()
      //   // if (clear) {
      //   //   rect.clear(c)
      //   // }
      //   // c.save()
      //   // c.translate(scroll.x, scroll.y)
      //   it.drawnElevations.clear()
      //   // log('CLEAR ELEVATEIONS')
      //   // if (it.caretElevationPoint) this.drawElevation(
      //   //   c,
      //   //   it.caretElevationPoint,
      //   //   dirtyRects[0],
      //   //   colors.caret
      //   // )
      //   // if (!isTyping && isHovering) this.drawElevation(
      //   //   c,
      //   //   it.hoverElevationPoint,
      //   //   dirtyRects[1],
      //   //   colors.hover
      //   // )
      //   // // dirtyRect.pos.add(scroll)
      //   // c.restore()

      //   // this.needRender = false
      //   // this.needDraw = true
      //   this.need &= ~Renderable.Need.Render
      // }
      // @fn draw(c: CanvasRenderingContext2D) {
      //   const { canvas, rect, pr, dirtyRects } = of(this)
      //   for (const dr of dirtyRects) {
      //     dr.drawImage(canvas.el, c, pr)
      //   }
      //   this.needDraw = false
      // }

      get its() {
        const { isTyping } = of(misc)
        const { mouseable: { isHovering } } = of(text)

        const its = [it.caret.fill]

        if (!isTyping && isHovering) {
          its.push(it.hover.fill)
        }

        return [...new Set([...its.flatMap(x => x.renderable.its)])]
      }
    }
    return $(new ElevationsRenderable(it as Renderable.It, false))
  }
}
