import type { IRect } from './Geometry';
import type { Tools } from './Tools';

export interface ILayer {
  readonly ref: ILayerRef;
}

const INTERNAL = Symbol.for('DRAAW_INTERNAL');

// Update should return an array of rects that need to be redrawn
export type UpdateParams = { t: number; view: IRect };
export type UpdateLifecycle = (params: UpdateParams) => null | Array<IRect>;

export type DrawParams = { t: number; view: IRect; rect: IRect; ctx: CanvasRenderingContext2D };
export type DrawLifecycle = (params: DrawParams) => void;

export type CleanupLifecycle = () => void;

export interface IPointer {
  pointerId: number;
  x: number;
  y: number;
  primary: boolean;
}

export type IPointers = ReadonlyArray<IPointer>;

export type IEventAny =
  | { name: 'PointerEnter'; pointerId: number }
  | { name: 'PointerDown'; pointerId: number }
  | { name: 'PointerUp'; pointerId: number }
  | { name: 'PointerMove'; pointerId: number }
  | { name: 'PointerCancel'; pointerId: number }
  | { name: 'PointerLeave'; pointerId: number }
  | { name: 'Wheel'; deltaX: number; deltaY: number };

export type IEventName = IEventAny['name'];

export type IEvent<EventName extends IEventName = IEventName> = Extract<IEventAny, { name: EventName }>;

// When an event or pointer is handled, it should return true
// This is used in merged to stop propagation to sibling layers
export type Handled = boolean;

export type EventLifecycle = (event: IEventAny) => Handled;

export type PointersLifecycle = (pointers: IPointers) => IPointers;

export interface ILayerLifecyclesMutable {
  pointers?: PointersLifecycle;
  event?: EventLifecycle;

  update?: UpdateLifecycle;
  draw?: DrawLifecycle;

  cleanup?: CleanupLifecycle;
}

export type ILayerLifecycles = Readonly<ILayerLifecyclesMutable>;

export type ILayerFn = (tools: Tools) => ILayerLifecycles;

export interface ILayerRef {
  [INTERNAL]: ILayerFn;
}

export const Layer = (() => {
  return { createRef, mount, merge };

  function createRef(fn: ILayerFn): ILayerRef {
    return { [INTERNAL]: fn };
  }

  function mount(ref: ILayerRef, tools: Tools): ILayerLifecycles {
    return ref[INTERNAL](tools);
  }

  /**
   * Combine multiple layers into one (same as putting them in a group)
   */
  function merge(...layersLifecycles: ILayerLifecycles[]): ILayerLifecycles {
    const merged: ILayerLifecyclesMutable = {};
    const events = layersLifecycles
      .map((l) => l.event)
      .filter(isNotNil)
      .reverse(); // reverse to dispatch to top layer first
    if (events.length > 0) {
      merged.event = (event) => events.reduce<boolean>((acc, e) => !acc && e(event), false);
    }
    const pointersLifecycles = layersLifecycles
      .map((l) => l.pointers)
      .filter(isNotNil)
      .reverse(); // reverse to dispatch to top layer first
    if (pointersLifecycles.length > 0) {
      merged.pointers = (pointers) => pointersLifecycles.reduce<IPointers>((pointers, fn) => fn(pointers), pointers);
    }
    const updates = layersLifecycles.map((l) => l.update).filter(isNotNil);
    if (updates.length > 0) {
      merged.update = (params) => {
        const rects = updates
          .map((u) => u(params))
          .filter(isNotNil)
          .flat();
        if (rects.length === 0) {
          return null;
        }
        return rects;
      };
    }
    const draws = layersLifecycles.map((l) => l.draw).filter(isNotNil);
    if (draws.length > 0) {
      merged.draw = (params) => draws.forEach((d) => d(params));
    }
    const cleanups = layersLifecycles.map((l) => l.cleanup).filter(isNotNil);
    if (cleanups.length > 0) {
      merged.cleanup = () => cleanups.forEach((c) => c());
    }
    return merged;
  }

  function isNotNil<T>(v: T): v is NonNullable<T> {
    return v !== null && v !== undefined;
  }
})();
