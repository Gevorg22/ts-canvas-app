import * as PIXI from 'pixi.js-legacy'
import './styles.css'
import { buildSceneA, addRandomPrimitive } from './pixi/createScene'
import { loadCanvasKit } from './skia/canvaskit'
import { PixiToSkiaRenderer } from './skia/pixiToSkiaRenderer'
import { exportSceneToPdf } from './export/exportPdf'

const width = 420
const height = 280
const sceneBaseWidth = 760
const sceneBaseHeight = 420

const appRoot = document.querySelector<HTMLDivElement>('#app')
if (!appRoot) {
  throw new Error('Корневой элемент приложения не найден')
}

appRoot.innerHTML = `
  <div class="page-title">Пример страницы:</div>
  <div class="example-frame">
    <div class="left-controls">
      <button id="random-shape">Сгенерировать случайную линию/фигуру</button>
      <button id="export-pdf">Экспорт в PDF</button>
      <div class="status" id="status">Инициализация...</div>
    </div>

    <div class="canvas-grid">
      <div class="canvas-card">
        <div class="canvas-label"><span>Канвас1</span><span>Pixi.js</span></div>
        <div class="canvas-wrap" id="pixi-host"></div>
      </div>

      <div class="canvas-card">
        <div class="canvas-label"><span>Канвас2</span><span>Skia</span></div>
        <div class="canvas-wrap"><canvas id="skia-canvas" width="420" height="280"></canvas></div>
      </div>
    </div>
  </div>
`

const status = document.querySelector<HTMLDivElement>('#status')
const pixiHost = document.querySelector<HTMLDivElement>('#pixi-host')
const skiaCanvas = document.querySelector<HTMLCanvasElement>('#skia-canvas')
const randomButton = document.querySelector<HTMLButtonElement>('#random-shape')
const exportButton = document.querySelector<HTMLButtonElement>('#export-pdf')

if (!status || !pixiHost || !skiaCanvas || !randomButton || !exportButton) {
  throw new Error('Отсутствуют необходимые элементы интерфейса')
}

randomButton.disabled = true
exportButton.disabled = true

const pixiApp = new PIXI.Application<HTMLCanvasElement>({
  width,
  height,
  backgroundColor: 0xffffff,
  antialias: true,
  forceCanvas: true
})

pixiHost.appendChild(pixiApp.view)

let currentScene: PIXI.Container | null = null
let skiaRenderer: PixiToSkiaRenderer | null = null

const setStatus = (value: string): void => {
  status.textContent = value
}

const renderTick = (): void => {
  if (!currentScene || !skiaRenderer) {
    return
  }

  skiaRenderer.render(currentScene)
}

const bootstrap = async (): Promise<void> => {
  setStatus('Загрузка сцены...')
  currentScene = await buildSceneA()

  const fitScale = Math.min(width / sceneBaseWidth, height / sceneBaseHeight)
  currentScene.scale.set(fitScale)
  currentScene.position.set(0, 0)

  pixiApp.stage.addChild(currentScene)

  setStatus('Загрузка CanvasKit...')
  const canvasKit = await loadCanvasKit()
  skiaRenderer = new PixiToSkiaRenderer(canvasKit, skiaCanvas)
  skiaRenderer.bindPointerEvents(currentScene, skiaCanvas)

  pixiApp.ticker.add(renderTick)
  renderTick()
  randomButton.disabled = false
  exportButton.disabled = false
  setStatus('Готово')
}

void bootstrap().catch((error) => {
  console.error(error)
  setStatus('Ошибка инициализации')
})

randomButton.addEventListener('click', () => {
  if (!currentScene) {
    setStatus('Сцена еще загружается')
    return
  }

  addRandomPrimitive(currentScene, sceneBaseWidth, sceneBaseHeight)
  renderTick()
  setStatus('Добавлена случайная фигура')
})

exportButton.addEventListener('click', async () => {
  if (!currentScene) {
    setStatus('Сцена еще загружается')
    return
  }

  try {
    setStatus('Экспорт PDF...')
    await exportSceneToPdf(currentScene, width, height)
    setStatus('PDF экспортирован')
  } catch (error) {
    console.error(error)
    setStatus('Ошибка экспорта PDF')
  }
})
