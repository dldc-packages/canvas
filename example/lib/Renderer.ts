import { HitView } from './HitView';
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
    const hitView = HitView.create();
    const tools = Tools.create(view.context);
    const rootLayer = layer;
    const rootLayerLifecycles = Layer.mount(rootLayer.ref, tools);

    const scheduler = Screduler.create({ autoStart, onFrame });

    // eventsManager.onActivePointer((event) => {
    //   rootLayerLifecycles.onActivePointer?.(event);
    // });

    // eventsManager.onPointerHover((event) => {
    //   rootLayerLifecycles.onPointerHover?.(event);
    // });

    // eventsManager.onWheel((event) => {
    //   rootLayerLifecycles.onWheel?.(event);
    // });

    return {
      layer: rootLayer,
      scheduler,
      view,
    };

    function onFrame(t: number) {
      view.update();
      view.prepare();

      // eventsManager.getPointers().forEach((pointer) => {
      //   console.log(pointer);
      // });

      /**
       * TODO: getPointers, for each pointer
       * - if position changed or pointer is in one of the renderRects
       * - call hit to draw on the hit layer
       * - we get the hit color.
       * - cal
       *
       * - in Group, test hit pixel to see if we have a new match
       * - collect the matches then dispatch the event in reverse order (top to bottom)
       * - For Group(Item1, Item2, Group(Item3, Item4))
       *   - Item1 hit -> new match ?
       *   - Item2 hit -> new match ?
       *   - Item3 hit -> new match ?
       *   - Item4 hit -> new match ?
       *   - dispatch event if match on Item4, Item3, Item2, Item1
       */

      const currentView = view.$innerRect.value;
      const renderRects = rootLayerLifecycles.update?.({ t, view: currentView }) ?? [];
      renderRects.forEach((renderRect) => {
        rootLayerLifecycles.draw?.({ t, view: currentView, rect: renderRect, ctx: view.context });
      });
    }
  }
})();
