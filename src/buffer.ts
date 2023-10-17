import { $, fn, fx, init } from 'signal'
import { Source } from './source'

export class Buffer {
  constructor(public Token: any) { }
  source?: Source
  get tokens() {
    return $.of($.of(this).source).tokens
  }
}
