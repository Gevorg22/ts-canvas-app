import * as PIXI from 'pixi.js-legacy'
import { SHAPES } from '@pixi/math'

type HitEntry = {
  displayObject: PIXI.DisplayObject
  bounds: PIXI.Rectangle
}

const toSkiaMatrix = (matrix: PIXI.Matrix): [number, number, number, number, number, number, number, number, number] => {
  return [matrix.a, matrix.c, matrix.tx, matrix.b, matrix.d, matrix.ty, 0, 0, 1]
}

const pixiColorToSkia = (hex: number, alpha: number, globalAlpha: number): [number, number, number, number] => {
  const r = ((hex >> 16) & 255) / 255
  const g = ((hex >> 8) & 255) / 255
  const b = (hex & 255) / 255
  return [r, g, b, alpha * globalAlpha]
}

const globalPointToLocal = (obj: PIXI.DisplayObject, point: PIXI.IPointData): PIXI.Point => {
  return obj.worldTransform.applyInverse(point, new PIXI.Point())
}

const isPointInsideDisplayObject = (obj: PIXI.DisplayObject, point: PIXI.IPointData): boolean => {
  if (!(obj as PIXI.DisplayObject & { visible: boolean }).visible || !(obj as PIXI.DisplayObject & { worldVisible: boolean }).worldVisible) {
    return false
  }

  if (obj instanceof PIXI.Graphics) {
    return obj.containsPoint(globalPointToLocal(obj, point))
  }

  if (obj instanceof PIXI.Sprite) {
    return obj.containsPoint(globalPointToLocal(obj, point))
  }

  return obj.getBounds().contains(point.x, point.y)
}

const drawGraphicsData = (
  CanvasKit: any,
  canvas: any,
  graphics: PIXI.Graphics,
  paint: any
): void => {
  for (const data of graphics.geometry.graphicsData) {
    canvas.save()
    if (data.matrix) {
      canvas.concat(toSkiaMatrix(data.matrix))
    }

    const shouldFill = data.fillStyle.visible
    const shouldStroke = data.lineStyle.width > 0

    switch (data.type) {
      case SHAPES.RECT: {
        const shape = data.shape as PIXI.Rectangle
        if (shouldFill) {
          paint.setStyle(CanvasKit.PaintStyle.Fill)
          paint.setColor(pixiColorToSkia(data.fillStyle.color, data.fillStyle.alpha, graphics.worldAlpha))
          canvas.drawRect(CanvasKit.XYWHRect(shape.x, shape.y, shape.width, shape.height), paint)
        }
        if (shouldStroke) {
          paint.setStyle(CanvasKit.PaintStyle.Stroke)
          paint.setStrokeWidth(data.lineStyle.width)
          paint.setColor(pixiColorToSkia(data.lineStyle.color, data.lineStyle.alpha, graphics.worldAlpha))
          canvas.drawRect(CanvasKit.XYWHRect(shape.x, shape.y, shape.width, shape.height), paint)
        }
        break
      }
      case SHAPES.RREC: {
        const shape = data.shape as PIXI.RoundedRectangle
        const rrect = CanvasKit.RRectXY(
          CanvasKit.XYWHRect(shape.x, shape.y, shape.width, shape.height),
          shape.radius,
          shape.radius
        )
        if (shouldFill) {
          paint.setStyle(CanvasKit.PaintStyle.Fill)
          paint.setColor(pixiColorToSkia(data.fillStyle.color, data.fillStyle.alpha, graphics.worldAlpha))
          canvas.drawRRect(rrect, paint)
        }
        if (shouldStroke) {
          paint.setStyle(CanvasKit.PaintStyle.Stroke)
          paint.setStrokeWidth(data.lineStyle.width)
          paint.setColor(pixiColorToSkia(data.lineStyle.color, data.lineStyle.alpha, graphics.worldAlpha))
          canvas.drawRRect(rrect, paint)
        }
        break
      }
      case SHAPES.CIRC: {
        const shape = data.shape as PIXI.Circle
        if (shouldFill) {
          paint.setStyle(CanvasKit.PaintStyle.Fill)
          paint.setColor(pixiColorToSkia(data.fillStyle.color, data.fillStyle.alpha, graphics.worldAlpha))
          canvas.drawCircle(shape.x, shape.y, shape.radius, paint)
        }
        if (shouldStroke) {
          paint.setStyle(CanvasKit.PaintStyle.Stroke)
          paint.setStrokeWidth(data.lineStyle.width)
          paint.setColor(pixiColorToSkia(data.lineStyle.color, data.lineStyle.alpha, graphics.worldAlpha))
          canvas.drawCircle(shape.x, shape.y, shape.radius, paint)
        }
        break
      }
      case SHAPES.ELIP: {
        const shape = data.shape as PIXI.Ellipse
        const oval = CanvasKit.XYWHRect(shape.x - shape.width, shape.y - shape.height, shape.width * 2, shape.height * 2)
        if (shouldFill) {
          paint.setStyle(CanvasKit.PaintStyle.Fill)
          paint.setColor(pixiColorToSkia(data.fillStyle.color, data.fillStyle.alpha, graphics.worldAlpha))
          canvas.drawOval(oval, paint)
        }
        if (shouldStroke) {
          paint.setStyle(CanvasKit.PaintStyle.Stroke)
          paint.setStrokeWidth(data.lineStyle.width)
          paint.setColor(pixiColorToSkia(data.lineStyle.color, data.lineStyle.alpha, graphics.worldAlpha))
          canvas.drawOval(oval, paint)
        }
        break
      }
      case SHAPES.POLY: {
        const shape = data.shape as PIXI.Polygon
        const builder = new CanvasKit.PathBuilder()
        for (let i = 0; i < shape.points.length; i += 2) {
          const x = shape.points[i]
          const y = shape.points[i + 1]
          if (i === 0) {
            builder.moveTo(x, y)
          } else {
            builder.lineTo(x, y)
          }
        }
        if (shape.closeStroke) {
          builder.close()
        }
        const path = builder.detachAndDelete()
        if (shouldFill) {
          paint.setStyle(CanvasKit.PaintStyle.Fill)
          paint.setColor(pixiColorToSkia(data.fillStyle.color, data.fillStyle.alpha, graphics.worldAlpha))
          canvas.drawPath(path, paint)
        }
        if (shouldStroke) {
          paint.setStyle(CanvasKit.PaintStyle.Stroke)
          paint.setStrokeWidth(data.lineStyle.width)
          paint.setColor(pixiColorToSkia(data.lineStyle.color, data.lineStyle.alpha, graphics.worldAlpha))
          canvas.drawPath(path, paint)
        }
        path.delete()
        break
      }
      default:
        break
    }

    canvas.restore()
  }
}

