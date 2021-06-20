import { convertDOMRectToRect } from '../Utils';
import { Viewport } from '../Viewport';
import { Canvas } from './Canvas';

const VALID_POSITIONS = ['relative', 'absolute', 'fixed', 'sticky'];

/**
 * Take an HTML element and create a Canvas inside of the same size
 * the update function should be executed on each frame
 * We don't take a canvas elem directly because the canvas
 * must not have half pixels
 */

export class ScreenCanvas {
  public readonly container: HTMLElement;
  public readonly canvas: Canvas;

  constructor(container: HTMLElement) {
    const elemStyles = window.getComputedStyle(container);
    if (!VALID_POSITIONS.includes(elemStyles.position)) {
      throw new Error(
        `Element should have one of the following position ${VALID_POSITIONS.join(
          ', '
        )} ! It currently has ${elemStyles.position}`
      );
    }
    this.container = container;
    const rect = convertDOMRectToRect(container.getBoundingClientRect());
    const pixelRatio = window.devicePixelRatio;
    const viewport = Viewport.instance.rect;
    const canvas = new Canvas({ rect, viewport, pixelRatio });
    container.appendChild(canvas.element);
    this.canvas = canvas;
  }

  public update = () => {
    const rect = convertDOMRectToRect(this.container.getBoundingClientRect());
    const viewport = Viewport.instance.rect;
    const pixelRatio = window.devicePixelRatio;
    this.canvas.update({ rect, viewport, pixelRatio });
  };
}
