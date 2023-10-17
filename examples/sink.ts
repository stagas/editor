import { $ } from 'signal'
import { World } from 'std'
import { dom } from 'utils'
import { Editor } from '../src/editor.ts'

const world = $(new World)
world.canvas.appendTo(dom.body)
const scene = $(new Editor(world))
scene.draw()
