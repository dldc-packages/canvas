import { action, makeAutoObservable } from 'mobx';
import { Rect } from '../Rect';
import { Canvas, CanvasBase } from './Canvas';

interface Options {
  width: number;
  height: number;
  x?: number;
  y?: number;
  viewport?: Rect | null;
  pixelRatio?: number;
}

export class OffscreenCanvas implements CanvasBase {
  private readonly internal: Canvas;
  public readonly context: CanvasRenderingContext2D;

  public constructor({ height, width, x = 0, y = 0, pixelRatio = 0, viewport = null }: Options) {
    const internal = new Canvas({ rect: [x, y, width, height], viewport, pixelRatio });
    this.context = internal.context;
    this.internal = internal;

    makeAutoObservable<this, 'internal'>(this, {
      internal: false,
      context: false,
      update: action.bound,
    });
  }

  public update({
    pixelRatio = this.pixelRatio,
    viewport = this.viewport,
    x,
    y,
    height,
    width,
  }: Partial<Options>) {
    const [dx, dy, dwidth, dheight] = this.rect;
    this.internal.update({
      rect: [x ?? dx, y ?? dy, width ?? dwidth, height ?? dheight],
      viewport,
      pixelRatio,
    });
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
