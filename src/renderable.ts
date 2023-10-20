// log.active
import { $, fx } from 'signal'
import { Canvas, Rect, Scene, World } from 'std'
import { Editor } from './editor'

export class Renderable extends Scene {
  constructor(
    public ctx: Editor,
    public rect = $(new Rect),
    public canvas = $(new Canvas(ctx.world), { size: rect.$.size }),
    public world: World = ctx.world,
    public pr = world.screen.$.pr,
  ) {
    super(world)
  }

  coeff = 1
  position: Renderable.Position = Renderable.Position.Layout
  viewRect?: $<Rect>

  needInit?: boolean
  needUpdate?: boolean
  needRender?: boolean
  needDraw?: boolean
  needDirectDraw?: boolean

  isVisible = false
  initCanvas(c: CanvasRenderingContext2D): void { }
  update(dt: number): number { return 0 }
  updateOne(dt: number): number { return 0 }
  render(t: number, c: CanvasRenderingContext2D, clear: boolean): void { }
  draw(t: number, c: CanvasRenderingContext2D): void { }

  @fx trigger_needInit_on_size() {
    const { pr, canvas } = $.of(this)
    const { size: { x, y } } = $.of(canvas)
    this.needInit = true
  }
}

export namespace Renderable {
  export interface It {
    renderable: Renderable
  }
  export enum Position {
    /** Layout position, remains fixed in space without scroll translations. */
    Layout,
    /** Scroll position, translations apply. */
    Scroll
  }
}