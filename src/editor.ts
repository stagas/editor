// log.active
import { $, fn, fx, init, of } from 'signal'
import { Animable, Mouse, Mouseable, Point, Renderable, Scene, World } from 'std'
import { clamp, prevent } from 'utils'
// import { ActiveLine } from './active-line.ts'
// import { Brackets } from './brackets.ts'
import { Buffer } from './buffer.ts'
// import { Caret } from './caret.ts'
import { Clipboard } from './clipboard.ts'
import { Dims } from './dims.ts'
// import { Elevations } from './elevations.ts'
import { History } from './history.ts'
// import { Input } from './input.ts'
import { Misc } from './misc.ts'
import { Scroll } from './scroll.ts'
// import { Scrollbars } from './scrollbars.ts'
import { Brackets } from './brackets.ts'
import { Caret } from './caret.ts'
import { Elevations } from './elevations.ts'
import { InnerAbove } from './inner-above.ts'
import { InnerBelow } from './inner-below.ts'
import { Outer } from './outer.ts'
import { Selection } from './selection.ts'
import { Text } from './text.ts'
import { Widgetable } from './widget.ts'

export class Editor extends Scene
  implements Renderable.It, Mouseable.It, Animable.It {
  constructor(public world: World) { super({ world }) }
  // core
  get skin() { return this.world.skin }
  get canvas() { return this.world.canvas! }
  get keyboard() { return this.world.keyboard! }
  get mouse() { return this.world.mouse! }

  misc = $(new Misc)
  history = $(new History(this))
  buffer = $(new Buffer(this, { Type: { text: 'Id', number: 'Number' } }))
  scroll = $(new Scroll(this))
  dims = $(new Dims(this))
  clipboard = $(new Clipboard(this))

  // renderables
  // activeLine = $(new ActiveLine(this))
  selection = $(new Selection(this))
  elevations = $(new Elevations(this))
  text = $(new Text(this))
  brackets = $(new Brackets(this))
  caret = $(new Caret(this, this.buffer.linecol), {
    blink: false,
  })
  dropCaret = $(new Caret(this, this.text.linecol), {
    blink: false,
    hideWhenAway: true,
    hideWhenTyping: true,
    color1: '#555',
    color2: '#555',
    color1Focused: '#666',
    color2Focused: '#666',
  })
  // scrollbars = $(new Scrollbars(this))

  innerBelow = $(new InnerBelow(this))
  innerAbove = $(new InnerAbove(this))
  outer = $(new Outer(this))

  // widgets
  deco: Widgetable.It[] = [
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
  mark: Widgetable.It[] = []
  sub: Widgetable.It[] = [
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

  // get renderables(): Renderable.It[] {
  //   const t = of(this)
  //   return [
  //     // t.activeLine,
  //     // t.selection,
  //     // t.elevations,
  //     // ...t.deco,
  //     // ...t.mark,
  //     // ...t.sub,
  //     // t.text,
  //     // t.brackets,
  //     // t.dropCaret,
  //     // t.caret,
  //     // t.scrollbars,
  //   ]
  // }
  // get mouseables(): Mouseable.It[] {
  //   const t = of(this)
  //   return [
  //     // t.scrollbars,
  //     // ...filterAs(t.deco)<Pointable.It>(w => w.pointable?.it),
  //     // ...filterAs(t.mark)<Pointable.It>(w => w.pointable?.it),
  //     // ...filterAs(t.sub)<Pointable.It>(w => w.pointable?.it),
  //     // t.text,
  //   ]
  // }
  get mouseable() {
    $()
    const it = this
    const { Menu } = Mouse.EventKind
    class EditorMouseable extends Mouseable {
      canHover = false
      @fx update_isFocused_from_its() {
        this.isFocused = Mouseable.some(this.its, it =>
          it.mouseable.isFocused
        )
      }
      @fx update_isHovering_from_its() {
        this.isHovering = Mouseable.some(this.its, it =>
          it.mouseable.isHovering
        )
      }
      @fn onMouseEvent(kind: Mouse.EventKind) {
        if (kind === Menu) {
          const { real } = of(this.mouse)
          prevent(real)
        }
      }
      get its() {
        return [it.outer]
      }
    }
    return $(new EditorMouseable(it as Mouseable.It))
  }
  get renderable() {
    $()
    const it = this
    class EditorRenderable extends Renderable {
      @init init_Editor() {
        this.canvas.fullWindow = true
      }
      @fn init(c: CanvasRenderingContext2D) {
        c.imageSmoothingEnabled = false
        this.need &= ~Renderable.Need.Init
      }
      get its() {
        return [it.outer]
      }
    }
    return $(new EditorRenderable(it as Renderable.It))
  }
  get animable() {
    $()
    const it = this
    const { misc, scroll } = it
    const { pos: scrollPos, targetScroll } = scroll
    let d = $(new Point)
    let ad = $(new Point)
    class EditorAnimable extends Animable {
      get coeff() { return it.ctx.world.anim.coeff }

      // need = Animable.Need.Draw
      @fx trigger_need_tick_when_scroll() {
        const need =
          Math.round(scrollPos.top) !== targetScroll.top ||
          Math.round(scrollPos.left) !== targetScroll.left

        if (need) {
          $()
          this.need |= Animable.Need.Tick
          return
        }
      }
      @fn tick(dt: number) {
        const { coeff } = this
        const { isTyping } = misc
        const { animSettings } = scroll

        d.set(targetScroll).sub(scrollPos)
        ad.set(d).abs()

        // TODO: bezier? need to save eventTime to make the normal t
        // will need a lerped t to smooth out changes
        const { distance, tension, amount, min } =
          (ad.x + ad.y > 255)
            || isTyping
            // || $.isHandlingScrollbar
            ? animSettings
            : Scroll.AnimSettings.Slow

        let isScrolling = false
        if (ad.y > 1) {
          scrollPos.y += coeff * d.y * (clamp(0, 1, (ad.y / distance)) ** tension * amount + min)
          isScrolling = true
        }
        else if (d.y) {
          scrollPos.y = targetScroll.y
        }

        if (ad.x > 1) {
          scrollPos.x += coeff * d.x * (clamp(0, 1, (ad.x / distance)) ** tension * amount + min)
          isScrolling = true
        }
        else if (d.x) {
          scrollPos.x = targetScroll.x
        }

        misc.wasScrolling = misc.isScrolling
        misc.isScrolling = isScrolling

        if (isScrolling) {
          this.need = Animable.Need.Tick | Animable.Need.Draw
          // TODO: better way to request direct?
          it.world.render.needDirect = true
        }
        else {
          this.need = Animable.Need.Draw
          it.world.render.needDirect = false
        }
      }
    }
    return $(new EditorAnimable(it as Animable.It))
  }
}
