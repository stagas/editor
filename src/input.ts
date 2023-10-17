import { $, alias, fn, fx, init } from 'signal'
import { Point } from 'std'
import { Context } from './context.ts'
import { Keyboard } from './keyboard.ts'
import { Mouse } from './mouse.ts'
import { dom } from 'utils'

export class Input {
  keyboard?: Keyboard
  mouse?: Mouse
  textarea: HTMLTextAreaElement = dom.el('textarea')
}
