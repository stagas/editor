log.active
import { $, fn, fx, init, nu } from 'signal'
import { Render, RenderPosition } from './render.ts'
import { Text } from './text.ts'
import { Selection } from './selection.ts'
import { Input } from './input.ts'
import { Dims } from './dims.ts'
import { AnimScrollStrategy, Scroll } from './scroll.ts'
import { Buffer } from './buffer.ts'
import { History } from './history.ts'
import { Misc } from './misc.ts'
import { WidgetLike } from './widgets.ts'
import { World } from 'std'
import { Caret } from './caret.ts'
import { Brackets } from './brackets.ts'
import { clamp } from 'utils'

interface PointerItem { }

interface Skin {
  colors: Record<string, string>
  fonts: {
    mono: string
  }
}

type Colors = Record<string, string>

export class Editor extends Render {
  constructor(public world: World) {
    super({ world } as Editor)
  }

  misc = $(new Misc)
  skin = {
    colors: {
      bgBright2: '#337'
    }, fonts: { mono: 'monospace' }
  }
  colors: Colors = {}
  history = $(new History(this))
  buffer = $(new Buffer(this, { Type: {} }))
  scroll = $(new Scroll(this))
  dims = $(new Dims(this))
  input = $(new Input(this))
  selection = $(new Selection(this))
  text = $(new Text(this))
  caret = $(new Caret(this), { blink: false, renderPosition: RenderPosition.Scroll })
  brackets = $(new Brackets(this), { renderPosition: RenderPosition.Scroll })
  sub: (WidgetLike | (WidgetLike & PointerItem))[] = []
  deco: WidgetLike[] = []

  @init init_Editor() {
    this.canvas.fullWindow = true
  }
  @nu get scenes(): Render[] {
    const t = $.of(this)
    return [
      t.selection,
      t.text,
      t.caret,
      t.brackets,
    ]
  }
  @fx maybe_needDraw() {
    const { scenes } = $.of(this)
    let d = false
    for (const scene of scenes) {
      const { needRender, needDraw } = scene
      d ||= needRender || needDraw || false
    }
    if (d) {
      this.needDraw = true
    }
  }
  // @fx when_needDraw_trigger_draw() {
  //   $.when(this).needDraw
  //   this.draw()
  //   // requestAnimationFrame(() => this.draw())
  // }
  // @fx when_needUpdate_trigger_update() {
  //   $.when(this).needUpdate
  //   // this.update()
  //   requestAnimationFrame(() => this.update())
  // }
  @fx trigger_update_when_scroll() {
    const { scroll } = $.of(this)
    const { pos: scrollPos, targetScroll } = $.of(scroll)

    const needUpdate =
      Math.round(scrollPos.top) !== targetScroll.top ||
      Math.round(scrollPos.left) !== targetScroll.left

    $.untrack()

    if (needUpdate) {
      this.needUpdate = true
    }
  }
  @fx trigger_anim_on_needUpdate() {
    if (this.needUpdate) {
      if (!this.world.anim.isAnimating) {
        $.untrack()
        this.world.anim.start()
      }
    }
  }
  @fn initCanvas() {
    const { c } = $.of(this.canvas)
    c.imageSmoothingEnabled = false
    this.needInit = false
    this.needDraw = true
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
      this.needUpdate = false
      this.needDraw = true
      return 0
    }
    else {
      this.needDirectDraw = true
      this.needDraw = true
      return 1
    }
    // console.log(this.needUpdate)
    // return +this.needUpdate
  }
  updateOne() { return 0 }
  render() { }
  @fn draw(t: number) {
    const { rect, scenes, canvas, scroll, dims: { viewSpan } } = $.of(this)
    const { c } = canvas
    const { Layout, Scroll } = RenderPosition

    rect.fill(c, '#224')

    let position: RenderPosition = Layout

    // if (this.needDirectDraw) {
    for (const scene of scenes) {
      if (scene.renderPosition !== position) {
        if (scene.renderPosition === Scroll) {
          c.save()
          scroll.pos.translate(c)
        }
        else {
          c.restore()
        }
        position = scene.renderPosition
      }

      const viewRect = scene.viewRect ?? scene.rect

      if (position === Scroll) {
        if (
          viewRect.bottom < viewSpan.top
          || viewRect.top > viewSpan.bottom
        ) continue

        // if (scene.needRender) {
        scene.needInit && scene.initCanvas(scene.canvas.c)
        scene.needRender && scene.render(t, scene.canvas.c, true)
        scene.draw(t, c)
        // scene.render(t, scene.canvas.c, true)
        // scene.draw(t, c)
        // }
        // else {
        //   scene.draw(t, c)
        // }
      }
      else if (position === Layout) {
        if (this.needDirectDraw) {
          c.save()
          scene.initCanvas(c)
          scene.render(t, c, false)
          c.restore()
          // when we finish the direct layout draws,
          // we need the items to also render their own canvas.
          scene.needInit = scene.needRender = true
        }
        else {
          scene.needInit && scene.initCanvas(scene.canvas.c)
          scene.needRender && scene.render(t, scene.canvas.c, true)
          scene.draw(t, c)
        }
      }
    }

    if (position === Scroll) {
      c.restore()
    }

    this.needDirectDraw
      = this.needDraw
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
