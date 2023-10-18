log.active
import { $, fx } from 'signal'
import { Canvas, Rect, Scene, World } from 'std'

export abstract class Render extends Scene {
  constructor(
    public world: World,
    public rect = $(new Rect),
    public canvas = $(new Canvas(world), { size: rect.$.size }),
    public pr = world.screen.$.pr,
  ) {
    super(world)
  }

  needInit?: boolean
  needRender?: boolean
  needDraw?: boolean

  abstract initCanvas(c: CanvasRenderingContext2D): void
  abstract render(c?: CanvasRenderingContext2D): void
  abstract draw(c: CanvasRenderingContext2D): void

  @fx trigger_needInit_on_size() {
    const { size: { text } } = $.of(this.canvas)
    this.needInit = true
  }
}
