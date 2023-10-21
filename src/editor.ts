// log.active
import { $, fn, fx, init } from 'signal'
import { Point, Scene } from 'std'
import { clamp, prevent } from 'utils'
import { Brackets } from './brackets.ts'
import { Buffer } from './buffer.ts'
import { Caret } from './caret.ts'
import { Clipboard } from './clipboard.ts'
import { Dims } from './dims.ts'
import { Elevations } from './elevations.ts'
import { History } from './history.ts'
import { Input } from './input.ts'
import { Misc } from './misc.ts'
import { Mouse } from './mouse.ts'
import { Pointable } from './pointable.ts'
import { Renderable } from './renderable.ts'
import { Scroll } from './scroll.ts'
import { Scrollbars } from './scrollbars.ts'
import { Selection } from './selection.ts'
import { Text } from './text.ts'
import { Widget } from './widget.ts'

export class Editor extends Scene {
  // core
  get skin() { return this.world.skin }
  misc = $(new Misc)
  history = $(new History(this))
  buffer = $(new Buffer(this, { Type: {} }))
  scroll = $(new Scroll(this))
  dims = $(new Dims(this))
  input = $(new Input(this))
  clipboard = $(new Clipboard(this))

  // renderables
  selection = $(new Selection(this))
  elevations = $(new Elevations(this))
  text = $(new Text(this))
  brackets = $(new Brackets(this), {
    renderable: { position: Renderable.Position.Scroll }
  })
  caret = $(new Caret(this), {
    blink: false, //true,
    renderable: { position: Renderable.Position.Scroll }
  })
  scrollbars = $(new Scrollbars(this))

  // widgets
  sub: Widget.It[] = [
    $(new Widget(this), {
      widgetable: {
        kind: Widget.Kind.Sub,
        dim: { p1: { line: 8, col: 1 }, p2: { line: 8, col: 4 } }
      }
    }),
    $(new Widget(this), {
      widgetable: {
        kind: Widget.Kind.Sub,
        dim: { p1: { line: 16, col: 1 }, p2: { line: 16, col: 10 } }
      }
    }),
  ]
  deco: Widget.It[] = [
    $(new Widget(this), {
      widgetable: {
        kind: Widget.Kind.Deco,
        dim: { p1: { line: 0, col: 1 }, p2: { line: 0, col: 4 } }
      }
    }),
    $(new Widget(this), {
      widgetable: {
        kind: Widget.Kind.Deco,
        dim: { p1: { line: 4, col: 1 }, p2: { line: 4, col: 10 } }
      }
    }),
  ]

  get renderables(): Renderable.It[] {
    const t = $.of(this)
    return [
      t.selection,
      t.elevations,
      ...t.sub,
      ...t.deco,
      t.text,
      t.brackets,
      t.caret,
      t.scrollbars,
    ]
  }
  get editorPointables(): (Renderable.It & Pointable.It)[] {
    const t = $.of(this)
    return [
      t.scrollbars,
      ...(t.sub.filter(w => w.pointable) as (Widget.It & Pointable.It)[]),
      t.text,
      this,
    ]
  }
  get pointable() {
    $()
    const it = this
    const { world: { pointer } } = $.of(it)
    const { Menu } = Mouse.EventKind
    class EditorPointable extends Pointable {
      hitArea = it.renderable.rect
      @fx update_hovering() {
        this.isHovering = it.editorPointables.some(s =>
          s.pointable.isHovering
        )
      }
      @fn onMouseEvent(type: Mouse.EventKind) {
        if (type === Menu) {
          console.log('YO')
          const { real } = $.of(pointer)
          prevent(real)
        }
      }
    }
    return $(new EditorPointable(this))
  }
  get renderable() {
    $()
    const it = this
    const { world: { anim, skin }, misc, scroll } = $.of(it)
    const { targetScroll, pos: scrollPos } = $.of(scroll)

    const d = $(new Point)
    const ad = $(new Point)

    class EditorRenderable extends Renderable {
      @init init_Editor() {
        this.canvas.fullWindow = true
      }
      getNeedDraw(renderables: Renderable.It[], pass = false) {
        for (const it of renderables) {
          const { renderable: r } = it
          const { needRender, needDraw } = r
          pass ||= needRender || needDraw || false
          if ('renderables' in it) {
            pass = this.getNeedDraw(
              it.renderables,
              pass
            )
          }
        }
        return pass
      }
      @fx trigger_needDraw() {
        const needDraw = this.getNeedDraw(it.renderables)
        if (needDraw) {
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
      runInitCanvas(renderables: Renderable.It[]) {
        for (const it of renderables) {
          const { renderable: r } = it
          r.needInit && r.initCanvas(r.canvas.c)
          if ('renderables' in it) this.runInitCanvas(it.renderables)
        }
      }
      @fn initCanvas() {
        const { c } = $.of(this.canvas)
        c.imageSmoothingEnabled = false
        this.runInitCanvas(it.renderables)
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
      runDraw(t: number, renderables: Renderable.It[], position: Renderable.Position = Renderable.Position.Layout) {
        const { rect, canvas } = $.of(this)
        const { c } = canvas
        const { Layout, Scroll } = Renderable.Position
        const { dims } = $.of(it)
        const { viewSpan } = $.of(dims)

        for (const it of renderables) {
          const { renderable: r } = it

          if ('renderables' in it) {
            position = this.runDraw(t, it.renderables, position)
          }

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
            ) {
              r.isVisible = false
              continue
            }
            r.isVisible = true

            r.needInit && r.initCanvas(r.canvas.c)
            r.needRender && r.render(t, r.canvas.c, true)
            if (r.didDraw || r.needDraw) {
              r.draw(t, c)
              r.didDraw = true
            }
          }
          else if (position === Layout) {
            r.isVisible = true

            if (r.canDirectDraw && this.needDirectDraw) {
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
              if (r.didDraw || r.needDraw) {
                r.draw(t, c)
                r.didDraw = true
              }
            }
          }
        }

        return position
      }
      @fn draw(t: number) {
        const { renderables, scroll, dims: { viewSpan } } = $.of(it)
        const { rect, canvas } = $.of(this)
        const { c } = canvas
        const { Layout, Scroll } = Renderable.Position

        rect.fill(c, skin.colors.bg)

        const position = this.runDraw(t, renderables)

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
