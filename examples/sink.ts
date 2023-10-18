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
  const regex = /(?<word>[^\s]+)|(?<space>[\s]+)/g;
  let line = 0; // Initialize line and col as 0
  let col = 0;
  let c

  return [...code.matchAll(regex)].map(match => {
    const { word, space } = match.groups as any;

    if (word) {
      c = col
      col += word.length;
      return { type: 'text', text: word, line, col: c };
    } else if (space) {
      const newlineCount = (space.match(/\n/g) || []).length;
      line += newlineCount;
      c = col
      col = newlineCount === 0 ? col + space.length : 0; // Reset col to 0 when a newline is encountered
      return { type: 'text', text: space, line, col: c };
    }

    return null;
  }).filter(Boolean);

  // return [...code.matchAll(/(?<word>[^\s]+)|(?<space>[\s]+)/g)]
  //   .map(m => {
  //     return {
  //       type: 'text',
  //       text: m[0],
  //       line: code.slice(0, m.index).split('\n').length - 1,
  //       col: Math.max(0,
  //         m.index!
  //         - code.slice(0, m.index)
  //           .split('\n')
  //           .slice(0, -1)
  //           .join('\n').length - 1
  //       ),
  //     }
  //   })
}

const world = $(new World)
const editor = $(new Editor(world))

$.batch(() => {
  world.canvas = editor.canvas
  editor.canvas.appendTo(dom.body)

  const source = $(new Source(tokenize))
  source.code = code //'[hello world]'

  editor.buffer.source = source
  editor.buffer.coli = 3
  editor.selection.start.set({ x: 3, y: 0 })
  editor.selection.end.set({ x: 7, y: 0 })
})
