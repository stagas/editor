// log.active
import { $, fn, fx, init, of } from 'signal'
import { Point, Scene } from 'std'
import { clamp, filterAs, prevent } from 'utils'
import { ActiveLine } from './active-line.ts'
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
  activeLine = $(new ActiveLine(this))
  selection = $(new Selection(this))
  elevations = $(new Elevations(this))
  text = $(new Text(this))
  brackets = $(new Brackets(this), {
    renderable: { position: Renderable.Position.Inner }
  })
  caret = $(new Caret(this, this.buffer.linecol), {
    renderable: { position: Renderable.Position.Inner },
    blink: false, //true,
  })
  dropCaret = $(new Caret(this, this.input.mouse.linecol), {
    renderable: { position: Renderable.Position.Inner },
    blink: false,
    hideWhenAway: true,
    hideWhenTyping: true,
    color1: '#555',
    color2: '#555',
    color1Focused: '#666',
    color2Focused: '#666',
  })
  scrollbars = $(new Scrollbars(this))

  // widgets
  deco: Widget.It[] = [
    // $(new Widget(this), {
    //   widgetable: {
    //     kind: Widget.Kind.Deco,
    //     dim: { p1: { line: 0, col: 1 }, p2: { line: 0, col: 4 } }
    //   }
    // }),
    // $(new Widget(this), {
    //   widgetable: {
    //     kind: Widget.Kind.Deco,
    //     dim: { p1: { line: 4, col: 1 }, p2: { line: 4, col: 10 } }
    //   }
    // }),
  ]
  mark: Widget.It[] = []
  sub: Widget.It[] = [
    // $(new Widget(this), {
    //   widgetable: {
    //     kind: Widget.Kind.Sub,
    //     dim: { p1: { line: 8, col: 1 }, p2: { line: 8, col: 4 } }
    //   }
    // }),
    // $(new Widget(this), {
    //   widgetable: {
    //     kind: Widget.Kind.Sub,
    //     dim: { p1: { line: 16, col: 1 }, p2: { line: 16, col: 10 } }
    //   }
    // }),
  ]

  get renderables(): Renderable.It[] {
    const t = of(this)
    return [
      t.activeLine,
      t.selection,
      t.elevations,
      ...t.deco,
      ...t.mark,
      ...t.sub,
      t.text,
      t.brackets,
      t.dropCaret,
      t.caret,
      t.scrollbars,
    ]
  }
  get pointables(): Pointable.It[] {
    const t = of(this)
    return [
      t.scrollbars,
      ...filterAs(t.deco)<Pointable.It>(w => w.pointable?.it),
      ...filterAs(t.mark)<Pointable.It>(w => w.pointable?.it),
      ...filterAs(t.sub)<Pointable.It>(w => w.pointable?.it),
      t.text,
    ]
  }
  get pointable() {
    $()
    const it = this
    const { world: { pointer } } = of(it)
    const { Menu } = Mouse.EventKind
    class EditorPointable extends Pointable {
      hitArea = it.renderable.rect
      canHover = false
      @fx update_hovering() {
        this.isHovering = it.pointables.some(s =>
          s.pointable.isHovering
        )
      }
      @fn onMouseEvent(type: Mouse.EventKind) {
        if (type === Menu) {
          const { real } = of(pointer)
          prevent(real)
        }
      }
    }
    return $(new EditorPointable(this))
  }
  get renderable() {
    $()
    const it = this
    const { world: { anim, skin }, misc, scroll } = of(it)
    const { targetScroll, pos: scrollPos } = of(scroll)
    const { Layout, Inner } = Renderable.Position

    const d = $(new Point)
    const ad = $(new Point)

    const dirty = new Set<Renderable>()

    class EditorRenderable extends Renderable {
      // do a direct draw initially
      needDirectDraw = true

      @init init_Editor() {
        this.canvas.fullWindow = true
      }
      @fn traverse_needDraw(renderables: Renderable.It[], pass = false) {
        for (const it of renderables) {
          const { renderable: r } = it
          if (!r.isVisible) continue

          const { needRender, needDraw } = r
          pass ||= needRender || needDraw || false
          if ('renderables' in it) {
            pass = this.traverse_needDraw(
              it.renderables,
              pass
            )
          }
        }
        return pass
      }
      @fn traverse_needUpdate(renderables: Renderable.It[], pass = false) {
        for (const it of renderables) {
          const { renderable: r } = it
          if (!r.isVisible) continue

          const { needUpdate } = r
          pass ||= needUpdate || false
          if ('renderables' in it) {
            pass = this.traverse_needUpdate(
              it.renderables,
              pass
            )
          }
        }
        return pass
      }
      @fx trigger_needDraw() {
        const pass = this.traverse_needDraw(it.renderables)
        if (pass) {
          $()
          this.needDraw = true
        }
      }
      @fx trigger_needUpdate() {
        const pass = this.traverse_needUpdate(it.renderables)
        if (pass) {
          $()
          this.needUpdate = true
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
      @fx anim_start_when_needed() {
        if (anim.isAnimating) return
        const { needInit, needUpdate, needDraw } = this
        if (needInit || needUpdate || needDraw) {
          $()
          anim.start()
        }
      }
      @fn traverse_update(dt: number, renderables: Renderable.It[], pass = 0) {
        for (const it of renderables) {
          const { renderable: r } = it
          if (r.needUpdate) {
            const needUpdate = r.update(dt)
            if (needUpdate) r.needUpdate = true
            pass ||= needUpdate
          }
          if ('renderables' in it) {
            pass = this.traverse_update(dt, it.renderables, pass)
          }
        }
        return pass
      }
      @fn traverse_initCanvas(renderables: Renderable.It[]) {
        for (const it of renderables) {
          const { renderable: r } = it
          r.needInit && r.initCanvas(r.canvas.c)
          if ('renderables' in it) this.traverse_initCanvas(it.renderables)
        }
      }
      @fn initCanvas() {
        const { c } = of(this.canvas)
        c.imageSmoothingEnabled = false
        this.traverse_initCanvas(it.renderables)
        this.needInit = false
      }
      @fn update(dt: number) {
        const { isTyping } = of(misc)
        const { animSettings } = of(scroll)

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

        let pass = +isScrolling
        pass = this.traverse_update(dt, it.renderables, pass)

        if (!pass) {
          this.needUpdate = false
          this.needDraw = true
          return 0 // does not need next frame
        }
        else {
          this.needDirectDraw = isScrolling
          this.needDraw = true
          return 1 // need next frame
        }
      }
      @fn drawSimple(t: number, r: Renderable) {
        const { canvas: { c } } = this
        r.needInit && r.initCanvas(r.canvas.c)
        r.needRender && r.render(t, r.canvas.c, true)
        if (r.didDraw || r.needDraw) {
          r.draw(t, c)
          r.didDraw = true
          dirty.add(r)
        }
      }
      @fn drawDirectLayout(t: number, r: Renderable) {
        const { canvas: { c } } = this
        c.save()
        r.initCanvas(c)
        r.render(t, c, false)
        c.restore()
        // when we finish the direct layout draws,
        // we need the items to also render their own canvas.
        r.needInit = r.needRender = true
      }
      @fn drawComposite(t: number, r: Renderable, renderables: Renderable.It[]) {
        const { pr, canvas: { c } } = this

        r.needInit && r.initCanvas(r.canvas.c)

        // we will render something new
        if (r.needRender || r.needDraw) {
          // for each of our previous dirtyRects
          for (const dr of r.dirtyRects) {
            // if that dirty rect had size
            if (dr.hasSize) {
              // clear that old part
              dr.fill(c, skin.colors.bg)

              // and redraw what had been drawn at that
              // location bottom up again:
              // for each dirty renderable that has been drawn so far
              for (const other of dirty)
                // for each of its dirtyRects
                for (const otherDr of other.dirtyRects)
                  // if OTHER dirtyRect intersects with THIS dirtyRect
                  otherDr.hasSize && otherDr.intersectionRect(dr)
                    // then render that portion of the image again on top
                    ?.drawImage(other.canvas.el,c,pr)

              // zero dirtyRect because we will draw something new
              dr.zero()
            }
          }

          // ready to draw something new
          r.needRender && r.render(t, r.canvas.c, true)
          if (r.didDraw || r.needDraw) {
            r.draw(t, c)
            r.didDraw = true
            dirty.add(r)
          }
        }
        // we will render the same, so we
        // only rerender those that have been touched
        else {
          // if we did a draw, for each dirtyRect of THIS renderable
          if (r.didDraw) for (const dr of r.dirtyRects) {
            // and for each dirty renderable that has been drawn so far
            for (const other of dirty)
              // for each of its dirtyRects
              for (const otherDr of other.dirtyRects)
                // if OTHER dirtyRect intersects with THIS dirtyRect
                otherDr.hasSize && otherDr.intersectionRect(dr)
                  // then render that portion of the image again on top
                  ?.drawImage(r.canvas.el,c,pr)

          }
        }
        // r.needRender && r.render(t, r.canvas.c, true)
        // if (r.didDraw || r.needDraw) {
        //   r.draw(t, c)
        //   r.didDraw = true
        // }


        // if (r.needRender || r.needDraw) {
        //   if (r.dirtyRects) for (const dr of r.dirtyRects) {
        //     dr.whenSized
        //       ?.fill(c, skin.colors.bg)
        //     // .stroke(c, '#0f0')

        //     for (const it of renderables) {
        //       const ir = it.renderable
        //       if (ir === r) {
        //         break
        //       }

        //       if (ir.dirtyRects) for (const dr2 of ir.dirtyRects) {
        //         dr.intersectionRect(
        //           dr2
        //         )?.drawImage(ir.canvas.el, c, pr)
        //       }
        //       else {
        //         dr.intersectionRect(
        //           ir.rect
        //         )?.drawImage(ir.canvas.el, c, pr)
        //       }
        //     }

        //     dr.zero()

        //     r.needRender && r.render(t, r.canvas.c, true)
        //     if (r.needDraw) {
        //       r.draw(t, c)
        //       r.didDraw = true
        //     }

        //     let pass = false
        //     for (const it of renderables) {
        //       const ir = it.renderable
        //       if (ir === r) {
        //         pass = true
        //         continue
        //       }
        //       else if (!pass) continue

        //       if (!ir.needRender && !ir.needDraw) {
        //         if (ir.dirtyRects) for (const dr2 of ir.dirtyRects) {
        //           dr.intersectionRect(
        //             dr2
        //           )?.drawImage(ir.canvas.el, c, pr)
        //         }
        //         else {
        //           dr.intersectionRect(
        //             ir.rect
        //           )?.drawImage(ir.canvas.el, c, pr)
        //         }
        //       }
        //     }
        //   }
        //   else {
        //     r.needRender && r.render(t, r.canvas.c, true)
        //     if (r.needDraw) {
        //       r.draw(t, c)
        //       r.didDraw = true
        //     }
        //   }
        // }
      }
      @fn traverse_draw(
        t: number,
        renderables: Renderable.It[],
        position: Renderable.Position = Renderable.Position.Layout
      ) {
        const { canvas: { c } } = this
        const { dims: { visibleSpan } } = of(it)

        for (const it of renderables) {
          const { renderable: r } = it

          // depth first
          if ('renderables' in it) {
            position = this.traverse_draw(t, it.renderables, position)
          }

          // Change transforms depending on the object Position.
          if (r.position !== position) {
            if (r.position === Inner) {
              c.save()
              scroll.pos.translate(c)
            }
            else {
              c.restore()
            }
            position = r.position
          }

          const rect = r.viewRect ?? r.rect

          switch (position) {
            case Inner:
              if (
                rect.bottom < visibleSpan.top
                || rect.top > visibleSpan.bottom
              ) {
                r.isVisible = false
                continue
              }
              r.isVisible = true

              if (this.needDirectDraw || !r.canComposite) {
                this.drawSimple(t, r)
              }
              else {
                this.drawComposite(t, r, renderables)
              }
              break

            case Layout:
              if (!r.isVisible) continue

              if (r.canDirectDraw && this.needDirectDraw) {
                this.drawDirectLayout(t, r)
              }
              else {
                if (this.needDirectDraw || !r.canComposite) {
                  this.drawSimple(t, r)
                }
                else {
                  this.drawComposite(t, r, renderables)
                }
              }
              break
          }
        }

        return position
      }
      @fn draw(t: number) {
        const { rect, canvas: { c } } = this

        // We do a full background fill on direct draws
        // since we have to redraw everything.
        // This is the case in events like scrolling.
        if (this.needDirectDraw) {
          rect.fill(c, skin.colors.bg)
        }

        const position = this.traverse_draw(t, it.renderables)

        // If we ended in another position than Layout,
        // it means the canvas has transforms, so we need to restore.
        if (position !== Layout) {
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
