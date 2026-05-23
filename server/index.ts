import express from 'express'
import cors from 'cors'
import { Canvas, loadImage } from 'skia-canvas'
import type { SerializedScene, SceneCommand } from '../src/types/scene'

const app = express()
const port = 3001

app.use(cors())
app.use(express.json({ limit: '20mb' }))

const applyMatrix = (ctx: any, matrix: SceneCommand['matrix']): void => {
  const [a, b, c, d, e, f] = matrix
  ctx.transform(a, b, c, d, e, f)
}

const applyFillAndStroke = (ctx: any, command: SceneCommand): void => {
  const { style, alpha } = command
  if (style.fillColor) {
    ctx.fillStyle = style.fillColor
    ctx.globalAlpha = (style.fillAlpha ?? 1) * alpha
    ctx.fill()
  }

  if (style.strokeColor && style.strokeWidth && style.strokeWidth > 0) {
    ctx.strokeStyle = style.strokeColor
    ctx.lineWidth = style.strokeWidth
    ctx.globalAlpha = (style.strokeAlpha ?? 1) * alpha
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

const renderCommand = async (ctx: any, command: SceneCommand): Promise<void> => {
  ctx.save()
  applyMatrix(ctx, command.matrix)

  switch (command.shape.kind) {
    case 'rect':
      ctx.beginPath()
      ctx.rect(command.shape.x, command.shape.y, command.shape.width, command.shape.height)
      applyFillAndStroke(ctx, command)
      break
    case 'roundedRect':
      ctx.beginPath()
      ctx.roundRect(command.shape.x, command.shape.y, command.shape.width, command.shape.height, command.shape.radius)
      applyFillAndStroke(ctx, command)
      break
    case 'circle':
      ctx.beginPath()
      ctx.arc(command.shape.x, command.shape.y, command.shape.radius, 0, Math.PI * 2)
      applyFillAndStroke(ctx, command)
      break
    case 'ellipse':
      ctx.beginPath()
      ctx.ellipse(command.shape.x, command.shape.y, command.shape.radiusX, command.shape.radiusY, 0, 0, Math.PI * 2)
      applyFillAndStroke(ctx, command)
      break
    case 'poly':
      if (command.shape.points.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(command.shape.points[0], command.shape.points[1])
        for (let i = 2; i < command.shape.points.length; i += 2) {
          ctx.lineTo(command.shape.points[i], command.shape.points[i + 1])
        }
        if (command.shape.closePath) {
          ctx.closePath()
        }
        applyFillAndStroke(ctx, command)
      }
      break
    case 'sprite': {
      if (command.shape.image) {
        const image = await loadImage(command.shape.image)
        ctx.globalAlpha = command.alpha
        ctx.drawImage(
          image as any,
          command.shape.srcX,
          command.shape.srcY,
          command.shape.srcWidth,
          command.shape.srcHeight,
          command.shape.x,
          command.shape.y,
          command.shape.width,
          command.shape.height
        )
        ctx.globalAlpha = 1
      }
      break
    }
    default:
      break
  }

  ctx.restore()
}

app.post('/api/export-pdf', async (req, res) => {
  const payload = req.body as SerializedScene

  if (!payload || !Array.isArray(payload.commands)) {
    res.status(400).json({ error: 'Некорректные данные запроса' })
    return
  }

  try {
    const canvas = new Canvas(payload.width, payload.height)
    const ctx = canvas.getContext('2d') as any

    for (const command of payload.commands) {
      await renderCommand(ctx, command)
    }

    const pdfBuffer = await canvas.toBuffer('pdf')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="scene.pdf"')
    res.send(pdfBuffer)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Не удалось сформировать PDF' })
  }
})

app.listen(port, () => {
  console.log(`PDF-сервер запущен: http://localhost:${port}`)
})
