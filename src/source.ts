import { $, fn, fx, init } from 'signal'

export type Tokenize = (
  source: { code: string }
) => (Generator<SourceToken, void, unknown> | SourceToken[])

export interface SourceToken {
  type: any // TODO Token.Type
  text: string
  line: number
  col: number
}

export class Source {
  constructor(public tokenize: Tokenize) { }

  code?: string

  get tokens() {
    const { code, tokenize } = $.of(this)
    return [...tokenize(this as any)]
  }

  get lines() {
    const { code } = $.of(this)
    console.log('UPDATE', code)
    return code.split('\n')
  }
}
