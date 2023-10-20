log.active
import { $, fn } from 'signal'
import { Comp } from './comp.ts'

let lockPaste = false
export class Clipboard extends Comp {
  handleCut = this.ctx.history.historic((e: ClipboardEvent) => {
    // timeout otherwise data are removed before they have time to be copied
    setTimeout(() => {
      this.ctx.selection.deleteSelection()
    })
  })
  handlePasteHistoric = this.ctx.history.historic((e: ClipboardEvent) => {
    const { buffer, selection } = this.ctx
    const textToPaste = e.clipboardData!.getData("text")

    if (selection.hasSelection) selection.deleteSelection.sansHistory()

    const index = buffer.getIndexFromCoords(buffer.lineCol)

    // we use $.code here instead of using fn deps, because the
    // deleteSelection call above is potentially modifying it and we need the fresh one.
    buffer.code =
      buffer.code.slice(0, index)
      + textToPaste
      + buffer.code.slice(index)

    $.flush()

    buffer.getLineColFromIndex(index + textToPaste.length, buffer.lineCol)
    buffer.coli = buffer.lineCol.col

    // this fixes glitching issues while holding ctrl+v
    let t = performance.now()
    const waitIdle = () => {
      requestAnimationFrame(() => {
        const now = performance.now()
        if (now - t < 18) {
          setTimeout(() => {
            lockPaste = false
          }, 25)
        }
        else {
          t = now
          waitIdle()
        }
      })
    }
    waitIdle()
  })

  @fn handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()

    // we check for hover to ensure our intention to paste is in the editor
    if (!this.ctx.isHovering) {
      return false
    }

    // this fixes glitching while holding ctrl+v
    if (lockPaste) return
    lockPaste = true

    this.handlePasteHistoric(e)
  }
}
