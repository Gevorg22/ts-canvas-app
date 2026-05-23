# Pixi + Skia + PDF (TypeScript test task)

Небольшое демонстрационное приложение на TypeScript, которое показывает, как рендерить сцену `PIXI.Container` одновременно в Pixi и Skia, поддерживать интерактивность на обоих канвасах и экспортировать ту же сцену в векторный PDF через Skia backend.

## Что реализовано

- TypeScript-приложение с двумя канвасами:
  - `PIXI.Application` (legacy + `forceCanvas: true`)
  - Skia (CanvasKit WASM) с собственной оберткой рендера `PIXI.Container`
- Поддержка рендера для:
  - `PIXI.Graphics` (включая `moveTo`, `lineTo`, `drawRect`, `drawEllipse`, `drawRoundedRect`)
  - `PIXI.Sprite`
- Учет трансформаций:
  - `translate`
  - `rotate`
  - `scale`
  - вложенные контейнеры
- Интерактивность:
  - события `pointerdown` / `pointerup` работают на Pixi canvas
  - те же события пробрасываются и на Skia canvas через hit-test
- UI:
  - переключение сцен (A/B)
  - добавление случайной фигуры/линии
  - экспорт текущей сцены в PDF
- Экспорт PDF:
  - сцена сериализуется в векторные команды
  - backend рендерит команды через Skia (`skia-canvas`) и отдает PDF

## Используемые технологии

- `pixi.js-legacy@7.2.4`
- `canvaskit-wasm`
- `express`
- `skia-canvas`
- `vite`
- `typescript`

## Структура проекта

- `./src/main.ts` — инициализация UI, Pixi, Skia, кнопок
- `./src/skia/pixiToSkiaRenderer.ts` — обертка Pixi → Skia
- `./src/scene/serializeScene.ts` — сериализация сцены для PDF
- `./src/export/exportPdf.ts` — вызов backend для скачивания PDF
- `./src/pixi/createScene.ts` — тестовые сцены и случайные примитивы
- `./server/index.ts` — сервер экспорта PDF через Skia backend

## Запуск

1. Установить зависимости:
   - `npm install`
2. Запустить frontend + backend:
   - `npm run dev`
3. Открыть приложение:
   - `http://localhost:5173`
4. Нажать кнопку **Экспорт в PDF** для сохранения файла `scene.pdf`.

## Проверка качества

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Примечание по версии Pixi

В npm нет пакета `pixi.js@7.2.4-legacy`, поэтому используется эквивалентный legacy-пакет:

- `pixi.js-legacy@7.2.4`
