import { action, autorun, computed, makeAutoObservable } from 'mobx';
import { CanvasElement } from './CanvasElement';
import {
  clipRect,
  offsetRect,
  Rect,
  rectsEqual,
  roundRect,
  scaleRect,
  Size,
  sliceRectSize,
} from '../Rect';

export interface CanvasBase {
  readonly context: CanvasRenderingContext2D;
  readonly rect: Rect;
  readonly rectRounded: Rect;
  readonly view: Rect;
  readonly viewVisible: Rect | false;
  readonly viewport: Rect | null;
  readonly pixelRatio: number;
}

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
  rect: Rect;
  viewport: Rect | null;
  pixelRatio: number;
}

export class Canvas implements CanvasBase {
  private readonly internal: Internal;
  public readonly element: HTMLCanvasElement;
  public readonly context: CanvasRenderingContext2D;

  public constructor({ rect, viewport, pixelRatio }: Options) {
    const internal = makeAutoObservable<Internal>(
      {
        rect: rect,
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
          return sliceRectSize(internal.view);
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

  public update({ rect, viewport, pixelRatio }: Options) {
    if (rectsEqual(this.internal.rect, rect) === false) {
      this.internal.rect = rect;
    }
    if (rectsEqual(this.internal.viewport, viewport) === false) {
      this.internal.viewport = viewport;
    }
    if (this.internal.pixelRatio !== pixelRatio) {
      this.internal.pixelRatio = pixelRatio;
    }
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
