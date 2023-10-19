log.active
import { $, fx } from 'signal'
import { Canvas, Rect, Scene, World } from 'std'
import { Editor } from './editor'

export enum RenderPosition {
  /** Layout position, remains fixed in space without scroll translations. */
  Layout,
  /** Scroll position, translations apply. */
  Scroll
}

export abstract class Render extends Scene {
  constructor(
    public ctx: Editor,
    public rect = $(new Rect),
    public world: World = ctx.world,
    public canvas = $(new Canvas(world), { size: rect.$.size }),
    public pr = world.screen.$.pr,
  ) {
    super(world)
  }

  coeff = 1
  renderPosition: RenderPosition = RenderPosition.Layout
  needInit?: boolean
  needUpdate?: boolean
  needRender?: boolean
  needDraw?: boolean
  needDirectDraw?: boolean

  viewRect?: $<Rect>

  isVisible = false
  isFocused = false
  isHovering = false

  abstract initCanvas(c: CanvasRenderingContext2D): void
  abstract update(deltaTime: number): number
  abstract updateOne(deltaTime: number): number
  abstract render(t: number, c: CanvasRenderingContext2D, clear: boolean): void
  abstract draw(t: number, c: CanvasRenderingContext2D): void

  @fx trigger_needInit_on_size() {
    const { pr } = $.of(this)
    const { size: { x, y } } = $.of(this.canvas)
    this.needInit = true
  }
}
