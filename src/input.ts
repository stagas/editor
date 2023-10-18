import { $ } from 'signal'
import { Rect } from 'std'
import { dom } from 'utils'
import { Comp } from './comp.ts'
import { Keyboard } from './keyboard.ts'
import { Mouse } from './mouse.ts'

export class Input extends Comp {
  get keyboard() {
    return $(new Keyboard(this.ctx))
  }
  mouse?: Mouse

  textareaRect = $(new Rect, { w: 50, h: 50 })
  textarea: HTMLTextAreaElement = dom.el('textarea', {
    spellcheck: false,
    autocorrect: 'off',
    style: {
      cssText: /*css*/`
      position: fixed;
      opacity: 0;
      width: 50px;
      height: 50px;
      pointer-events: none;
      border: none;
      padding: 0;
      outline: none;
      white-space: pre;
      overflow: hidden;
      z-index: 999999;
      `
    }
  })
}