export class PixiToSkiaRenderer {
  private readonly surface: any
  private readonly CanvasKit: any
  private readonly canvas: any
  private readonly paint: any
  private readonly skImageCache = new WeakMap<object, any>()
  private readonly skImages = new Set<any>()
  private hitEntries: HitEntry[] = []

  constructor(CanvasKit: any, hostCanvas: HTMLCanvasElement) {
    this.CanvasKit = CanvasKit
    const surface = CanvasKit.MakeSWCanvasSurface(hostCanvas)
    if (!surface) {
      throw new Error('Не удалось создать программную поверхность Skia')
    }

    this.surface = surface
    this.canvas = this.surface.getCanvas()
    this.paint = new CanvasKit.Paint()
    this.paint.setAntiAlias(true)
  }

  public render(container: PIXI.Container): void {
    container.updateTransform()
    this.hitEntries = []
    this.canvas.clear(this.CanvasKit.Color4f(1, 1, 1, 1))
    this.renderContainer(container)
    this.surface.flush()
  }

  public bindPointerEvents(container: PIXI.Container, element: HTMLCanvasElement): void {
    const emitPointer = (type: 'pointerdown' | 'pointerup', event: PointerEvent): void => {
      const rect = element.getBoundingClientRect()
      const x = (event.clientX - rect.left) * (element.width / rect.width)
      const y = (event.clientY - rect.top) * (element.height / rect.height)

      const topHit = [...this.hitEntries].reverse().find((entry) => {
        return entry.bounds.contains(x, y) && isPointInsideDisplayObject(entry.displayObject, { x, y })
      })

      if (topHit) {
        ;(topHit.displayObject as any).emit(type, { global: new PIXI.Point(x, y), originalEvent: event })
      }
    }

    element.addEventListener('pointerdown', (event) => emitPointer('pointerdown', event))
    element.addEventListener('pointerup', (event) => emitPointer('pointerup', event))

    container.eventMode = 'static'
  }

  public destroy(): void {
    this.paint.delete()
    this.surface.dispose()
    for (const image of this.skImages) {
      image.delete()
    }
  }

  private renderContainer(container: PIXI.Container): void {
    for (const child of container.children) {
      if (!child.visible || child.worldAlpha <= 0) {
        continue
      }

      this.canvas.save()
      this.canvas.concat(toSkiaMatrix(child.worldTransform))

      if (child instanceof PIXI.Graphics) {
        drawGraphicsData(this.CanvasKit, this.canvas, child, this.paint)
        if (child.eventMode !== 'none') {
          this.hitEntries.push({ displayObject: child, bounds: child.getBounds() })
        }
      } else if (child instanceof PIXI.Sprite) {
        this.drawSprite(child)
        if (child.eventMode !== 'none') {
          this.hitEntries.push({ displayObject: child, bounds: child.getBounds() })
        }
      } else if (child instanceof PIXI.Container) {
        this.renderContainer(child)
      }

      this.canvas.restore()
    }
  }

  private drawSprite(sprite: PIXI.Sprite): void {
    const source = (sprite.texture.baseTexture.resource as any)?.source as CanvasImageSource | undefined
    if (!source) {
      return
    }

    let image = this.skImageCache.get(source as object)
    if (!image) {
      image = this.CanvasKit.MakeImageFromCanvasImageSource(source)
      this.skImageCache.set(source as object, image)
      this.skImages.add(image)
    }

    const frame = sprite.texture.frame
    const dest = this.CanvasKit.XYWHRect(
      -sprite.anchor.x * frame.width,
      -sprite.anchor.y * frame.height,
      frame.width,
      frame.height
    )

    this.paint.setAlphaf(sprite.worldAlpha)
    this.canvas.drawImageRect(
      image,
      this.CanvasKit.XYWHRect(frame.x, frame.y, frame.width, frame.height),
      dest,
      this.paint,
      true
    )
  }
}
