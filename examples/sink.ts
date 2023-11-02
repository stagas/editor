import { $, fx, of } from 'signal'
import { Animable, Keyboard, Pointer, World } from 'std'
import { dom, seedRand, timeout } from 'utils'
import { Editor } from '../src/editor.ts'
import { Source } from '../src/source.ts'

Math.random = seedRand(666)

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
  return [...code.matchAll(/(?<brackets>[\[\]\{\}\(\)])|(?<word>[^\s\[\]\{\}\(\)]+)|(?<space>[\s]+)/g)]
    .map(({ 0: text, index }) => ({
      type: Number(text).toString() === text ? 'number' : 'text',
      text,
      line: code.slice(0, index).split('\n').length - 1,
      col: Math.max(0, index! - code.lastIndexOf('\n', index) - 1),
    }))
}

function setup() {
  return $.batch(() => {
    const world = $(new World)
    world.pointer = $(new Pointer(world))
    world.keyboard = $(new Keyboard(world))
    world.keyboard.appendTo(dom.body)

    const editor = $(new Editor(world))

    return function start() {
      world.render.view = editor.renderable.rect
      // console.log(editor.renderable.rect.text)
      world.canvas = editor.renderable.canvas
      world.canvas.appendTo(dom.body)

      world.it = editor

      setTimeout(() => {
        world.keyboard!.textarea.focus()
      }, 50)

      const source = $(new Source(tokenize))
      source.code = code //'[hello world]'

      editor.buffer.source = source
      editor.buffer.coli = 3
      editor.selection.start.set({ x: 3, y: 0 })
      editor.selection.end.set({ x: 7, y: 0 })

      world.render
        .add(editor)

      // world.anim.fps = 60
      // world.anim.speed = 1
      world.anim
        .add(editor)
        .add(world.render)
        .start()

      const stop = (e?: MouseEvent) => {
        // if (e.buttons & MouseButtons.Right) {
        e?.preventDefault()
        world.anim.stop().removeAll()
        // }
      }

      let phase = 0
      class UpdateScroll {
        get animable() {
          class UpdateScrollAnimable extends Animable {
            need = Animable.Need.Tick
            tick() {
              phase += 0.1
              editor.scroll.targetScroll.y = -400 + Math.sin(phase) * 200 //+ Math.random() * 150
            }
          }
          return $(new UpdateScrollAnimable(this as Animable.It))
        }
      }
      // const updateScroll = $(new UpdateScroll)
      // world.anim.add(updateScroll)

      world.canvas!.el.oncontextmenu = stop

      return stop
    }
  })
}

const start = setup()
const stop = start()

declare function parseTrace(secs: number): Promise<any>

export async function test_editor() {
  // @env browser
  describe('perf', () => {
    jest.setTimeout(30000)
    it('editor', async () => {
      await timeout(3000)
      await parseTrace(7)
    })
  })
}
