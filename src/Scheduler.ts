import { Rect, transformRects } from './utils/Rect';
import { SubscribeMethod, Subscription } from 'suub';
import { ITransform } from './utils/Transform';

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

export interface IScheduler {
  onUpdate: SubscribeMethod<UpdateData>;
  onPostUpdate: SubscribeMethod<UpdateData>;
  onRender: SubscribeMethod<RenderData>;
  /**
   * Request a render specifying a rect
   * If frame is null or false, it will be ignored
   */
  requestFrameRender(rect: Rect | null | false): void;
  addChild(child: IScheduler): void;
  removeChild(child: IScheduler): void;
  [ON_FRAME_UPDATE]: (t: number) => void;
  [ON_FRAME_POST_UPDATE]: (t: number) => void;
  [ON_FRAME_RENDER]: (t: number, parentRects: Array<Rect>) => Array<Rect>;
  [ATTACH]: (parent: IScheduler) => void;
}

export interface IRootScheduler extends IScheduler {
  getTime(): number;
  start(): void;
  stop(): void;
}

/**
 * Handle child schedulers and frames rects
 */
export interface IChildScheduler extends IScheduler {
  /**
   * Update transforms
   */
  setTransform(transform: ITransform): void;
}

export type RootSchedulerOptions = {
  autoStart?: boolean;
};

/**
 * The root scheduler is the one that create the render loop (requestAnimationFrame)
 * It does not have a transform
 * Most of its methods and are proxied from th rootChild scheduler
 */
export const Scheduler = (() => {
  return {
    root: createRoot,
    child: createChild,
  };

  function createRoot({ autoStart = true }: RootSchedulerOptions = {}): IRootScheduler {
    const rootChild = createChild();

    let startTime = performance.now();
    let currentTime = startTime;
    let requestedFrameId: number | null = null;

    if (autoStart) {
      start();
    }

    return {
      requestFrameRender: rootChild.requestFrameRender,
      addChild: rootChild.addChild,
      removeChild: rootChild.removeChild,
      onRender: rootChild.onRender,
      onUpdate: rootChild.onUpdate,
      onPostUpdate: rootChild.onPostUpdate,

      getTime,
      start,
      stop,

      [ON_FRAME_UPDATE]: onFrameUpdate,
      [ON_FRAME_POST_UPDATE]: onFramePostUpdate,
      [ON_FRAME_RENDER]: onFrameRender,
      [ATTACH]: attach,
    };

    function onFrameUpdate(t: number) {
      return rootChild[ON_FRAME_UPDATE](t);
    }

    function onFramePostUpdate(t: number) {
      return rootChild[ON_FRAME_POST_UPDATE](t);
    }

    function onFrameRender(t: number) {
      return rootChild[ON_FRAME_RENDER](t, []);
    }

    function attach() {
      throw new Error('Root scheduler cannot be attached to another scheduler');
    }

    function getTime() {
      return currentTime;
    }

    function start() {
      if (requestedFrameId !== null) {
        // already running
        return;
      }
      startTime = performance.now();
      loop();
    }

    function stop() {
      if (requestedFrameId !== null) {
        cancelAnimationFrame(requestedFrameId);
      }
    }

    function onFrame() {
      const t = performance.now() - startTime;
      currentTime = t;
      onFrameUpdate(t);
      onFramePostUpdate(t);
      onFrameRender(t);
    }

    function loop() {
      onFrame();
      requestedFrameId = requestAnimationFrame(loop);
    }
  }

  function createChild(initTransform: ITransform = []): IChildScheduler {
    const renderSub = Subscription<RenderData>();
    const updateSub = Subscription<UpdateData>();
    const postUpdateSub = Subscription<UpdateData>();

    let children: ReadonlyArray<IScheduler> = [];
    let nextRenderFrames: Array<Rect> = [];
    let isRendering = false;
    let transform: ITransform = initTransform;
    let parent: IScheduler | null = null;

    const scheduler: IChildScheduler = {
      onRender: renderSub.subscribe,
      onUpdate: updateSub.subscribe,
      onPostUpdate: postUpdateSub.subscribe,
      setTransform,
      requestFrameRender,
      addChild,
      removeChild,
      [ON_FRAME_UPDATE]: onFrameUpdate,
      [ON_FRAME_POST_UPDATE]: onFramePostUpdate,
      [ON_FRAME_RENDER]: onFrameRender,
      [ATTACH]: attach,
    };

    return scheduler;

    function setTransform(newTransform: ITransform) {
      transform = newTransform;
    }

    function requestFrameRender(frame: Rect | null | false) {
      if (isRendering) {
        console.warn('Request frame inside a frame ?');
      }
      if (frame === null || frame === false) {
        return;
      }
      nextRenderFrames.push(frame);
    }

    function addChild(child: IScheduler) {
      if (children.includes(child)) {
        return;
      }
      child[ATTACH](scheduler);
      children = [...children, child];
    }

    function removeChild(child: IScheduler) {
      const childIndex = children.indexOf(child);
      if (childIndex === -1) {
        return;
      }
      const copy = [...children];
      copy.splice(childIndex, 1);
      children = copy;
    }

    function attach(newParent: IScheduler) {
      if (parent !== null) {
        throw new Error('Child scheduler already attached');
      }
      parent = newParent;
    }

    function onFrameUpdate(t: number) {
      // Upadate is always called
      const currentChildren = children;
      currentChildren.forEach((child) => {
        child[ON_FRAME_UPDATE](t);
      });
      updateSub.emit({ t });
    }

    function onFramePostUpdate(t: number) {
      // PostUpdate is always called
      const currentChildren = children;
      currentChildren.forEach((child) => {
        child[ON_FRAME_POST_UPDATE](t);
      });
      postUpdateSub.emit({ t });
    }

    function onFrameRender(t: number, parentRects: Array<Rect>): Array<Rect> {
      isRendering = true;
      const localRects = nextRenderFrames;
      nextRenderFrames = [];
      const currentTransform = transform;
      const currentChildren = children;

      // Apply transform to parent rects to get local rects
      const parentRectsTransformed = transformRects(parentRects, currentTransform);
      // Local rects don't need to be transformed
      const parentAndLocalRects = [...parentRectsTransformed, ...localRects];

      // Render children first
      // they returns rendered rects
      const childRendered: Array<Rect> = [];
      currentChildren.forEach((child) => {
        const rendered = child[ON_FRAME_RENDER](t, parentAndLocalRects);
        childRendered.push(...rendered);
      });
      const allRects = [...parentAndLocalRects, ...childRendered];
      if (allRects.length > 0) {
        renderSub.emit({ t, rects: allRects });
      }
      // Rects we did render
      const localAndChildRects = [...localRects, ...childRendered];
      isRendering = false;
      // Apply inverse transform to local and child rects to return rect in parent space
      return transformRects(localAndChildRects, currentTransform);
    }
  }
})();
