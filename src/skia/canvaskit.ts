import CanvasKitInit, { type CanvasKit } from 'canvaskit-wasm'
import canvaskitWasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url'

let canvaskitPromise: Promise<CanvasKit> | null = null

export const loadCanvasKit = (): Promise<CanvasKit> => {
  if (!canvaskitPromise) {
    canvaskitPromise = CanvasKitInit({
      locateFile: (file) => {
        if (file.endsWith('.wasm')) {
          return canvaskitWasmUrl
        }
        return file
      }
    })
  }

  return canvaskitPromise
}
