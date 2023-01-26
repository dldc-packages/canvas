import { ILayer, Layer } from './Layer';
import { IScreduler, Screduler } from './Scheduler';
import { Tools } from './Tools';
import { toArray } from './utils';
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
  // start the animation loop (default: true)
  autoStart?: boolean;
}

export const Renderer = (() => {
  return { create };

  function create<RootLayer extends ILayer>({
    target,
    name,
    layer,
    autoStart = true,
  }: RendererOptions<RootLayer>): IRenderer<RootLayer> {
    const view = View({ target, name });
    const tools = Tools.create(view.context);
    const rootLayer = layer;

    const scheduler = Screduler.create({ autoStart, onFrame });

    return {
      layer: rootLayer,
      scheduler,
      view,
    };

    function onFrame(t: number) {
      view.update();
      view.prepare();
      const currentView = view.$innerRect.value;
      const renderRects = toArray(Layer.unwrap(rootLayer.ref).onRect({ t, view: currentView, tools }));
      renderRects.forEach((renderRect) => {
        Layer.unwrap(rootLayer.ref).onRender({ t, view: currentView, rect: renderRect, tools });
      });
    }
  }
})();
