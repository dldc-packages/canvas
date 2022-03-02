import { Rect, transformRects } from './utils/Rect';
import { SubscribeMethod, Subscription } from 'suub';
import { inverseTransform, Transform } from './utils/Transform';

// Using Symbols so that parent can access thes properties
const ON_FRAME_UPDATE = Symbol.for('DRAAW_INTERNAL_ON_FRAME_UPDATE');
const ON_FRAME_POST_UPDATE = Symbol.for('DRAAW_INTERNAL_ON_FRAME_POST_UPDATE');
const ON_FRAME_RENDER = Symbol.for('DRAAW_INTERNAL_ON_FRAME_RENDER');

// Called by parent when adding a child
const ATTACH = Symbol.for('DRAAW_INTERNAL_ATTACH');

/**
 * The scheduler is composed of a tree or Schedulers
 * To trigger a render you need to specify a rect
 * Child scheduler can have a transform applied to it
 */

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
  [ATTACH]: (parent: Scheduler) => void;
}

export type RootSchedulerOptions = {
  autoStart?: boolean;
};

/**
 * The root scheduler is the one that create the render loop (requestAnimationFrame)
 * It does not have a transform
 * Most of its methods and are proxied from th rootChild scheduler
 */
export class RootScheduler implements Scheduler {
  private readonly rootChild = new ChildScheduler();

  private startTime = performance.now();
  private currentTime = this.startTime;
  private requestedFrameId: number | null = null;

  constructor({ autoStart = true }: RootSchedulerOptions = {}) {
    if (autoStart) {
      this.start();
    }
  }

  readonly requestFrameRender = this.rootChild.requestFrameRender;
  readonly addChild = this.rootChild.addChild;
  readonly removeChild = this.rootChild.removeChild;
  readonly onRender = this.rootChild.onRender;
  readonly onUpdate = this.rootChild.onUpdate;
  readonly onPostUpdate = this.rootChild.onPostUpdate;

  readonly [ON_FRAME_UPDATE] = (t: number) => {
    this.rootChild[ON_FRAME_UPDATE](t);
  };

  readonly [ON_FRAME_POST_UPDATE] = (t: number) => {
    this.rootChild[ON_FRAME_POST_UPDATE](t);
  };

  readonly [ON_FRAME_RENDER] = (t: number) => {
    return this.rootChild[ON_FRAME_RENDER](t, []);
  };

  readonly [ATTACH] = () => {
    throw new Error('Root scheduler cannot be attached to another scheduler');
  };

  readonly getTime = () => {
    return this.currentTime;
  };

  readonly start = () => {
    if (this.requestedFrameId !== null) {
      // already running
      return;
    }
    this.startTime = performance.now();
    this.loop();
  };

  readonly stop = () => {
    if (this.requestedFrameId !== null) {
      cancelAnimationFrame(this.requestedFrameId);
    }
  };

  private readonly onFrame = () => {
    const t = performance.now() - this.startTime;
    this.currentTime = t;
    this[ON_FRAME_UPDATE](t);
    this[ON_FRAME_POST_UPDATE](t);
    this[ON_FRAME_RENDER](t);
  };

  private readonly loop = () => {
    this.onFrame();
    this.requestedFrameId = requestAnimationFrame(this.loop);
  };
}

/**
 * Handle child schedulers and frames rects
 */
export class ChildScheduler implements Scheduler {
  private readonly renderSub = Subscription<RenderData>();
  private readonly updateSub = Subscription<UpdateData>();
  private readonly postUpdateSub = Subscription<UpdateData>();

  private children: ReadonlyArray<Scheduler> = [];
  private nextRenderFrames: Array<Rect> = [];
  private isRendering = false;
  private transform: Transform = [];
  private transformInverse: Transform = [];
  private parent: Scheduler | null = null;

  constructor(transform: Transform = []) {
    this.setTransform(transform);
  }

  /**
   * Update transforms
   */
  readonly setTransform = (transform: Transform) => {
    this.transform = transform;
    this.transformInverse = inverseTransform(transform);
  };

  /**
   * Request a render specifying a rect
   * If frame is null or false, it will be ignored
   */
  readonly requestFrameRender = (frame: Rect | null | false) => {
    if (this.isRendering) {
      console.warn('Request frame inside a frame ?');
    }
    if (frame === null || frame === false) {
      return;
    }
    this.nextRenderFrames.push(frame);
  };

  readonly addChild = (child: Scheduler) => {
    if (this.children.includes(child)) {
      return;
    }
    child[ATTACH](this);
    this.children = [...this.children, child];
  };

  readonly removeChild = (child: Scheduler) => {
    const childIndex = this.children.indexOf(child);
    if (childIndex === -1) {
      return;
    }
    const copy = [...this.children];
    copy.splice(childIndex, 1);
    this.children = copy;
  };

  readonly onRender = this.renderSub.subscribe;
  readonly onUpdate = this.updateSub.subscribe;
  readonly onPostUpdate = this.postUpdateSub.subscribe;

  readonly [ATTACH] = (parent: Scheduler) => {
    if (this.parent !== null) {
      throw new Error('Child scheduler already attached');
    }
    this.parent = parent;
  };

  readonly [ON_FRAME_UPDATE] = (t: number) => {
    // Upadate is always called
    const children = this.children;
    children.forEach((child) => {
      child[ON_FRAME_UPDATE](t);
    });
    this.updateSub.emit({ t });
  };

  readonly [ON_FRAME_POST_UPDATE] = (t: number) => {
    // PostUpdate is always called
    const children = this.children;
    children.forEach((child) => {
      child[ON_FRAME_POST_UPDATE](t);
    });
    this.postUpdateSub.emit({ t });
  };

  readonly [ON_FRAME_RENDER] = (t: number, parentRects: Array<Rect>): Array<Rect> => {
    this.isRendering = true;
    const localRects = this.nextRenderFrames;
    this.nextRenderFrames = [];
    const transform = this.transform;
    const children = this.children;

    // Apply transform to parent rects to get local rects
    const parentRectsTransformed = transformRects(parentRects, transform);
    // Local rects don't need to be transformed
    const parentAndLocalRects = [...parentRectsTransformed, ...localRects];

    // Render children first
    // they returns rendered rects
    const childRendered: Array<Rect> = [];
    children.forEach((child) => {
      const rendered = child[ON_FRAME_RENDER](t, parentAndLocalRects);
      childRendered.push(...rendered);
    });
    const allRects = [...parentAndLocalRects, ...childRendered];
    if (allRects.length > 0) {
      this.renderSub.emit({ t, rects: allRects });
    }
    // Rects we did render
    const localAndChildRects = [...localRects, ...childRendered];
    this.isRendering = false;
    // Apply inverse transform to local and child rects to return rect in parent space
    return transformRects(localAndChildRects, transform);
  };
}
