import { action, autorun, computed, makeAutoObservable } from 'mobx';
import { CanvasElement } from './CanvasElement';
import { clipRect, offsetRect, Rect, rectsEqual, roundRect, scaleRect, Size } from '../utils/Rect';
import { Scheduler } from '../Scheduler';
import { convertDOMRectToRect } from '../utils/Utils';
import { Viewport } from '../utils/Viewport';

interface Internal {
  // Canvas size (for example, the size of the canvas element)
  rect: Rect;
  // like rect but with integer values only (rounded)
  perfectRect: Rect;
  // How many pixels per "pixel"
  pixelRatio: number;
  // Global viewport (window.innerWidth, window.innerHeight)
  viewport: Rect | null;
  // available space inside the canvas (perfectRect * pixelRatio)
  view: Rect;
  // size of view
  viewSize: Size;
  // Part of the view that is visible (in the viewport)
  viewVisible: Rect | false;
}

interface Options {
  rect?: Rect;
  viewport?: Rect | null;
  pixelRatio?: number;
}

const VALID_POSITIONS = ['relative', 'absolute', 'fixed', 'sticky'];

/**
 * Manipulate
 */
export class Canvas {
  private readonly internal: Internal;
  private synching = false;

  public readonly element: HTMLCanvasElement;
  public readonly context: CanvasRenderingContext2D;

  public constructor({ rect = [0, 0, 200, 200], viewport = null, pixelRatio = 1 }: Options = {}) {
    const internal = makeAutoObservable<Internal>(
      {
        rect,
        get perfectRect(): Rect {
          return roundRect(internal.rect);
        },
        pixelRatio,
        viewport: viewport,
        get view(): Rect {
          const [, , width, height] = internal.perfectRect;
          return scaleRect([0, 0, width, height], internal.pixelRatio);
        },
        get viewSize(): Size {
          const [, , width, height] = internal.view;
          return [width, height];
        },
        get viewVisible(): Rect | false {
          if (internal.viewport === null) {
            return this.view;
          }
          const [x, y, width, height] = internal.perfectRect;
          const offsetViewport = offsetRect(internal.viewport, -x, -y);
          const visibleRect = clipRect([0, 0, width, height], offsetViewport) ?? false;
          if (visibleRect === false) {
            return false;
          }
          return scaleRect(visibleRect, internal.pixelRatio);
        },
      },
      {
        viewSize: computed.struct,
        viewVisible: computed.struct,
      }
    );

    const [, , styleWidth, styleHeight] = internal.rect;
    const [width, height] = internal.viewSize;
    const canvas = new CanvasElement({ styleWidth, styleHeight, width, height });

    autorun(function updateCanvasStyleSize() {
      const [, , styleWidth, styleHeight] = internal.rect;
      canvas.setStyleSize(styleWidth, styleHeight);
    });

    autorun(function updateCanvasSize() {
      const [width, height] = internal.viewSize;
      canvas.setSize(width, height);
    });

    this.element = canvas.element;
    this.context = canvas.context;
    this.internal = internal;

    makeAutoObservable<this, 'internal' | 'element'>(this, {
      internal: false,
      element: false,
      context: false,
      update: action.bound,
    });
  }

  /**
   * Update rect, viewport and pixelRatio
   * @returns true if something changed
   */
  public update(options: Options): boolean {
    if (this.synching) {
      throw new Error('Cannot update canvas while synching');
    }
    return this.updateInternal(options);
  }

  public get rect(): Rect {
    return this.internal.rect;
  }

  public get rectRounded(): Rect {
    return this.internal.perfectRect;
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

  /**
   * Synchronize the canvas with an element
   * It also add the canvas to the element
   */
  public syncWithElement(container: HTMLElement, scheduler: Scheduler) {
    if (this.synching) {
      throw new Error('Canvas is already synching');
    }
    this.synching = true;
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
    this.updateInternal({ rect, viewport, pixelRatio });
    container.appendChild(this.element);
    const unsub = scheduler.onUpdate(() => {
      const rect = convertDOMRectToRect(container.getBoundingClientRect());
      const viewport = Viewport.instance.rect;
      const pixelRatio = window.devicePixelRatio;
      const changed = this.updateInternal({ rect, viewport, pixelRatio });
      if (changed) {
        scheduler.requestFrameRender(this.view);
      }
    });

    return () => {
      unsub();
      container.removeChild(this.element);
      this.synching = true;
    };
  }

  private updateInternal({
    rect = this.rect,
    viewport = this.viewport,
    pixelRatio = this.pixelRatio,
  }: Options): boolean {
    let changed = false;
    if (rectsEqual(this.internal.rect, rect) === false) {
      this.internal.rect = rect;
      changed = true;
    }
    if (rectsEqual(this.internal.viewport, viewport) === false) {
      this.internal.viewport = viewport;
      changed = true;
    }
    if (this.internal.pixelRatio !== pixelRatio) {
      this.internal.pixelRatio = pixelRatio;
      changed = true;
    }
    return changed;
  }
}
