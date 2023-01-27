export enum PointerCancelReason {
  PointerCancelEvent = 'PointerCancelEvent',
  PointerCaptured = 'PointerCaptured',
  PointerTrackerStop = 'PointerTrackerStop',
  PointerLeave = 'PointerLeave',
}

// const CAPTURE = Symbol.for('DRAAW_INTERNAL_CAPTURE');
// const TRACKERS = Symbol.for('DRAAW_INTERNAL_TRACKERS');

// export interface PointerTracker {
//   onPointerUp(event: PointerUpEvent): void;
//   onPointerCancel(event: PointerCancelEvent): void;
//   onPointerMove(event: PointerMoveEvent): void;
// }

export interface IPointer {
  pointerId: number;
  x: number;
  y: number;
  active: boolean;
  primary: boolean;
  // [CAPTURE]: PointerTracker | null;
  // [TRACKERS]: Array<PointerTracker>;
}

export type IPointerEvent =
  | { event: 'Wheel'; pointerId: number; x: number; y: number; deltaX: number; deltaY: number }
  | { event: 'PointerMove'; pointerId: number; x: number; y: number }
  | { event: 'PointerActive'; pointerId: number; x: number; y: number }
  | { event: 'PointerCancel'; pointerId: number; x: number; y: number; reason: PointerCancelReason };

export interface IEventsManager {
  commitEvents(): Array<IPointerEvent>;
  // onActivePointer(handler: (event: PointerActiveEvent) => void): Unsubscribe;
  // onPointerHover(handler: (event: PointerHoverEvent) => void): Unsubscribe;
  // onWheel(handler: (event: DraawWheelEvent) => void): Unsubscribe;
}

export const EventsManager = (() => {
  return { create };

  function create(el: HTMLElement | Window): IEventsManager {
    throw new Error('Not implemented');
  }
})();
