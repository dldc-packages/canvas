import { Rect } from './Rect';
import { SubscribeMethod, Subscription } from 'suub';

const ON_UPDATE = Symbol.for('DRAAW_INTERNAL_ON_UPDATE');
const ON_POST_UPDATE = Symbol.for('DRAAW_INTERNAL_ON_POST_UPDATE');
const ON_RENDER = Symbol.for('DRAAW_INTERNAL_ON_RENDER');

export interface RenderData {
  t: number;
  rects: Array<Rect>;
}

export interface UpdateData {
  t: number;
}

export interface Scheduler {
  requestFrameRender(rect: Rect): void;
  onUpdate: SubscribeMethod<UpdateData>;
  onPostUpdate: SubscribeMethod<UpdateData>;
  onRender: SubscribeMethod<RenderData>;
  addChild(child: Scheduler): void;
  removeChild(child: Scheduler): void;
  [ON_UPDATE]: (t: number) => void;
  [ON_POST_UPDATE]: (t: number) => void;
  [ON_RENDER]: (t: number) => void;
}

export class RootScheduler implements Scheduler {
  private rootChild = new ChildScheduler();
  private startTime = performance.now();
  private currentTime = this.startTime;
  private requestedFrameId: number | null = null;

  constructor() {
    this.start();
  }

  requestFrameRender = this.rootChild.requestFrameRender;
  addChild = this.rootChild.addChild;
  removeChild = this.rootChild.removeChild;
  onRender = this.rootChild.onRender;
  onUpdate = this.rootChild.onUpdate;
  onPostUpdate = this.rootChild.onPostUpdate;

  getTime = () => {
    return this.currentTime;
  };

  start = () => {
    this.startTime = performance.now();
    this.loop();
  };

  stop = () => {
    if (this.requestedFrameId !== null) {
      cancelAnimationFrame(this.requestedFrameId);
    }
  };

  private loop = () => {
    const t = performance.now() - this.startTime;
    this.currentTime = t;
    this[ON_UPDATE](t);
    this[ON_POST_UPDATE](t);
    this[ON_RENDER](t);
    this.requestedFrameId = requestAnimationFrame(this.loop);
  };

  [ON_UPDATE] = (t: number) => {
    this.rootChild[ON_UPDATE](t);
  };

  [ON_POST_UPDATE] = (t: number) => {
    this.rootChild[ON_POST_UPDATE](t);
  };

  [ON_RENDER] = (t: number) => {
    this.rootChild[ON_RENDER](t);
  };
}

type TransformRects = (rects: Array<Rect>) => Array<Rect>;

const DEFAULT_RECT_TRANSFORM: TransformRects = (rects) => rects;

export class ChildScheduler implements Scheduler {
  private children: Array<Scheduler> = [];
  private nextRenderFrames: Array<Rect> = [];
  private isRendering = false;
  private renderSub = Subscription<RenderData>();
  private updateSub = Subscription<UpdateData>();
  private postUpdateSub = Subscription<UpdateData>();

  constructor(private readonly transformRects: TransformRects = DEFAULT_RECT_TRANSFORM) {}

  requestFrameRender = (frame: Rect) => {
    if (this.isRendering) {
      console.warn('Request frame inside a frame ?');
    }
    this.nextRenderFrames.push(frame);
  };

  addChild = (child: Scheduler) => {
    if (this.children.includes(child)) {
      return;
    }
    this.children.push(child);
  };

  removeChild = (child: Scheduler) => {
    const childIndex = this.children.indexOf(child);
    if (childIndex === -1) {
      return;
    }
    this.children.splice(childIndex, 1);
  };

  onRender = this.renderSub.subscribe;
  onUpdate = this.updateSub.subscribe;
  onPostUpdate = this.postUpdateSub.subscribe;

  [ON_UPDATE] = (t: number) => {
    const prevChildren = [...this.children];
    prevChildren.forEach((child) => {
      child[ON_UPDATE](t);
    });
    this.updateSub.emit({ t });
  };

  [ON_POST_UPDATE] = (t: number) => {
    const prevChildren = [...this.children];
    prevChildren.forEach((child) => {
      child[ON_POST_UPDATE](t);
    });
    this.postUpdateSub.emit({ t });
  };

  [ON_RENDER] = (t: number) => {
    const prevChildren = [...this.children];
    prevChildren.forEach((child) => {
      child[ON_RENDER](t);
    });
    this.isRendering = true;
    const rects = this.nextRenderFrames;
    this.nextRenderFrames = [];
    const transformed = this.transformRects(rects);
    if (transformed.length > 0) {
      this.renderSub.emit({ t, rects: transformed });
    }
    this.isRendering = false;
  };
}
