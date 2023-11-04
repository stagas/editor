// log.active
import { $, fn, fx, of, when } from 'signal'
import { Keyboard, Keyboardable, Mouse, Mouseable, Renderable } from 'std'
import { MouseButtons, prevent } from 'utils'
import { Comp } from './comp.ts'
import { Linecol } from './linecol.ts'
import { Scroll } from './scroll.ts'
import { SourceToken } from './source.ts'
import { Close, NONSPACE, Open, SPACE, WORD, closers, escapeRegExp, findMatchingBrackets, lineBegin, openers, parseWords } from './util.ts'

interface Keypress {
  key?: Keyboard.Key | undefined
  char?: string | undefined
  special?: (
    Keyboard.Key & {
      kind: Keyboard.KeyKind.Special
    })['value'] | ''
  alt?: boolean | undefined
  ctrl?: boolean | undefined
  shift?: boolean | undefined
  time?: number
}

const ignoredKeys = 'cvxJr=+-tn'
const handledKeys = 'zyvxc=+-tnb'

export class Text extends Comp
  implements Keyboardable.It, Mouseable.It, Renderable.It {
  linecol = $(new Linecol)
  get keyboardable() {
    $()
    const it = this
    const { misc, clipboard, selection } = it.ctx
    const { Down, Up, Copy, Cut, Paste } = Keyboard.EventKind
    const { Char, Special } = Keyboard.KeyKind
    class TextKeyboardable extends Keyboardable {
      onKeyboardEvent(kind: Keyboard.EventKind): string | true | void | undefined {
        const { key, char, special, alt, ctrl, shift } = this.kbd
        switch (kind) {
          case Down:
            if (ctrl) {
              if (special === 'Control' || ignoredKeys.includes(char)) {
                break
              }
            }
            misc.isTyping = true
            return this.handleKey(this.kbd)
          case Up:
            break
          case Copy:
            return selection.selectionText
          case Cut:
            return selection.deleteSelection()
          case Paste:
            clipboard.handlePaste(this.kbd.clip!)
            break
        }
      }

      // shiftKey = false

      specialKeys: any = {
        'Enter': '\n',
        'Tab': '  ',
        'Space': ' ',
      }

      @fn handleKey(keypress: Keypress) {
        const { specialKeys } = this
        const { ctx } = of(it)
        const { misc, history, buffer: b, dims, scroll, selection } = of(ctx)
        const { rect } = of(dims)
        const { hasSelection } = of(selection)
        let { code, lines } = of(b)

        // if (onKeyDown(event)) return true

        let { key, char = '', special = '', alt, ctrl, shift } = keypress

        // const { key, ctrl: ctrlKey = false, metaKey = false, shiftKey = false, altKey = false } = event

        if (!(b.line in lines)) {
          return
          // throw new Error('Invalid line: ' + b.line)
        }

        let text = lines[b.line]
        const currentChar = text[b.col]
        const maxLine = lines.length - 1
        const page = Math.floor(rect.h / dims.lineHeight)

        let x: number
        let dy: number
        let targetLine: number

        console.log({ char, special })
        char = special in specialKeys
          ? specialKeys[special]
          : char.length === 1 && char.match(/[\S\s]/)
            ? char
            : ''

        // this.shiftKey = shiftKey

        switch (special) {
          case 'Control':
            return

          case 'Shift':

            if (!hasSelection) {
              selection.end.set(selection.start.set({ x: b.col, y: b.line }))
            }
            break

          case 'ArrowDown':

            if (b.line === maxLine) break

            // move line(s)
            if (alt || (shift && ctrl)) {
              history.saveHistoryDebounced()
              if (!hasSelection) {
                const line = lines.splice(b.line, 1)[0]!
                lines.splice(++b.line, 0, line)
                b.code = lines.join('\n')
                $.flush()
                selection.start.set(selection.end)
                break
              }
              else {
                const { top, bottom } = selection.sorted
                if (bottom.y === maxLine) break

                const slice = lines.splice(top.y, bottom.y - top.y + 1)
                lines.splice(++top.y, 0, ...slice)
                ++bottom.y
                b.code = lines.join('\n')
              }
            }

            ++b.line

            break

          case 'ArrowUp':

            if (b.line === 0) break

            // move line(s)
            if (alt || (shift && ctrl)) {
              history.saveHistoryDebounced()
              if (!hasSelection) {
                const line = lines.splice(b.line, 1)[0]!
                lines.splice(--b.line, 0, line)
                b.code = lines.join('\n')
                $.flush()
                selection.start.set(selection.end)
                break
              }
              else {
                const { top, bottom } = selection.sorted
                if (top.y === 0) break

                const slice = lines.splice(top.y, bottom.y - top.y + 1)
                lines.splice(--top.y, 0, ...slice)
                --bottom.y
                b.code = lines.join('\n')
              }
            }

            --b.line

            break

          case 'ArrowRight':

            if (b.col === text.length && b.line === maxLine) break
            if (b.col < text.length && ctrl) {
              const words = parseWords(WORD, text)
              let word
              out: {
                for (let i = 0; i < words.length; i++) {
                  word = words[i]!
                  if (word.index > b.col) {
                    b.col = word.index
                    break out
                  }
                }
                b.col = text.length
              }
            }
            else {
              ++b.col
            }
            if (b.col > text.length) {
              b.col = 0
              ++b.line
            }
            b.coli = b.col
            break

          case 'ArrowLeft':

            if (b.col === 0 && b.line === 0) break
            if (b.col > 0 && ctrl) {
              const words = parseWords(WORD, text)
              let word
              out: {
                for (let i = words.length - 1; i >= 0; --i) {
                  word = words[i]!
                  if (word.index < b.col) {
                    b.col = word.index
                    break out
                  }
                }
                b.col = 0
              }
            }
            else {
              --b.col
            }
            if (b.col < 0) {
              --b.line
              text = lines[b.line]!
              b.col = text.length
            }
            b.coli = b.col
            break

          case 'PageDown':
          case 'PageUp':

            if (special === 'PageDown') {
              targetLine = b.line + page
              if (targetLine >= maxLine) {
                targetLine = maxLine
                b.col = lines[maxLine]!.length
              }
            }
            else {
              targetLine = b.line - page
              if (targetLine <= 0) {
                targetLine = 0
                b.col = 0
              }
            }
            dy = targetLine - b.line
            b.line = targetLine
            scroll.targetScroll.top -= dy * dims.lineHeight
            scroll.animSettings = Scroll.AnimSettings.Slow
            break

          case 'Home':

            NONSPACE.lastIndex = 0
            x = NONSPACE.exec(text)?.index ?? 0
            b.coli = b.col = x === b.col ? 0 : x
            break

          case 'End':

            b.coli = b.col = text.length
            break

          case 'Backspace':
            history.saveHistoryDebounced()

            if (selection.hasSelection) {
              selection.deleteSelection.sansHistory()
              break
            }

            if (b.col > 0 && ctrl) {
              history.saveHistoryMeta()
              selection.start.set({ x: b.col, y: b.line })
              this.handleKey({ special: 'ArrowLeft', ctrl: true, shift: true })
              $.flush() //await rest()
              this.handleKey({ char })
              break
            }

            if (b.col === 0) {
              if (b.line > 0) {
                const y = b.line

                // this.shiftDecoTokenLines(y, -1)
                // await rest()

                --b.line
                b.col = b.coli = lines[b.line]!.length
                lines[b.line] += text
                b.lines!.splice(y, 1)
                b.code = b.lines!.join('\n')
                // this.draw()

                // this.deleteLine(b.line + 1)
                // lines.splice(b.line + 1, 1)
                // b.code = lines.join('\n')
              }
            }
            else {
              lines[b.line] =
                text.slice(0, b.col - 1)
                + text.slice(b.col)
              b.coli = b.col - 1
              b.col = b.coli
              b.code = lines.join('\n')
            }

            if (closers.has(currentChar) && text[b.col] === Close[currentChar]) {
              this.handleKey({ special: 'Delete' })
            }
            break

          case 'Delete':
            history.saveHistoryDebounced()

            if (selection.hasSelection) {
              selection.deleteSelection.sansHistory()
              break
            }

            if (shift) {
              if (b.line === maxLine && !maxLine) {
                if (text.length) {
                  selection.start.zero()
                  selection.end.zero().x = text.length
                  selection.deleteSelection()
                }
                break
              }

              selection.start.zero().y = b.line
              if (b.line === maxLine && b.col === 0) {
                selection.end.zero().y = b.line - 1
              }
              else {
                selection.end.zero().y = b.line + 1
              }
              selection.deleteSelection()
              break
            }

            if (ctrl) {
              history.saveHistoryMeta()
              selection.start.set({ x: b.col, y: b.line })
              this.handleKey({ special: 'ArrowRight', ctrl: true, shift: true })
              // await rest()
              $.flush()
              this.handleKey({ char })
              break
            }

            if (b.col === text.length) {
              if (b.line < maxLine) {
                lines[b.line] =
                  text.slice(0, b.col)
                  + lines[b.line + 1]
                lines.splice(b.line + 1, 1)
                b.code = lines.join('\n')
              }
            }
            else {
              lines[b.line] =
                text.slice(0, b.col)
                + text.slice(b.col + 1)
              b.code = lines.join('\n')
            }

            break

          case 'Tab':
            if (selection.hasSelection || shift) {
              history.saveHistoryDebounced()

              const { hasSelection } = selection
              let index: number = Infinity
              let lns: string[]
              let y: number
              if (hasSelection) {
                const { top, bottom } = selection.sorted
                for (let i = top.y; i <= bottom.y; i++) {
                  index = Math.min(index, lineBegin(lines[i]!))
                }
                y = top.y
                lns = lines.slice(top.y, bottom.y + 1)
              }
              else {
                index = lineBegin(text)
                y = b.line
                lns = [lines[y]!]
              }

              const dec = shift
              if (dec && !index) return

              let diff!: number
              const tabSize = 2
              const tab = ' '.repeat(tabSize)
              lns.forEach((text, i) => {
                if (dec) {
                  diff = -tabSize
                  text = text.replace(new RegExp(`^(\t| {1,${tabSize}})`, 'gm'), '')
                }
                else {
                  diff = +tabSize
                  text = text.length === 0 ? tab : text.replace(/^[^\n]/gm, `${tab}$&`)
                }
                lines[y + i] = text
              })
              b.coli = Math.max(0, b.coli + diff)
              b.col = b.coli

              b.code = lines.join('\n')
              if (hasSelection) {
                selection.start.x += diff
                selection.end.x += diff
              }
              else {
                // await rest()
                $.flush()
                selection.start.set(selection.end)
              }
              return
            }

          // eslint-disable-next-line no-fallthrough
          default:

            if (ctrl) {
              switch (char) {
                case 'a': {
                  // TODO: test that it does fill the textarea
                  b.getLineColFromIndex(0, selection.start)
                  b.getLineColFromIndex(code.length, selection.end)

                  // $.flush()
                  // selection.updateTextareaText()
                  return
                }

                case 'D':
                  history.saveHistoryDebounced()
                  if (hasSelection) {
                    const { top, bottom } = selection.sorted
                    const p1 = b.getIndexFromLineCol(top)
                    const p2 = b.getIndexFromLineCol(bottom)
                    b.code = code.slice(0, p2)
                      + code.slice(p1, p2)
                      + code.slice(p2)
                    const p = b.getLineColFromIndex(p2 + (p2 - p1))
                    $.flush()
                    selection.start.set(bottom)
                    selection.end.set(p)
                    b.line = p.line
                    b.coli = b.col = p.col
                  }
                  else {
                    lines.splice(b.line, 0, text)
                    b.code = lines.join('\n')
                    b.line++
                    $.flush()
                    selection.start.set(selection.end)
                  }
                  break

                case 'b':
                  selection.selectMatchingBrackets(b.linecol)
                  break

                case 'B':
                  selection.selectMatchingBrackets(b.linecol, true)
                  break

                case 'z':
                  scroll.animSettings = Scroll.AnimSettings.Fast
                  history.undo()
                  break

                case 'y':
                  scroll.animSettings = Scroll.AnimSettings.Fast
                  history.redo()
                  break

                // toggle line comment

                case ':':
                case '?': {
                  history.saveHistoryDebounced()

                  if (hasSelection) {
                    const { top, bottom } = selection.sorted
                    const p1 = b.getIndexFromLineCol(top)
                    const p2 = b.getIndexFromLineCol(bottom)
                    const dx = 2 + (top.y === bottom.y ? 2 : 0)
                    if (code.slice(p1, p1 + 2) === '/;'
                      && code.slice(p2 - 2, p2) === ';/'
                    ) {
                      b.code = code.slice(0, p1)
                        + code.slice(p1 + 2, p2 - 2)
                        + code.slice(p2)
                      if (b.line === bottom.y && b.col === bottom.x) b.coli -= dx
                      bottom.x -= dx
                    }
                    else {
                      b.code = code.slice(0, p1)
                        + '/;'
                        + code.slice(p1, p2)
                        + ';/'
                        + code.slice(p2)
                      if (b.line === bottom.y && b.col === bottom.x) b.coli += dx
                      bottom.x += dx
                    }
                    b.col = b.coli
                  }
                  else {
                    const index = b.getIndexFromLineCol(b.linecol)
                    const match = findMatchingBrackets(code, index)
                    if (match) {
                      if (code[match[0] + 1] === ';') {
                        b.code = code.slice(0, match[0] + 1) + code.slice(match[0] + 2)
                        b.coli--
                      }
                      else {
                        b.code = code.slice(0, match[0] + 1) + ';' + code.slice(match[0] + 1)
                        b.coli++
                      }
                    }
                    $.flush()
                    selection.start.set(selection.end)
                  }
                  break
                }

                case ';':
                case '/': {
                  history.saveHistoryDebounced()

                  const c = misc.lineComment
                  const ce = escapeRegExp(c)
                  let index: number = Infinity
                  let lns: string[]
                  let y: number
                  if (selection.hasSelection) {
                    const { top, bottom } = selection.sorted
                    for (let i = top.y; i <= bottom.y; i++) {
                      index = Math.min(index, lineBegin(lines[i]!))
                    }
                    y = top.y
                    lns = lines.slice(top.y, bottom.y + 1)
                  }
                  else {
                    index = lineBegin(text)
                    y = b.line
                    lns = [lines[y]!]
                  }

                  let diff!: number
                  const dec = lns.every((text) => text.trimStart().slice(0, c.length) === c)
                  lns.forEach((text, i) => {
                    if (dec) {
                      const r = new RegExp(`^([^${ce}]*)${ce} ?`, 'gm')
                      diff = -(c.length + 1)
                      text = text.replace(r, '$1')
                    }
                    else {
                      const r = new RegExp(`^(?!$)([^${ce}]{0,${index}})`, 'gm')
                      diff = +(c.length + 1)
                      text = text.length === 0
                        ? c + ' '
                        : text.replace(r, `$1${c} `)
                    }
                    lines[y + i] = text
                  })
                  b.coli = Math.max(0, b.coli + diff)
                  b.col = b.coli
                  if (selection.hasSelection) {
                    selection.start.x += diff
                    selection.end.x += diff
                  }
                  b.code = lines.join('\n')
                  return
                }
              }
            }

            if (ctrl || alt) break

            if (char?.length) {
              history.saveHistoryDebounced()

              if (selection.hasSelection) {
                const { line, col } = b
                const { left, right } = selection.getSelectionIndexes()
                const deletedText = selection.deleteSelection.sansHistory()
                // when it is a bracket opener or closer, reinsert the deleted
                // text but wrapped in that bracket pair
                if (openers.has(char) || closers.has(char)) {
                  const o = openers.has(char) ? char : Close[char]
                  const c = Open[o]
                  b.code = code.slice(0, left)
                    + o
                    + deletedText
                    + c
                    + code.slice(right)
                  b.linecol.line = line
                  b.linecol.col = col
                  const index = b.getIndexFromLineCol(b.linecol)
                  const p = b.getLineColFromIndex(index + 1)
                  b.line = p.line
                  b.col = b.coli = p.col
                  selection.start.set(selection.end.set(p))
                  break
                }
                lines = b.code.split('\n')
                text = lines[b.line]!
              }

              const hasBracketLeft = Open[text[b.col - 1]]
              const hasBracketRight = Close[text[b.col]]
              const hasSpaceRight = (b.col === text.length) || SPACE.test(text[b.col])
              const isInBrackets = ((b.col === text.trimEnd().length - 1) && hasBracketRight && hasBracketLeft)
              const beginOfLine = lineBegin(text) ?? 0

              const isEnter = char === '\n'
              const indent = (isEnter
                ? ' '.repeat(b.col === text.trimEnd().length || isInBrackets ? beginOfLine : b.col)
                + ' '.repeat(hasBracketLeft ? 2 : 0)
                : '')

              const isCharSameAsBracketRight = closers.has(char) && char === text[b.col]

              if (!isCharSameAsBracketRight) {
                lines[b.line] =
                  text.slice(0, b.col)
                  + char
                  + indent + (isEnter && isInBrackets ? '\n' + ' '.repeat(beginOfLine) : '')
                  + text.slice(b.col)

                b.code = lines.join('\n')
              }

              if (isEnter) {
                b.coli = indent.length
                ++b.line
              }
              else {
                b.coli = b.col + char.length
              }
              b.col = b.coli

              if (hasSpaceRight && openers.has(char)) {
                this.handleKey({ char: Open[char] })
                b.coli--
                b.col = b.coli
              }

              selection.start.set(selection.end.set({ x: b.col, y: b.line }))
            }
            break
        }

        // TODO: test this

        if (
          !shift
          && !alt
          && selection.hasSelection
          && (
            !ctrl
            || !handledKeys.includes(char)
          )
        ) {
          selection.start.set(selection.end)
        }

        return true
      }
      // handleOnInput = (e: InputEvent) => {
      //   const { input } = of(this.ctx)
      //   const key = e.data!.at(-1)
      //   if (key) {
      //     this.handleKey({ key })
      //     setTimeout(() => {
      //       input.textarea.value = ''
      //     }, 50)
      //   }
      //   e.preventDefault()
      // }
      // handleKeyDown = (e: KeyboardEvent) => {
      //   if (e.ctrlKey || e.metaKey) {
      //     if (e.key === 'Control' || ignoredKeys.includes(e.key)) {
      //       return
      //     }
      //   }

      //   const { misc } = of(this.ctx)
      //   misc.isTyping = true

      //   // if (this.handleKey(e)) return
      //   this.handleKey(e)

      //   e.preventDefault()
      // }
      // handleKeyUp = (e: KeyboardEvent) => {
      //   const { scroll } = of(this.ctx)

      //   if (!e.key.startsWith('Page')
      //     && e.key !== 'v') {
      //     requestAnimationFrame(() => {
      //       scroll.animSettings = Scroll.AnimSettings.Fast
      //     })
      //   }

      //   this.shiftKey = e.shiftKey
      // }
    }
    return $(new TextKeyboardable(it as Keyboardable.It))
  }
  get mouseable(): Mouseable {
    $()
    const it = this
    const { ctx, linecol } = of(it)
    const { dims } = of(ctx)
    const { misc, buffer, scroll, selection, keyboard } = of(ctx)
    const { Wheel, Down, Up, Move, Click } = Mouse.EventKind

    class TextMouseable extends Mouseable {
      hitArea = dims.rect
      cursor = 'text'
      @fn onMouseEvent(kind: Mouse.EventKind) {
        const { mouse, isDown } = this

        if (kind !== Wheel) {
          buffer.getLineColFromPoint(
            mouse.pos,
            true,
            linecol
          )
        }

        log('linecol', linecol.text)
        misc.isTyping = false

        switch (kind) {
          case Click:
          case Up:
            keyboard.textarea.focus()
            return true

          case Wheel:
            scroll.targetScroll.mulSub(mouse.wheel, 0.35)
            scroll.animSettings = Scroll.AnimSettings.Medium
            return true

          case Move:
            if (isDown && (mouse.buttons & MouseButtons.Left)) {
              selection.end.set(linecol)
              buffer.linecol.set(linecol)
              buffer.coli = linecol.col
            }
            return true

          case Down:
            if (!(mouse.buttons & MouseButtons.Left)) return

            prevent(of(mouse).real)

            const { downCount } = mouse

            buffer.linecol.set(linecol)
            buffer.coli = linecol.col

            switch (downCount) {
              case 1:
                if (mouse.shift) {
                  selection.end.set(linecol)
                }
                else {
                  selection.resetTo(linecol)
                }
                break

              case 2:
                if (selection.selectWordBoundary(linecol, mouse.shift)) {
                  mouse.downCount = 2
                  break
                }
              case 3:
                if (selection.selectMatchingBrackets(linecol)) {
                  mouse.downCount = 3
                  break
                }
              case 4:
                selection.selectLine(linecol.line)
                break
            }
            return true
        }
      }
    }
    return $(new TextMouseable(it as Mouseable.It))
  }
  get renderable() {
    $()
    const it = this
    const { ctx } = of(it)
    const { buffer, dims, skin, scroll } = of(ctx)
    const { visibleSpan } = dims
    const { Token } = buffer
    class TextRenderable extends Renderable {
      canDirectDraw = true
      didInitCanvas = false
      @fx update_inner_size() {
        const { rect } = this
        const { w, h } = dims.innerSize
        $()
        rect.w = Math.max(100, rect.w, w || 0)
        rect.h = Math.max(100, rect.h, h || 0)
      }
      get colors(): Record<string, string> {
        const op = 'red'
        const brace = 'yellow'
        const c = skin.colors
        return {
          Id: c.brightRed,
          Number: c.white,
          String: c.brightYellow,
          Comment: c.brightBlack,
          BlockComment: c.brightBlack,
          '[': brace,
          ']': brace,
          '{': brace,
          '}': brace,
          '(': brace,
          ')': brace,
          '+': op,
          '-': op,
          '*': op,
          '^': op,
          '%': op,
          '!': op,
          '/': op,
          'L': c.brightCyan,
          'R': c.brightCyan,
          'LR': c.brightCyan,
          '=': op,
          '+=': op,
          '*=': op,
          '-=': op,
          '/=': op,
          '%=': op,
          '^=': op,
          ':=': op,
          '\\': c.brightPurple,
          '@': c.brightPurple,
          '@~': c.brightPurple,
          ':': c.red,
          '.': c.red,
          ',': c.brightPurple,
          't': c.brightPurple,
          'M': c.brightRed,
          'S': c.brightCyan,
          'pick': c.brightPurple,
          'floor': c.brightPurple,
          'slide': c.brightPurple,
          'to_audio': c.brightPurple,
        }
      }
      @fx measure_charWidth() {
        const { didInitCanvas } = when(this)
        const { canvas } = of(this)
        const { c } = of(canvas)
        const em = c.measureText('M')
        dims.charWidth = em.width
      }
      @fx trigger_render_when_scroll() {
        const { charWidth, scroll: { x, y } } = of(dims)
        $()
        this.need |= Renderable.Need.Render
      }
      @fx trigger_render_when_win_resize() {
        const { charWidth, rect: { w, h } } = of(dims)
        $()
        this.need |= Renderable.Need.Render
      }
      @fx trigger_render_when_misc() {
        const { pr, rect } = this
        const { size: { wh: size_wh } } = rect
        const {
          fontSize,
          lineBaseBottoms,
          lineHeight,
          charWidth,
          innerSize: { wh },
        } = of(dims)
        const { source, tokens, Token } = of(buffer)
        $()
        this.need |= Renderable.Need.Render
      }
      get font() {
        return `100 ${dims.fontSize}px ${skin.fonts.mono}`
      }
      get lineWidth() {
        return dims.fontSize / 100
      }
      @fn init(c: CanvasRenderingContext2D) {
        c.imageSmoothingEnabled = false
        c.miterLimit = 3
        c.lineJoin = 'round'
        c.lineCap = 'round'
        c.textAlign = 'left'
        c.textBaseline = 'bottom'
        c.font = this.font
        c.lineWidth = this.lineWidth
        this.need &= ~Renderable.Need.Init
        if (this.didInitCanvas) {
          this.need |= Renderable.Need.Render
        }
        else {
          this.didInitCanvas = true
        }
      }
      @fn render(c: CanvasRenderingContext2D, t: number, clear: boolean) {
        const { rect, colors } = this
        const { charWidth } = of(dims)
        const { lineBaseBottoms } = dims
        const { tokens } = buffer

        // log('tokens', tokens)
        if (clear) {
          rect.clear(c)
        }

        c.save()
        c.translate(Math.round(scroll.x), Math.round(scroll.y))
        for (let i = 0, t: SourceToken, x: number, y: number; i < tokens!.length; i++) {
          t = tokens![i]

          if (!t.type || !t.text) continue

          y = lineBaseBottoms[t.line]

          if (y > visibleSpan.top && y < visibleSpan.bottom) {
            x = t.col * charWidth + 1

            c.fillStyle
              = c.strokeStyle
              =
              (t.text.length <= 2
                && colors?.[t.text]) // TODO: this is slow
              ||
              (colors?.[Token.Type[t.type]] ?? '#fff')

            c.strokeText(t.text, x, y)
            c.fillText(t.text, x, y)
          }
        }
        c.restore()

        this.need &= ~Renderable.Need.Render
        this.need |= Renderable.Need.Draw
      }
      @fn draw(c: CanvasRenderingContext2D) {
        const { pr, canvas, view } = of(this)
        view.round().drawImage(
          canvas.el, c, pr, true)
        this.need &= ~Renderable.Need.Draw
      }
    }
    return $(new TextRenderable(it as Renderable.It))
  }
}
