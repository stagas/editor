// log.active
import { $, fn, fx, init, nu } from 'signal'
import { Renderable, RenderPosition } from './render.ts'
import { Text } from './text.ts'
import { Selection } from './selection.ts'
import { Input } from './input.ts'
import { Dims } from './dims.ts'
import { AnimScrollStrategy, Scroll } from './scroll.ts'
import { Buffer } from './buffer.ts'
import { History } from './history.ts'
import { Misc } from './misc.ts'
import { WidgetLike } from './widgets.ts'
import { Point, Scene, World } from 'std'
import { Caret } from './caret.ts'
import { Brackets } from './brackets.ts'
import { clamp } from 'utils'
import { Clipboard } from './clipboard.ts'
import { Scrollbars } from './scrollbars.ts'
import { Pointable } from './pointable.ts'

interface PointerItem { }

interface Skin {
  colors: Record<string, string>
  fonts: {
    mono: string
  }
}

type Colors = Record<string, string>

export class Editor extends Scene {
  get renderable(): $<Renderable> {
    return $(new Renderable(this))
  }
  misc = $(new Misc)
  skin = {
    colors: {
      bg: '#111',
      bgBright015: '#113',
      bgBright1: '#337',
      bgBright2: '#558',
      bgBright25: '#669',
    },
    fonts: {
      mono: 'monospace'
    }
  }
  colors: Colors = {}
  history = $(new History(this))
  buffer = $(new Buffer(this, { Type: {} }))
  scroll = $(new Scroll(this))
  dims = $(new Dims(this))
  input = $(new Input(this))
  clipboard = $(new Clipboard(this))

  // renderables
  selection = $(new Selection(this))
  text = $(new Text(this))
  brackets = $(new Brackets(this), { renderable: { renderPosition: RenderPosition.Scroll } })
  caret = $(new Caret(this), { blink: false, renderable: { renderPosition: RenderPosition.Scroll   } })
  scrollbars = $(new Scrollbars(this))

  sub: (WidgetLike | (WidgetLike & PointerItem))[] = []
  deco: WidgetLike[] = []

  @init init_Editor() {
    this.renderable.canvas.fullWindow = true
  }
  @nu get scenes(): Renderable.It[] {
    const t = $.of(this)
    return [
      t.selection,
      t.text,
      t.brackets,
      t.caret,
      t.scrollbars,
    ]
  }
  @nu get pointerTargets(): (Renderable.It & Pointable.It)[] {
    const t = $.of(this)
    return [
      t.text,
      t.scrollbars,
    ]
  }
  @fx update_hovering() {
    this.renderable.isHovering = this.scenes.some(s => s.renderable.isHovering)
  }
  @fx maybe_needDraw() {
    const { scenes } = $.of(this)
    let needDraw = false
    for (const scene of scenes) {
      needDraw ||= scene.renderable.needRender || scene.renderable.needDraw || false
    }
    if (needDraw) {
      $()
      this.renderable.needDraw = true
    }
  }
  @fx trigger_update_when_scroll() {
    const { scroll } = $.of(this)
    const { pos: scrollPos, targetScroll } = $.of(scroll)

    const needUpdate =
      Math.round(scrollPos.top) !== targetScroll.top ||
      Math.round(scrollPos.left) !== targetScroll.left

    if (needUpdate) {
      $()
      this.renderable.needUpdate = true
    }
  }
  @fx trigger_anim_on_needUpdateOrDraw() {
    if (this.renderable.needInit || this.renderable.needUpdate || this.renderable.needDraw) {
      if (!this.world.anim.isAnimating) {
        $()
        this.world.anim.start()
      }
    }
  }
  @fn initCanvas() {
    const { c } = $.of(this.renderable.canvas)
    c.imageSmoothingEnabled = false
    for (const { renderable: r } of this.scenes) {
      r.needInit && r.initCanvas(r.canvas.c)
    }
    this.renderable.needInit = false
  }
  @fn update() {
    const { misc, dims, scroll } = $.of(this)
    const { isTyping } = $.of(misc)
    const { targetScroll, pos: scrollPos, animScrollStrategy } = $.of(scroll)

    const dy = (targetScroll.y - scrollPos.y)
    const dx = (targetScroll.x - scrollPos.x)

    const ady = Math.abs(dy)
    const adx = Math.abs(dx)

    // TODO: bezier? need to save eventTime to make the normal t
    // will need a lerped t to smooth out changes
    const { distance, tension, amount, min } =
      (adx + ady > 55)
        || isTyping
        // || $.isHandlingScrollbar
        ? animScrollStrategy
        : AnimScrollStrategy.Slow

    let isScrolling = false
    if (ady > 1) {
      scrollPos.y += dy * (clamp(0, 1, (ady / distance)) ** tension * amount + min)
      isScrolling = true
    }
    else if (dy) {
      scrollPos.y = targetScroll.y
    }

    if (adx > 1) {
      scrollPos.x += dx * (clamp(0, 1, (adx / distance)) ** tension * amount + min)
      isScrolling = true
    }
    else if (dx) {
      scrollPos.x = targetScroll.x
    }

    misc.wasScrolling = misc.isScrolling
    misc.isScrolling = isScrolling

    // check if we need further updates
    // let needUpdate = isScrolling

    if (!isScrolling) {
      this.renderable.needUpdate = false
      this.renderable.needDraw = true
      return 0 // does not need next frame
    }
    else {
      this.renderable.needDirectDraw = true
      this.renderable.needDraw = true
      return 1 // need next frame
    }
    // console.log(this.needUpdate)
    // return +this.needUpdate
  }
  updateOne() { return 0 }
  render() { }
  @fn draw(t: number) {
    const { scenes, renderable, scroll, skin, dims: { viewSpan } } = $.of(this)
    const { rect,canvas} = $.of(renderable)
    const { c } = canvas
    const { Layout, Scroll } = RenderPosition

    rect.fill(c, skin.colors.bg)

    let position: RenderPosition = Layout

    // if (this.needDirectDraw) {
    for (const { renderable: r } of scenes) {
      if (r.renderPosition !== position) {
        if (r.renderPosition === Scroll) {
          c.save()
          scroll.pos.translate(c)
        }
        else {
          c.restore()
        }
        position = r.renderPosition
      }

      const viewRect = r.viewRect ?? r.rect

      if (position === Scroll) {
        if (
          viewRect.bottom < viewSpan.top
          || viewRect.top > viewSpan.bottom
        ) continue

        // if (scene.needRender) {
        r.needInit && r.initCanvas(r.canvas.c)
        r.needRender && r.render(t, r.canvas.c, true)
        r.draw(t, c)
        // scene.render(t, scene.canvas.c, true)
        // scene.draw(t, c)
        // }
        // else {
        //   scene.draw(t, c)
        // }
      }
      else if (position === Layout) {
        if (this.renderable.needDirectDraw) {
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

    this.renderable.needDirectDraw
      = this.renderable.needDraw
      = false
    // }
    // else {
    //   for (const scene of scenes) {
    //     scene.needInit && scene.initCanvas(scene.canvas.c)
    //     scene.needRender && scene.render(t, scene.canvas.c, true)
    //     scene.draw(t, c)
    //   }
    // }

    // this.needDraw = false
    // if (this.needUpdate) {
    //   requestAnimationFrame(this.update)
    // }
  }
}
