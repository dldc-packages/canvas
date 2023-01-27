import { DraawWheelEvent, PointerActiveEvent, PointerHoverEvent } from './EventsManager';
import { IRect } from './Geometry';
import { Tools } from './Tools';

export interface ILayer {
  readonly ref: ILayerRef;
}

const INTERNAL = Symbol.for('DRAAW_INTERNAL');

// Update should return an array of rects that need to be redrawn
export type UpdateParams = { t: number; view: IRect };
export type Update = (params: UpdateParams) => null | Array<IRect>;

export type DrawParams = { t: number; view: IRect; rect: IRect; ctx: CanvasRenderingContext2D };
export type Draw = (params: DrawParams) => void;

export type Cleanup = () => void;

export type OnActivePointer = (event: PointerActiveEvent) => void;

export type OnPointerHover = (event: PointerHoverEvent) => void;

export type OnWheel = (event: DraawWheelEvent) => void;

export interface ILayerLifecycles {
  readonly update?: Update;
  readonly draw?: Draw;
  readonly hit?: Draw;

  readonly onActivePointer?: OnActivePointer;
  readonly onPointerHover?: OnPointerHover;
  readonly onWheel?: OnWheel;

  readonly cleanup?: Cleanup;
}

export type ILayerFn = (tools: Tools) => ILayerLifecycles;

export interface ILayerRef {
  [INTERNAL]: ILayerFn;
}

export const Layer = (() => {
  return { createRef, mount };

  function createRef(fn: ILayerFn): ILayerRef {
    return { [INTERNAL]: fn };
  }

  function mount(ref: ILayerRef, tools: Tools): ILayerLifecycles {
    return ref[INTERNAL](tools);
  }
})();
