// log.active
import { $, fx, init } from 'signal'
import { Rect } from 'std'
import { dom, prevent } from 'utils'
import { Comp } from './comp.ts'
import { Keyboard } from './keyboard.ts'
import { Mouse } from './mouse.ts'

export class Input extends Comp {
  keyboard = $(new Keyboard(this.ctx))
  mouse = $(new Mouse(this.ctx))

  textareaRect = $(new Rect, { w: 50, h: 50 })
  textarea: HTMLTextAreaElement = dom.el('textarea', {
    oncontextmenu: prevent.stop,
    onkeydown: this.keyboard.handleKeyDown,
    onkeyup: this.keyboard.handleKeyUp,
    onblur: () => { this.ctx.isFocused = false },
    onfocus: () => { this.ctx.isFocused = true },
    spellcheck: false,
    autocorrect: 'off',
    style: {
      cssText: /*css*/`
      position: fixed;
      opacity: 0.5;
      width: 50px;
      height: 50px;
      pointer-events: none;
      border: none;
      resize: none;
      padding: 0;
      outline: none;
      white-space: pre;
      overflow: hidden;
      z-index: 999999;
      `
    }
  })

  @init append_textarea() {
    dom.body.append(this.textarea)
    // start page with focus on editor
    // arbitrary, might not be necessary/solved another way
    setTimeout(() => {
      this.textarea.focus()
    }, 50)
  }
  @fx textarea_follows_pointer() {
    const { xy } = this.ctx.world.pointer.pos
    $.untrack()
    this.textareaRect.center.set(xy)
  }
  @fx move_textarea() {
    const { x, y } = this.textareaRect.pos
    this.textarea.style.transform = `translate(${x}px,${y}px)`
  }
}
