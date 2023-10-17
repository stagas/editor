import { $, alias, fn, fx, init } from 'signal'
import { Point } from 'std'
import { Context } from './context.ts'
import { Key, Keyboard } from './keyboard.ts'
import { Mouse } from './mouse.ts'
import { dom } from 'utils'

export class Input {
  constructor(public ctx: Context) { }
  get keyboard() {
    return $(new Keyboard(this.ctx))
  }
  mouse?: Mouse
  textarea: HTMLTextAreaElement = dom.el('textarea')
}
