import * as PIXI from 'pixi.js-legacy'

const colorPalette = [0xff4d4f, 0x1677ff, 0x13c2c2, 0xfaad14, 0x722ed1, 0x52c41a, 0xeb2f96]

const randomColor = (): number => {
  return colorPalette[Math.floor(Math.random() * colorPalette.length)]
}

const makeBaseSprite = async (): Promise<PIXI.Texture> => {
  const canvas = document.createElement('canvas')
  canvas.width = 100
  canvas.height = 100
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Не удалось создать источник спрайта')
  }

  const gradient = ctx.createLinearGradient(0, 0, 100, 100)
  gradient.addColorStop(0, '#ff8a00')
  gradient.addColorStop(1, '#e52e71')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 100, 100)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(10, 85)
  ctx.lineTo(50, 20)
  ctx.lineTo(90, 85)
  ctx.stroke()

  return PIXI.Texture.from(canvas)
}

export const buildSceneA = async (): Promise<PIXI.Container> => {
  const mainContainer = new PIXI.Container()
  const subContainer = new PIXI.Container()

  const g1 = new PIXI.Graphics()
  const g2 = new PIXI.Graphics()
  const g3 = new PIXI.Graphics()
  const g4 = new PIXI.Graphics()

  g1.beginFill('#ff0000').drawEllipse(0, 0, 200, 100).endFill()
  g1.position.set(200, 100)
  g1.angle = 30
  g1.eventMode = 'static'
  g1.on('pointerdown', () => {
    console.log('g1: нажатие')
  })

  g2.beginFill('#0000ff').drawRect(-50, -75, 100, 150).endFill()
  g2.position.set(120, 60)
  g2.angle = 15
  g2.scale.set(1.5, 1.7)
  g2.eventMode = 'static'
  g2.on('pointerup', () => {
    console.log('g2: отпускание')
  })

  g3.lineStyle(10, '#ffffff', 1).moveTo(0, 0).lineTo(150, 100)
  g3.angle = -20
  g3.eventMode = 'static'

  g4.lineStyle(10, '#ffff00', 1).moveTo(0, 70).lineTo(150, -30)
  g4.angle = 20
  g4.eventMode = 'static'

  subContainer.position.set(75, 50)
  subContainer.addChild(g3, g4)

  const sprite = new PIXI.Sprite(await makeBaseSprite())
  sprite.position.set(470, 180)
  sprite.scale.set(1.2)
  sprite.rotation = Math.PI / 12
  sprite.anchor.set(0.5)
  sprite.eventMode = 'static'
  sprite.on('pointerdown', () => {
    console.log('sprite: нажатие')
  })

  mainContainer.addChild(subContainer, g1, g2, sprite)
  return mainContainer
}

export const buildSceneB = async (): Promise<PIXI.Container> => {
  const container = new PIXI.Container()

  for (let i = 0; i < 5; i += 1) {
    const rect = new PIXI.Graphics()
    rect.beginFill(randomColor()).drawRoundedRect(-35, -35, 70, 70, 14).endFill()
    rect.position.set(100 + i * 110, 80 + ((i % 2) * 90))
    rect.angle = i * 10
    rect.eventMode = 'static'
    rect.on('pointerdown', () => {
      console.log(`Сцена B: прямоугольник ${i}, нажатие`)
    })
    container.addChild(rect)
  }

  const line = new PIXI.Graphics()
  line.lineStyle(8, '#1f2937', 1).moveTo(70, 260).lineTo(620, 300)
  line.eventMode = 'static'
  line.on('pointerup', () => {
    console.log('Сцена B: линия, отпускание')
  })
  container.addChild(line)

  return container
}

export const addRandomPrimitive = (
  container: PIXI.Container,
  boundsWidth = 760,
  boundsHeight = 420
): void => {
  const kind = Math.random() > 0.5 ? 'shape' : 'line'
  const g = new PIXI.Graphics()

  if (kind === 'shape') {
    const w = 40 + Math.random() * 120
    const h = 30 + Math.random() * 100
    g.beginFill(randomColor(), 0.85).drawRect(-w / 2, -h / 2, w, h).endFill()
  } else {
    g.lineStyle(4 + Math.random() * 10, randomColor(), 1)
      .moveTo(0, 0)
      .lineTo(50 + Math.random() * 160, -30 + Math.random() * 120)
  }

  const margin = 30
  g.position.set(
    margin + Math.random() * Math.max(1, boundsWidth - margin * 2),
    margin + Math.random() * Math.max(1, boundsHeight - margin * 2)
  )
  g.rotation = Math.random() * Math.PI * 2
  g.eventMode = 'static'
  g.on('pointerdown', () => {
    console.log('Случайная фигура: нажатие')
  })

  container.addChild(g)
}
