import { EventManager } from './EventManager';
import type { IFrame } from './Frame';
import { Frame } from './Frame';
import type { ILayer } from './Layer.types';
import { Scheduler, type IScheduler } from './Scheduler';
import { Tools } from './Tools';

/**
 * Connect everything together
 * - Create a View
 */
export interface IRenderer<RootLayer extends ILayer> {
  readonly layer: RootLayer;
  readonly scheduler: IScheduler;
  readonly view: IFrame;

  destroy(): void;
}

export interface IRendererOptions<RootLayer extends ILayer> {
  layer: RootLayer;
  // Debug name
  name?: string;
  // The element where the canvas will be appended
  target: HTMLElement;
  // element where events will be listened (default: target)
  eventsTarget?: HTMLElement;
  // start the animation loop (default: true)
  autoStart?: boolean;
}

export const Renderer = (() => {
  return { create };

  function create<RootLayer extends ILayer>({
    target,
    eventsTarget = target,
    name,
    layer,
    autoStart = true,
  }: IRendererOptions<RootLayer>): IRenderer<RootLayer> {
    const frame = Frame({ target, name });
    const scheduler = Scheduler.create(onFrame);
    const tools = Tools.create(frame, scheduler);
    const rootLayer = layer;
    const rootLayerLifecycles = rootLayer.mount(tools);
    const eventManager = EventManager.create(eventsTarget);

    if (autoStart) {
      scheduler.start();
    }

    return { layer: rootLayer, scheduler, view: frame, destroy };

    function destroy() {
      scheduler.stop();
      rootLayerLifecycles.cleanup?.();
      frame.destroy();
      eventManager.destroy();
    }

    function onFrame(t: number) {
      rootLayerLifecycles.pointers?.(eventManager.getPointers());
      eventManager.flushEvents().forEach((event) => {
        rootLayerLifecycles.event?.(event);
      });

      const resized = frame.update();

      const currentView = frame.view;

      const renderRects = rootLayerLifecycles.update?.({ t, view: currentView }) ?? [];
      // If we resized, we need to redraw the whole view
      const actualRenderRects = resized ? [currentView] : renderRects;
      actualRenderRects.forEach((renderRect) => {
        rootLayerLifecycles.draw?.({ t, view: currentView, rect: renderRect, ctx: frame.context });
      });
    }
  }
})();
