// log.active
import { $, fx, init, of } from 'signal'
import { Canvas, Rect } from 'std'
import { Comp } from './comp.ts'

export class Renderable {
  constructor(
    public it: Renderable.It,
    public rect = $(new Rect),
    public canvas = $(new Canvas(it.ctx.world), { size: rect.$.size }),
    public pr = it.ctx.world.screen.$.pr,
  ) {}

  // constructor(
  //   public ctx: Editor,
  //   public rect = $(new Rect),
  //   public canvas = $(new Canvas(ctx.world), { size: rect.$.size }),
  //   public world: World = ctx.world,
  //   public pr = world.screen.$.pr,
  // ) {
  //   super(world)
  // }

  get prRecip() { return 1 / this.pr }
  position: Renderable.Position = Renderable.Position.Layout
  canDirectDraw?: boolean
  canComposite?: boolean

  viewRect?: $<Rect>
  dirtyRects: $<Rect>[] = []

  didDraw?: boolean
  needInit = true
  needUpdate?: boolean
  needRender?: boolean
  needDraw?: boolean
  needDirectDraw?: boolean

  isVisible = true
  isHidden = false

  init(c: CanvasRenderingContext2D): void { }
  render(c: CanvasRenderingContext2D, t: number, clear: boolean): void {}
  draw(c: CanvasRenderingContext2D, t: number): void { }

  @init set_initial_dirtyRects() {
    if (!this.dirtyRects.length) {
      this.dirtyRects.push(this.viewRect ?? this.rect)
    }
  }
  @fx trigger_needInit_on_size() {
    const { pr, canvas } = of(this)
    const { size: { x, y } } = of(canvas)
    this.needInit = true
  }
}

export namespace Renderable {
  export interface It extends Comp {
    renderables?: Renderable.It[]
    renderable: Renderable
  }
  export enum Position {
    /** Layout position, remains fixed in space without scroll translations. */
    Layout,
    /** Inner position, translations apply. */
    Inner
  }
  export enum Need {
    Idle = 0,
  }
}
