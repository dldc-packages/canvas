import type { Tools } from '../Tools';
import type { IRect } from '../utils/Geometry';

/**
 * This is a layer
 */
export interface ILayer {
  readonly mount: TMountLayerFn;
}

export type TMountLayerFn = (tools: Tools) => ILayerLifecycles;

export interface ILayerLifecycles {
  /**
   * Called when the pointers are updated (added, removed, moved)
   * Return the pointers that should be passed to the children
   */
  readonly pointers?: TPointersLifecycle;
  /**
   * Called when an event is triggered
   * When an event handled, it should return true
   * This is used in merged to stop propagation to sibling layers
   */
  readonly event?: TEventLifecycle;

  /**
   * Run on each frame, return an array of rects that need to be redrawn (or null)
   */
  readonly update?: TUpdateLifecycle;
  /**
   * Is called for each rect returned by update
   */
  readonly draw?: TDrawLifecycle;

  /**
   * Cleanup is called when the layer is unmounted
   */
  readonly cleanup?: TCleanupLifecycle;
}

export type TLayerLifecyclesMutable = Mutable<ILayerLifecycles>;

export type Mutable<Type> = {
  -readonly [Key in keyof Type]: Type[Key];
};

// Update should return an array of rects that need to be redrawn
export interface IUpdateParams {
  t: number;
  view: IRect;
}

export type TUpdateLifecycle = (params: IUpdateParams) => null | Array<IRect>;

export interface IDrawParams {
  t: number;
  view: IRect;
  rect: IRect;
  ctx: CanvasRenderingContext2D;
}
export type TDrawLifecycle = (params: IDrawParams) => void;

export type TCleanupLifecycle = () => void;

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

export type THandled = boolean;

export type TEventLifecycle = (event: IEventAny) => THandled;

export type TPointersLifecycle = (pointers: IPointers) => IPointers;
