import * as PIXI from 'pixi.js-legacy'
import type { GraphicsData } from '@pixi/graphics'
import { SHAPES } from '@pixi/math'
import type { SceneCommand, SceneStyle, SerializedScene } from '../types/scene'

const toHex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`

const matrixToTuple = (matrix: PIXI.Matrix): [number, number, number, number, number, number] => {
  return [matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty]
}

const styleFromGraphicsData = (item: GraphicsData): SceneStyle => {
  return {
    fillColor: item.fillStyle.visible ? toHex(item.fillStyle.color) : undefined,
    fillAlpha: item.fillStyle.visible ? item.fillStyle.alpha : undefined,
    strokeColor: item.lineStyle.width > 0 ? toHex(item.lineStyle.color) : undefined,
    strokeAlpha: item.lineStyle.width > 0 ? item.lineStyle.alpha : undefined,
    strokeWidth: item.lineStyle.width > 0 ? item.lineStyle.width : undefined
  }
}

const extractGraphicsCommands = (graphics: PIXI.Graphics): SceneCommand[] => {
  const commands: SceneCommand[] = []
  const baseMatrix = graphics.worldTransform.clone()

  for (const data of graphics.geometry.graphicsData) {
    const matrix = baseMatrix.clone()
    if (data.matrix) {
      matrix.append(data.matrix)
    }

    const common = {
      matrix: matrixToTuple(matrix),
      alpha: graphics.worldAlpha,
      style: styleFromGraphicsData(data)
    }

    switch (data.type) {
      case SHAPES.RECT:
        commands.push({
          ...common,
          shape: { kind: 'rect', x: (data.shape as PIXI.Rectangle).x, y: (data.shape as PIXI.Rectangle).y, width: (data.shape as PIXI.Rectangle).width, height: (data.shape as PIXI.Rectangle).height }
        })
        break
      case SHAPES.RREC:
        commands.push({
          ...common,
          shape: {
            kind: 'roundedRect',
            x: (data.shape as PIXI.RoundedRectangle).x,
            y: (data.shape as PIXI.RoundedRectangle).y,
            width: (data.shape as PIXI.RoundedRectangle).width,
            height: (data.shape as PIXI.RoundedRectangle).height,
            radius: (data.shape as PIXI.RoundedRectangle).radius
          }
        })
        break
      case SHAPES.CIRC:
        commands.push({
          ...common,
          shape: {
            kind: 'circle',
            x: (data.shape as PIXI.Circle).x,
            y: (data.shape as PIXI.Circle).y,
            radius: (data.shape as PIXI.Circle).radius
          }
        })
        break
      case SHAPES.ELIP:
        commands.push({
          ...common,
          shape: {
            kind: 'ellipse',
            x: (data.shape as PIXI.Ellipse).x,
            y: (data.shape as PIXI.Ellipse).y,
            radiusX: (data.shape as PIXI.Ellipse).width,
            radiusY: (data.shape as PIXI.Ellipse).height
          }
        })
        break
      case SHAPES.POLY: {
        const poly = data.shape as PIXI.Polygon
        commands.push({
          ...common,
          shape: {
            kind: 'poly',
            points: [...poly.points],
            closePath: poly.closeStroke
          }
        })
        break
      }
      default:
        break
    }
  }

  return commands
}

const extractSpriteCommand = async (sprite: PIXI.Sprite): Promise<SceneCommand | null> => {
  const source = (sprite.texture.baseTexture.resource as any)?.source as CanvasImageSource | undefined

  if (!source) {
    return null
  }

  const canvas = document.createElement('canvas')
  const frame = sprite.texture.frame
  canvas.width = frame.width
  canvas.height = frame.height
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height)

  const [a, b, c, d, tx, ty] = matrixToTuple(sprite.worldTransform)
  const x = -sprite.anchor.x * frame.width
  const y = -sprite.anchor.y * frame.height

  return {
    matrix: [a, b, c, d, tx, ty],
    alpha: sprite.worldAlpha,
    style: {},
    shape: {
      kind: 'sprite',
      x,
      y,
      width: frame.width,
      height: frame.height,
      srcX: 0,
      srcY: 0,
      srcWidth: frame.width,
      srcHeight: frame.height,
      image: canvas.toDataURL('image/png')
    }
  }
}

export const serializeScene = async (
  container: PIXI.Container,
  width: number,
  height: number
): Promise<SerializedScene> => {
  const commands: SceneCommand[] = []

  for (const child of container.children) {
    child.updateTransform()

    if (child instanceof PIXI.Graphics) {
      commands.push(...extractGraphicsCommands(child))
    }

    if (child instanceof PIXI.Sprite) {
      const command = await extractSpriteCommand(child)
      if (command) {
        commands.push(command)
      }
    }

    if (child instanceof PIXI.Container && !(child instanceof PIXI.Graphics)) {
      const nested = await serializeScene(child, width, height)
      commands.push(...nested.commands)
    }
  }

  return { width, height, commands }
}
