import { EventManager } from './EventManager';
import { ILayer, Layer } from './Layer';
import { IScreduler, Screduler } from './Scheduler';
import { Tools } from './Tools';
import { IView, View } from './View';

export interface IRenderer<RootLayer extends ILayer> {
  readonly layer: RootLayer;
  readonly scheduler: IScreduler;
  readonly view: IView;
}

export interface RendererOptions<RootLayer extends ILayer> {
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
  }: RendererOptions<RootLayer>): IRenderer<RootLayer> {
    const view = View({ target, name });
    const scheduler = Screduler.create(onFrame);
    const tools = Tools.create(view.context, scheduler);
    const rootLayer = layer;
    const rootLayerLifecycles = Layer.mount(rootLayer.ref, tools);
    const eventManager = EventManager.create(eventsTarget);

    if (autoStart) {
      scheduler.start();
    }

    return { layer: rootLayer, scheduler, view };

    function onFrame(t: number) {
      rootLayerLifecycles.pointers?.(eventManager.getPointers());
      eventManager.flushEvents().forEach((event) => {
        rootLayerLifecycles.event?.(event);
      });

      view.update();
      view.prepare();

      const currentView = view.$innerRect.value;

      const renderRects = rootLayerLifecycles.update?.({ t, view: currentView }) ?? [];
      renderRects.forEach((renderRect) => {
        rootLayerLifecycles.draw?.({ t, view: currentView, rect: renderRect, ctx: view.context });
      });
    }
  }
})();
