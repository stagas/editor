import { $ } from 'signal'
import { World } from 'std'
import { dom } from 'utils'
import { Editor } from '../src/editor.ts'
import { Source } from '../src/source.ts'

const style = document.createElement('style')
dom.head.append(style)
style.textContent = /*css*/`
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
`

function tokenize({ code }: { code: string }) {
  return [...code.matchAll(/(?<word>\w+)|(?<space>\s+)/g)]
    .map(m => {
      return {
        type: 'text',
        text: m[0],
        line: code.slice(0, m.index).split('\n').length,
        col: m.index! - code.slice(0, m.index).split('\n').slice(0, -1).join('\n').length,
      }
    })
}

const world = $(new World)
world.canvas.appendTo(dom.body)
const scene = $(new Editor(world))
// const source = $(new Source(tokenize))
// source.code = 'hello world'
// scene.ctx.buffer.source = source
scene.draw()
