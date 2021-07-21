import { action, autorun, computed, makeAutoObservable } from 'mobx';
import { CanvasElement } from './CanvasElement';
import { clipRect, offsetRect, Rect, rectsEqual, roundRect, scaleRect, Size } from '../Rect';

interface Internal {
  rect: Rect;
  pixelRatio: number;
  viewport: Rect | null;
  rectRounded: Rect;
  viewVisible: Rect | false;
  view: Rect;
  viewSize: Size;
}

interface Options {
  rect?: Rect;
  viewport?: Rect | null;
  pixelRatio?: number;
}

export class Canvas {
  private readonly internal: Internal;
  public readonly element: HTMLCanvasElement;
  public readonly context: CanvasRenderingContext2D;

  public constructor({ rect = [0, 0, 200, 200], viewport = null, pixelRatio = 1 }: Options = {}) {
    const internal = makeAutoObservable<Internal>(
      {
        rect,
        pixelRatio,
        viewport: viewport,
        get rectRounded(): Rect {
          return roundRect(internal.rect);
        },
        get view(): Rect {
          const [, , width, height] = internal.rectRounded;
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
          const [x, y, width, height] = internal.rectRounded;
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
   *
   * @returns did something change ?
   */
  public update({
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
