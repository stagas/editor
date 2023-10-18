import { $ } from 'signal'
import { dom } from 'utils'
import { Comp } from './comp.ts'
import { Keyboard } from './keyboard.ts'
import { Mouse } from './mouse.ts'

export class Input extends Comp {
  get keyboard() {
    return $(new Keyboard(this.ctx))
  }
  mouse?: Mouse
  textarea: HTMLTextAreaElement = dom.el('textarea')
}
