import { $ } from 'signal'
import { World } from 'std'
import { dom } from 'utils'
import { Editor } from '../src/editor.ts'

const world = $(new World)
const scene = $(new Editor(world))
scene.canvas.appendTo(dom.body)
scene.draw()
