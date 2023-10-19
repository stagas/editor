import { $, fx } from 'signal'
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

const code = String.raw`{ x:=
  8123    \
[  [sin 3]  ]

   }
[lfo 456     \ [sin 46.92\] 1913    \* + ] [exp 2] [blp 300]* @ [blp 500 q:1] @LR+=
[rate 30k1]
[zoo 50      \ [lfo 1         \]22        \*+ 33.5+] [exp .8] [blp 300]* @LR+=
[zoo 166     \ [lfo 4         \]973.9     \*+ ] [exp .5] [blp 300]* .215* @ [bhp 200 q:1] @LR+=
`.repeat(10)

function tokenize({ code }: { code: string }) {
  return [...code.matchAll(/(?<word>[^\s]+)|(?<space>[\s]+)/g)]
    .map(({ 0: text, index }) => ({
      type: 'text',
      text,
      line: code.slice(0, index).split('\n').length - 1,
      col: Math.max(0, index! - code.lastIndexOf('\n', index) - 1),
    }))
}

$.batch(() => {
  const world = $(new World)
  const editor = $(new Editor(world))
  $.flush()
  world.canvas = editor.canvas
  editor.canvas.appendTo(dom.body)
  const source = $(new Source(tokenize))
  source.code = code //'[hello world]'

  editor.buffer.source = source
  editor.buffer.coli = 3
  editor.selection.start.set({ x: 3, y: 0 })
  editor.selection.end.set({ x: 7, y: 0 })

  world.anim.items.push(editor)
  world.anim.start()
})
