import { makeAutoObservable, runInAction } from 'mobx';
import { Rect, rectsEqual, clipRect, scaleRect, offsetRect, roundRect } from '../Rect';
import { Scheduler } from '../Scheduler';
import { convertDOMRectToRect } from '../Utils';
import { Viewport } from '../observables/Viewport';

export class CanvasView {
  public canvasEl: HTMLCanvasElement;
  private _rect: Rect;

  private _devicePixelRatio!: number;
  // Keep a copy of viewport size to update only one render
  private _viewport!: Rect;

  public get relativeRect(): Rect {
    return this._rect;
  }

  public get relativeRectScaled(): Rect {
    return roundRect(scaleRect(this.relativeRect, this._devicePixelRatio));
  }

  public get absoluteVisibleRect(): Rect | false {
    return clipRect(this._rect, this._viewport) ?? false;
  }

  public get absoluteVisibleRectScaled(): Rect | false {
    const visible = this.absoluteVisibleRect;
    if (visible === false) {
      return false;
    }
    return roundRect(scaleRect(visible, this._devicePixelRatio));
  }

  public get relativeVisibleRect(): Rect | false {
    const visible = this.absoluteVisibleRect;
    if (visible === false) {
      return false;
    }
    const [x, y] = this.relativeRect;
    return offsetRect(visible, -x, -y);
  }

  public get relativeVisibleRectScaled(): Rect | false {
    const relative = this.relativeVisibleRect;
    if (relative === false) {
      return false;
    }
    return scaleRect(relative, this._devicePixelRatio);
  }

  public get devicePixelRatio() {
    return this._devicePixelRatio;
  }

  constructor(public readonly parentEl: HTMLElement, private readonly scheduler: Scheduler) {
    this.canvasEl = document.createElement('canvas');
    this.parentEl.appendChild(this.canvasEl);
    this._rect = convertDOMRectToRect(this.canvasEl.getBoundingClientRect());

    this._devicePixelRatio = window.devicePixelRatio;
    runInAction(() => {
      this._viewport = Viewport.instance.rect;
    });
    makeAutoObservable<this, 'scheduler'>(this, {
      parentEl: false,
      canvasEl: false,
      scheduler: false,
    });

    scheduler.onUpdate(() => {
      this.update();
    });
  }

  private update() {
    const nextRect = convertDOMRectToRect(this.canvasEl.getBoundingClientRect());
    if (rectsEqual(this._rect, nextRect) === false) {
      this._rect = nextRect;
    }
    const nextViewport = Viewport.instance.rect;
    if (rectsEqual(this._viewport, nextViewport) === false) {
      this._viewport = nextViewport;
    }
    this._devicePixelRatio = window.devicePixelRatio;
    this.updateCanvasSize();
  }

  private updateCanvasSize() {
    const relativeRect = this.relativeRectScaled;
    const [, , width, height] = relativeRect;
    const nextWidth = Math.floor(width);
    const nextHeight = Math.floor(height);
    let hasClear = false;
    if (this.canvasEl.width !== nextWidth) {
      this.canvasEl.width = nextWidth;
      hasClear = true;
    }
    if (this.canvasEl.height !== nextHeight) {
      this.canvasEl.height = nextHeight;
      hasClear = true;
    }
    if (hasClear) {
      this.scheduler.requestFrameRender(relativeRect);
    }
  }
}
