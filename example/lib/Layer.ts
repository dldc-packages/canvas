import { IRect } from './Geometry';
import { Tools } from './Tools';

export interface ILayer {
  readonly ref: ILayerRef;
}

const INTERNAL = Symbol.for('DRAAW_INTERNAL');

export type OnRectResult = null | IRect | Array<IRect>;

export interface OnRectParams {
  t: number;
  view: IRect;
  tools: Tools;
}

export interface OnRenderParams {
  t: number;
  view: IRect;
  rect: IRect;
  tools: Tools;
}

export type OnRect = (params: OnRectParams) => OnRectResult;

export type OnRender = (params: OnRenderParams) => void;

export interface ILayerRefInner {
  readonly onRect: OnRect;
  readonly onRender: OnRender;
}

export interface ILayerRef {
  [INTERNAL]: ILayerRefInner;
}

export const Layer = (() => {
  return { createRef, unwrap };

  function createRef(inner: ILayerRefInner): ILayerRef {
    return {
      [INTERNAL]: inner,
    };
  }

  function unwrap(ref: ILayerRef): ILayerRefInner {
    return ref[INTERNAL];
  }
})();

// export interface OnRectParams {
//   t: number;
//   view: IRect;
//   tools: Tools;
// }

// export interface OnRenderParams {
//   t: number;
//   view: IRect;
//   rect: IRect;
//   tools: Tools;
// }

// export interface OnAttachResult {
//   tools?: Tools;
//   cleanup?: () => void;
// }

// export interface LayerOptions {
//   // Given the current view of the layer, return the rect or rects that should be used to render the layer
//   // or null if the layer should not be rendered
//   onRect?: (params: OnRectParams) => OnRectResult;
//   onRender?: (params: OnRenderParams) => void;
// }

// export const Layer = (() => {
//   return { create };

//   function create({ onRect, onRender }: LayerOptions = {}): ILayer {
//     const layer: ILayer = {
//       ref: Ref.create({
//         onRect: onRectInternal,
//         onRender: onRenderInternal,
//       }),
//     };

//     return layer;

//     function onRectInternal(t: number, parentView: IRect, parentTools: Tools): OnRectResult {
//       if (onRect) {
//         return onRect({ t, view: parentView, tools: parentTools });
//       }
//       return parentView;
//     }

//     function onRenderInternal(t: number, parentView: IRect, renderRect: IRect, parentTools: Tools) {
//       const clipped = Geometry.Rect.clip(renderRect, parentView);
//       if (!clipped) {
//         return;
//       }
//       const params: OnRenderParams = { t, view: parentView, rect: clipped, tools: parentTools };
//       if (onRender) {
//         onRender(params);
//       }
//     }
//   }
// })();
