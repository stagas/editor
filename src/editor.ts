// log.active
import { $, fn, fx, init, nu } from 'signal'
import { Point, Scene } from 'std'
import { clamp, luminate as lum, prevent, saturate as sat } from 'utils'
import { Brackets } from './brackets.ts'
import { Buffer } from './buffer.ts'
import { Caret } from './caret.ts'
import { Clipboard } from './clipboard.ts'
import { Dims } from './dims.ts'
import { History } from './history.ts'
import { Input } from './input.ts'
import { Misc } from './misc.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './renderable.ts'
import { Scroll } from './scroll.ts'
import { Scrollbars } from './scrollbars.ts'
import { Selection } from './selection.ts'
import { Text } from './text.ts'
import { WidgetLike } from './widgets.ts'

interface PointerItem { }

class Skin {
  get colors() {
    const fg = '#aaa' //theme.brightWhite
    const bg = '#111' //theme.background
    const colors = {
      fg,
      bg,
      bgBright015: lum(bg, 0.015),
      bgBright025: lum(bg, 0.025),
      bgBright05: lum(bg, 0.05),
      bgBright1: lum(bg, 0.1),
      bgBright15: lum(bg, 0.15),
      bgBright2: lum(bg, 0.2),
      bgBright25: lum(bg, 0.25),
      bgBright3: lum(bg, 0.3),
      bgBright35: lum(bg, 0.35),
      sliderFill: '#f61',
      sliderActiveFill: sat(lum(bg, 0.5), 0.6),
      sliderActiveStroke: sat(lum(bg, 0.15), -0.05),
      sliderActiveHover: sat(lum(bg, 0.45), -0.25),

      // black: '#080808',
      // white: theme.white,
      // grey: luminate(saturate(theme.white, -1), -0.39),
      // dark: luminate(saturate(theme.white, -1), -0.5),
      // ...theme
    }

    return colors
    // {
    //   bg: '#111',
    //   bgBright015: '#113',
    //   bgBright1: '#337',
    //   bgBright2: '#558',
    //   bgBright25: '#669',
    // }
  }
  fonts = {
    sans: '"Jost", sans-serif',
    mono: '"JetBrains Mono", monospace',
  }
}

export class Editor extends Scene {
  misc = $(new Misc)
  skin = $(new Skin)
  history = $(new History(this))
  buffer = $(new Buffer(this, { Type: {} }))
  scroll = $(new Scroll(this))
  dims = $(new Dims(this))
  input = $(new Input(this))
  clipboard = $(new Clipboard(this))

  // renderables
  selection = $(new Selection(this))
  text = $(new Text(this))
  brackets = $(new Brackets(this), {
    renderable: { position: Renderable.Position.Scroll }
  })
  caret = $(new Caret(this), {
    blink: false,
    renderable: { position: Renderable.Position.Scroll }
  })
  scrollbars = $(new Scrollbars(this))

  sub: (WidgetLike | (WidgetLike & PointerItem))[] = []
  deco: WidgetLike[] = []

