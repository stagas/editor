import { $, fn, fx, init } from 'signal'

export interface SourceToken {
  type: any // TODO Token.Type
  text: string
  line: number
  col: number
}

export class Source {
  constructor(
    public tokenize: (
      source: { code: string }
    ) => (Generator<SourceToken, void, unknown> | SourceToken[])) { }

  code?: string

  get tokens() {
    const { code, tokenize } = $.of(this)
    return [...tokenize(this as any)]
  }

  get lines() {
    const { code } = $.of(this)
    return code.split('\n')
  }
}
