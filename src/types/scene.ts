export type Matrix2D = [number, number, number, number, number, number]

export interface SceneStyle {
  fillColor?: string
  fillAlpha?: number
  strokeColor?: string
  strokeAlpha?: number
  strokeWidth?: number
}

export type SceneShape =
  | { kind: 'rect'; x: number; y: number; width: number; height: number }
  | { kind: 'roundedRect'; x: number; y: number; width: number; height: number; radius: number }
  | { kind: 'circle'; x: number; y: number; radius: number }
  | { kind: 'ellipse'; x: number; y: number; radiusX: number; radiusY: number }
  | { kind: 'poly'; points: number[]; closePath: boolean }
  | { kind: 'sprite'; x: number; y: number; width: number; height: number; srcX: number; srcY: number; srcWidth: number; srcHeight: number; image?: string }

export interface SceneCommand {
  matrix: Matrix2D
  alpha: number
  style: SceneStyle
  shape: SceneShape
}

export interface SerializedScene {
  width: number
  height: number
  commands: SceneCommand[]
}
