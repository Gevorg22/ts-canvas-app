import * as PIXI from 'pixi.js-legacy'
import { serializeScene } from '../scene/serializeScene'

export const exportSceneToPdf = async (
  container: PIXI.Container,
  width: number,
  height: number
): Promise<void> => {
  const serializedScene = await serializeScene(container, width, height)

  const apiBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''
  const response = await fetch(`${apiBase}/api/export-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serializedScene)
  })

  if (!response.ok) {
    throw new Error('Не удалось экспортировать PDF')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'scene.pdf'
  anchor.click()
  URL.revokeObjectURL(url)
}