  @nu get renderables(): Renderable.It[] {
    const t = $.of(this)
    return [
      t.selection,
      t.text,
      t.brackets,
      t.caret,
      t.scrollbars,
    ]
  }
  @nu get pointables(): (Renderable.It & Pointable.It)[] {
    const t = $.of(this)
    return [
      this,
      t.text,
      t.scrollbars,
    ]
  }
  get pointable() {
    $()
    const it = this
    const { world: { pointer } } = $.of(it)
    class EditorPointable extends Pointable {
      hitArea = it.renderable.rect
      @fx update_hovering() {
        this.isHovering = it.pointables.some(s =>
          s.pointable.isHovering
        )
      }
      @fn onMenu() {
        const { real } = $.of(pointer)
        prevent(real)
      }
    }
    return $(new EditorPointable(this))
  }
  get renderable() {
    $()
    const it = this
    const { world: { anim }, misc, scroll } = $.of(it)
    const { targetScroll, pos: scrollPos } = $.of(scroll)
    const d = $(new Point)
    const ad = $(new Point)
    class EditorRenderable extends Renderable {
      @init init_Editor() {
        this.canvas.fullWindow = true
      }
      @fx trigger_needDraw() {
        const { renderables } = $.of(it)
        let needSelfDraw = false
        for (const { renderable: r } of renderables) {
          const { needRender, needDraw } = r
          needSelfDraw ||= needRender || needDraw || false
        }
        if (needSelfDraw) {
          $()
          this.needDraw = true
        }
      }
      @fx trigger_needUpdate_on_scroll() {
        const needUpdate =
          Math.round(scrollPos.top) !== targetScroll.top ||
          Math.round(scrollPos.left) !== targetScroll.left

        if (needUpdate) {
          $()
          this.needUpdate = true
        }
      }
      @fx trigger_anim_on_need() {
        const { needInit, needUpdate, needDraw } = this
        if (needInit || needUpdate || needDraw) {
          if (!anim.isAnimating) {
            $()
            anim.start()
          }
        }
      }
      @fn initCanvas() {
        const { c } = $.of(this.canvas)
        c.imageSmoothingEnabled = false
        for (const { renderable: r } of it.renderables) {
          r.needInit && r.initCanvas(r.canvas.c)
        }
        this.needInit = false
      }
      @fn update() {
        const { isTyping } = $.of(misc)
        const { animSettings } = $.of(scroll)

        d.set(targetScroll).sub(scrollPos)
        ad.set(d).abs()

        // TODO: bezier? need to save eventTime to make the normal t
        // will need a lerped t to smooth out changes
        const { distance, tension, amount, min } =
          (ad.x + ad.y > 55)
            || isTyping
            // || $.isHandlingScrollbar
            ? animSettings
            : Scroll.AnimSettings.Slow

        let isScrolling = false
        if (ad.y > 1) {
          scrollPos.y += d.y * (clamp(0, 1, (ad.y / distance)) ** tension * amount + min)
          isScrolling = true
        }
        else if (d.y) {
          scrollPos.y = targetScroll.y
        }

        if (ad.x > 1) {
          scrollPos.x += d.x * (clamp(0, 1, (ad.x / distance)) ** tension * amount + min)
          isScrolling = true
        }
        else if (d.x) {
          scrollPos.x = targetScroll.x
        }

        misc.wasScrolling = misc.isScrolling
        misc.isScrolling = isScrolling

        // check if we need further updates
        // let needUpdate = isScrolling

        if (!isScrolling) {
          this.needUpdate = false
          this.needDraw = true
          return 0 // does not need next frame
        }
        else {
          this.needDirectDraw = true
          this.needDraw = true
          return 1 // need next frame
        }
        // console.log(this.needUpdate)
        // return +this.needUpdate
      }
      @fn draw(t: number) {
        const { renderables, scroll, skin, dims: { viewSpan } } = $.of(it)
        const { rect, canvas } = $.of(this)
        const { c } = canvas
        const { Layout, Scroll } = Renderable.Position

        rect.fill(c, skin.colors.bg)

        let position: Renderable.Position = Layout

        for (const { renderable: r } of renderables) {
          if (r.position !== position) {
            if (r.position === Scroll) {
              c.save()
              scroll.pos.translate(c)
            }
            else {
              c.restore()
            }
            position = r.position
          }

          const viewRect = r.viewRect ?? r.rect

          if (position === Scroll) {
            if (
              viewRect.bottom < viewSpan.top
              || viewRect.top > viewSpan.bottom
            ) continue

            r.needInit && r.initCanvas(r.canvas.c)
            r.needRender && r.render(t, r.canvas.c, true)
            r.draw(t, c)
          }
          else if (position === Layout) {
            if (this.needDirectDraw) {
              c.save()
              r.initCanvas(c)
              r.render(t, c, false)
              c.restore()
              // when we finish the direct layout draws,
              // we need the items to also render their own canvas.
              r.needInit = r.needRender = true
            }
            else {
              r.needInit && r.initCanvas(r.canvas.c)
              r.needRender && r.render(t, r.canvas.c, true)
              r.draw(t, c)
            }
          }
        }

        if (position === Scroll) {
          c.restore()
        }

        this.needDirectDraw
          = this.needDraw
          = false
      }
    }
    return $(new EditorRenderable(this))
  }
}
