import { $, fn, fx } from 'signal'
import { Line, Point } from 'std'
import { debounce, deepMerge } from 'utils'
import { Comp } from './comp.ts'

export interface Snapshot {
  code: string
  coli: number
  lineCol: Point['json']
  scroll: Point['json']
  selection: Line['json']
}

export interface EditorViewState {
  coli: number
  lineCol: Point
  scroll: Point
  historyIndex: number
  history: Snapshot[]
}

export class History extends Comp {
  viewState: EditorViewState = {
    coli: 0,
    lineCol: $(new Point),
    scroll: $(new Point),
    historyIndex: 0,
    history: []
  }
  prevViewState?: EditorViewState

  @fn saveHistoryMeta() {
    const { ctx, viewState: vs } = this
    const { buffer, dims, selection } = $.of(ctx)
    const { coli, lineCol } = $.of(buffer)
    const { scroll } = $.of(dims)

    const snapshot: Partial<Snapshot> = {
      coli,
      lineCol: lineCol.json,
      scroll: scroll.json,
      selection: selection.selection.json,
    }
    const current = vs.history[vs.historyIndex]
    if (buffer.code === current?.code) {
      deepMerge(current, snapshot)
      return
    }
    return snapshot
  }

  @fn saveHistory() {
    const { ctx, viewState: vs } = this
    const { buffer } = $.of(ctx)
    const { code } = $.of(buffer)

    const snapshot = this.saveHistoryMeta()
    if (!snapshot) return
    snapshot.code = code
    if (vs.historyIndex < vs.history.length - 1) {
      vs.history = vs.history.slice(0, vs.historyIndex + 1)
    }
    vs.historyIndex = vs.history.push(snapshot as Snapshot) - 1
  }

  saveHistoryDebounced = debounce(300, () => this.saveHistory(), { first: true, last: true })

  historic<T extends (...args: any[]) => any>(fn: T): T & { sansHistory: T } {
    return Object.assign(function (this: any, ...args: any[]) {
      try {
        this.saveHistory()
        return fn.apply(this, args)
      }
      catch (error) {
        console.error(fn.toString())
        throw error
      }
      finally {
        this.saveHistory()
      }
    } as T, {
      sansHistory: fn
    })
  }

  @fn applySnap(snap: Snapshot) {
    const { ctx, viewState: vs } = this
    const { buffer, scroll, selection } = $.of(ctx)

    const copy = JSON.parse(JSON.stringify(snap)) as any
    buffer.code = snap.code
    // KEEP: wait for code effects (split lines etc.)
    //  before applying rest of snap
    $.flush()
    buffer.coli = copy.coli
    buffer.lineCol.set(copy.lineCol)
    scroll.targetScroll.set(copy.scroll)
    selection.selection.set(copy.selection)
  }

  undo = this.historic(() => {
    const vs = this.viewState
    if (vs.historyIndex > 0) {
      const snap = vs.history[--vs.historyIndex]
      log.pretty('undo', snap)
      this.applySnap(snap)
    }
  })

  redo = this.historic(() => {
    const vs = this.viewState
    if (vs.historyIndex < vs.history.length - 1) {
      const snap = vs.history[++vs.historyIndex]
      log.pretty('redo', snap)
      this.applySnap(snap)
    }
  })

  @fx update_prevViewState() {
    const { viewState } = this
    $._()
    return () => {
      this.prevViewState = viewState
    }
  }
}
