log.active
import { $, fx } from 'signal'
import { Canvas, Rect, Scene, World } from 'std'
import { Editor } from './editor'

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

  needInit?: boolean
  needRender?: boolean
  needDraw?: boolean

  isVisible = false
  isFocused = false
  isHovering = false

  abstract initCanvas(c: CanvasRenderingContext2D): void
  abstract render(c?: CanvasRenderingContext2D): void
  abstract draw(c: CanvasRenderingContext2D): void

  @fx trigger_needInit_on_size() {
    const { size: { xy } } = $.of(this.canvas)
    this.needInit = true
  }
}
