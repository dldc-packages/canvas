import { RootScheduler } from '../Scheduler';
import { convertDOMRectToRect } from '../Utils';
import { Viewport } from '../Viewport';
import { Canvas } from './Canvas';

export const CanvasUtils = {
  syncWithScreen,
  syncWith,
};

const VALID_POSITIONS = ['relative', 'absolute', 'fixed', 'sticky'];

export function syncWithScreen(canvas: Canvas, container: HTMLElement, scheduler: RootScheduler) {
  const elemStyles = window.getComputedStyle(container);
  if (!VALID_POSITIONS.includes(elemStyles.position)) {
    throw new Error(
      `Element should have one of the following position ${VALID_POSITIONS.join(
        ', '
      )} ! It currently has ${elemStyles.position}`
    );
  }
  const rect = convertDOMRectToRect(container.getBoundingClientRect());
  const viewport = Viewport.instance.rect;
  const pixelRatio = window.devicePixelRatio;
  canvas.update({ rect, viewport, pixelRatio });
  container.appendChild(canvas.element);
  const unsub = scheduler.onUpdate(() => {
    const rect = convertDOMRectToRect(container.getBoundingClientRect());
    const viewport = Viewport.instance.rect;
    const pixelRatio = window.devicePixelRatio;
    const changed = canvas.update({ rect, viewport, pixelRatio });
    if (changed) {
      scheduler.requestFrameRender(canvas.view);
    }
  });

  function destroy() {
    unsub();
    container.removeChild(canvas.element);
  }

  return destroy;
}

export function syncWith(source: Canvas, target: Canvas, scheduler: RootScheduler) {
  target.update({ rect: source.rect, viewport: source.viewport, pixelRatio: source.pixelRatio });
  const unsub = scheduler.onUpdate(() => {
    const changed = target.update({
      rect: source.rect,
      viewport: source.viewport,
      pixelRatio: source.pixelRatio,
    });
    if (changed) {
      scheduler.requestFrameRender(source.view);
    }
  });

  return unsub;
}
