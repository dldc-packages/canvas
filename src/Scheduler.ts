import { Rect, transformRects } from './Rect';
import { SubscribeMethod, Subscription } from 'suub';
import { inverseTransform, Transform } from './Transform';

const ON_FRAME_UPDATE = Symbol.for('DRAAW_INTERNAL_ON_FRAME_UPDATE');
const ON_FRAME_POST_UPDATE = Symbol.for('DRAAW_INTERNAL_ON_FRAME_POST_UPDATE');
const ON_FRAME_RENDER = Symbol.for('DRAAW_INTERNAL_ON_FRAME_RENDER');

export interface RenderData {
  t: number;
  rects: Array<Rect>;
}

export interface UpdateData {
  t: number;
}

export interface Scheduler {
  requestFrameRender(rect: Rect | null | false): void;
  onUpdate: SubscribeMethod<UpdateData>;
  onPostUpdate: SubscribeMethod<UpdateData>;
  onRender: SubscribeMethod<RenderData>;
  addChild(child: Scheduler): void;
  removeChild(child: Scheduler): void;
  [ON_FRAME_UPDATE]: (t: number) => void;
  [ON_FRAME_POST_UPDATE]: (t: number) => void;
  [ON_FRAME_RENDER]: (t: number, parentRects: Array<Rect>) => Array<Rect>;
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
    this[ON_FRAME_UPDATE](t);
    this[ON_FRAME_POST_UPDATE](t);
    this[ON_FRAME_RENDER](t);
    this.requestedFrameId = requestAnimationFrame(this.loop);
  };

  [ON_FRAME_UPDATE] = (t: number) => {
    this.rootChild[ON_FRAME_UPDATE](t);
  };

  [ON_FRAME_POST_UPDATE] = (t: number) => {
    this.rootChild[ON_FRAME_POST_UPDATE](t);
  };

  [ON_FRAME_RENDER] = (t: number) => {
    return this.rootChild[ON_FRAME_RENDER](t, []);
  };
}

export class ChildScheduler implements Scheduler {
  private children: ReadonlyArray<Scheduler> = [];
  private nextRenderFrames: Array<Rect> = [];
  private isRendering = false;
  private renderSub = Subscription<RenderData>();
  private updateSub = Subscription<UpdateData>();
  private postUpdateSub = Subscription<UpdateData>();
  private transform: Transform = [];
  private transformInverse: Transform = [];

  constructor(transform: Transform = []) {
    this.setTransform(transform);
  }

  setTransform = (transform: Transform) => {
    this.transform = transform;
    this.transformInverse = inverseTransform(transform);
  };

  requestFrameRender = (frame: Rect | null | false) => {
    if (this.isRendering) {
      console.warn('Request frame inside a frame ?');
    }
    if (frame === null || frame === false) {
      return;
    }
    this.nextRenderFrames.push(frame);
  };

  addChild = (child: Scheduler) => {
    if (this.children.includes(child)) {
      return;
    }
    this.children = [...this.children, child];
  };

  removeChild = (child: Scheduler) => {
    const childIndex = this.children.indexOf(child);
    if (childIndex === -1) {
      return;
    }
    const copy = [...this.children];
    copy.splice(childIndex, 1);
    this.children = copy;
  };

  onRender = this.renderSub.subscribe;
  onUpdate = this.updateSub.subscribe;
  onPostUpdate = this.postUpdateSub.subscribe;

  [ON_FRAME_UPDATE] = (t: number) => {
    const children = this.children;
    children.forEach((child) => {
      child[ON_FRAME_UPDATE](t);
    });
    this.updateSub.emit({ t });
  };

  [ON_FRAME_POST_UPDATE] = (t: number) => {
    const children = this.children;
    children.forEach((child) => {
      child[ON_FRAME_POST_UPDATE](t);
    });
    this.postUpdateSub.emit({ t });
  };

  [ON_FRAME_RENDER] = (t: number, parentRects: Array<Rect>): Array<Rect> => {
    this.isRendering = true;
    const selfRects = this.nextRenderFrames;
    this.nextRenderFrames = [];
    const transform = this.transform;
    const transformInverse = this.transformInverse;
    const children = this.children;

    const parentRectsTransformed = transformRects(parentRects, transform);
    const parentAndSelfRects = [...parentRectsTransformed, ...selfRects];

    const childRendered: Array<Rect> = [];
    children.forEach((child) => {
      const rendered = child[ON_FRAME_RENDER](t, parentAndSelfRects);
      childRendered.push(...rendered);
    });
    const allRects = [...parentAndSelfRects, ...childRendered];
    if (allRects.length > 0) {
      this.renderSub.emit({ t, rects: allRects });
    }
    const selfAndChildRects = [...selfRects, ...childRendered];
    this.isRendering = false;
    return transformRects(selfAndChildRects, transformInverse);
  };
}
