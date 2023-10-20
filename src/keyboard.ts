import { $, fn } from 'signal'
import { Comp } from './comp.ts'
import { Scroll } from './scroll.ts'
import { Close, NONSPACE, Open, SPACE, WORD, closers, escapeRegExp, findMatchingBrackets, lineBegin, openers, parseWords } from './util.ts'

export interface Key {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

const ignoredKeys = 'cvxJr=+-tn'
const handledKeys = 'zyvxc=+-tnb'

export class Keyboard extends Comp {
  shiftKey = false

  specialKeys: any = {
    'Enter': '\n',
    'Tab': '  ',
    'Space': ' ',
  }

  @fn handleKey(event: Key) {
    const { ctx, /* onKeyDown,  */specialKeys } = $.of(this)
    const { misc, history, buffer: b, dims, scroll, selection } = $.of(ctx)
    const { rect } = $.of(dims)
    const { hasSelection } = $.of(selection)
    let { code, lines } = $.of(b)

    // if (onKeyDown(event)) return true

    const { key, ctrlKey = false, metaKey = false, shiftKey = false, altKey = false } = event

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

    const char: string = key in specialKeys
      ? specialKeys[key]
      : key.length === 1 && key.match(/[\S\s]/)
        ? key
        : ''

    this.shiftKey = shiftKey

    switch (key) {
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
        if (altKey || (shiftKey && (ctrlKey || metaKey))) {
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
        if (altKey || (shiftKey && (ctrlKey || metaKey))) {
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
        if (b.col < text.length && (ctrlKey || metaKey)) {
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
        if (b.col > 0 && (ctrlKey || metaKey)) {
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

        if (key === 'PageDown') {
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

        if (b.col > 0 && (ctrlKey || metaKey)) {
          history.saveHistoryMeta()
          selection.start.set({ x: b.col, y: b.line })
          this.handleKey({ key: 'ArrowLeft', ctrlKey: true, shiftKey: true })
          $.flush() //await rest()
          this.handleKey({ key })
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
          this.handleKey({ key: 'Delete' })
        }
        break

      case 'Delete':
        history.saveHistoryDebounced()

        if (selection.hasSelection) {
          selection.deleteSelection.sansHistory()
          break
        }

        if (shiftKey) {
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

        if (ctrlKey || metaKey) {
          history.saveHistoryMeta()
          selection.start.set({ x: b.col, y: b.line })
          this.handleKey({ key: 'ArrowRight', ctrlKey: true, shiftKey: true })
          // await rest()
          $.flush()
          this.handleKey({ key })
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
        if (selection.hasSelection || shiftKey) {
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

          const dec = shiftKey
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

        if (ctrlKey || metaKey) {
          switch (key) {
            case 'a': {
              b.getLineColFromIndex(0, selection.start)
              b.getLineColFromIndex(code.length, selection.end)
              $.flush()
              selection.updateTextareaText()
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
                // await rest()
                selection.start.set(selection.end)
              }
              break

            case 'b':
              selection.selectMatchingBrackets(b.lineCol)
              break

            case 'B':
              selection.selectMatchingBrackets(b.lineCol, true)
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
                const index = b.getIndexFromLineCol(b.lineCol)
                const match = findMatchingBrackets(code, index)
                if (match) {
                  if (code[match[0] + 1] === ';') {
                    b.code = code.slice(0, match[0] + 1) + code.slice(match[0] + 2)
                  }
                  else {
                    b.code = code.slice(0, match[0] + 1) + ';' + code.slice(match[0] + 1)
                  }
                }
                $.flush()
                // await rest()
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

        if (ctrlKey || metaKey || altKey) break

        if (char.length) {
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
              b.lineCol.line = line
              b.lineCol.col = col
              const index = b.getIndexFromLineCol(b.lineCol)
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
            this.handleKey({ key: Open[char] })
            b.coli--
            b.col = b.coli
          }

          selection.start.set(selection.end.set({ x: b.col, y: b.line }))
        }
        break
    }

    if (
      !shiftKey
      && !altKey
      && selection.hasSelection
      && (
        !ctrlKey
        || !handledKeys.includes(key)
      )
    ) {
      selection.start.set(selection.end)
    }
  }
  handleOnInput = (e: InputEvent) => {
    const { input } = $.of(this.ctx)
    const key = e.data!.at(-1)
    if (key) {
      this.handleKey({ key })
      setTimeout(() => {
        input.textarea.value = ''
      }, 50)
    }
    e.preventDefault()
  }
  handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'Control' || ignoredKeys.includes(e.key)) {
        return
      }
    }

    const { misc } = $.of(this.ctx)
    misc.isTyping = true

    // if (this.handleKey(e)) return
    this.handleKey(e)

    e.preventDefault()
  }
  handleKeyUp = (e: KeyboardEvent) => {
    const { scroll } = $.of(this.ctx)

    if (!e.key.startsWith('Page')
      && e.key !== 'v') {
      requestAnimationFrame(() => {
        scroll.animSettings = Scroll.AnimSettings.Fast
      })
    }

    this.shiftKey = e.shiftKey
  }
}
