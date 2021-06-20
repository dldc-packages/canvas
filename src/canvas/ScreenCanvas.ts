import { action, makeAutoObservable } from 'mobx';
import { Rect } from '../Rect';
import { convertDOMRectToRect } from '../Utils';
import { Viewport } from '../Viewport';
import { Canvas, CanvasBase } from './Canvas';

const VALID_POSITIONS = ['relative', 'absolute', 'fixed', 'sticky'];

/**
 * Take an HTML element and create a Canvas inside of the same size
 * the update function should be executed on each frame
 * We don't take a canvas elem directly because the canvas
 * must not have half pixels
 */
export class ScreenCanvas implements CanvasBase {
  private readonly internal: Canvas;
  private readonly container: HTMLElement;
  public readonly context: CanvasRenderingContext2D;

  public constructor(container: HTMLElement) {
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
    const internal = new Canvas({ rect, viewport, pixelRatio });
    this.context = internal.context;
    this.internal = internal;
    container.appendChild(this.internal.element);

    makeAutoObservable<this, 'internal' | 'container'>(this, {
      internal: false,
      container: false,
      context: false,
      update: action.bound,
    });
  }

  public update() {
    const rect = convertDOMRectToRect(this.container.getBoundingClientRect());
    const viewport = Viewport.instance.rect;
    const pixelRatio = window.devicePixelRatio;
    this.internal.update({ rect, viewport, pixelRatio });
  }

  public get rect(): Rect {
    return this.internal.rect;
  }

  public get rectRounded(): Rect {
    return this.internal.rectRounded;
  }

  public get view(): Rect {
    return this.internal.view;
  }

  public get viewVisible(): Rect | false {
    return this.internal.viewVisible;
  }

  public get viewport(): Rect | null {
    return this.internal.viewport;
  }

  public get pixelRatio(): number {
    return this.internal.pixelRatio;
  }
}
