import { Subscription, Unsubscribe } from 'suub';

export interface PointerUpEvent {
  x: number;
  y: number;
}

export enum PointerCancelReason {
  PointerCancelEvent = 'PointerCancelEvent',
  PointerCaptured = 'PointerCaptured',
  PointerTrackerStop = 'PointerTrackerStop',
  PointerLeave = 'PointerLeave',
}

export interface PointerCancelEvent {
  reason: PointerCancelReason;
}

export interface PointerMoveEvent {
  x: number;
  y: number;
}

export interface PointerTracker {
  onPointerUp(event: PointerUpEvent): void;
  onPointerCancel(event: PointerCancelEvent): void;
  onPointerMove(event: PointerMoveEvent): void;
}

export interface PointerTrackerInstance {
  stop(): void;
  capture(): void;
  hasCapture(): boolean;
}

export interface PointerActiveEvent {
  x: number;
  y: number;
  pointerId: number;
  track(options: Partial<PointerTracker>): PointerTrackerInstance;
}

export interface PointerHoverEventPointer {
  pointerId: number;
  x: number;
  y: number;
  active: boolean;
}

export interface PointerHoverEvent {
  pointers: Array<PointerHoverEventPointer>;
}

export interface DraawWheelEvent {
  pointerId: number;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
}

const CAPTURE = Symbol.for('DRAAW_INTERNAL_CAPTURE');
const TRACKERS = Symbol.for('DRAAW_INTERNAL_TRACKERS');

export interface InternalPointer {
  pointerId: number;
  x: number;
  y: number;
  active: boolean;
  primary: boolean;
  [CAPTURE]: PointerTracker | null;
  [TRACKERS]: Array<PointerTracker>;
}

export interface IEventsManager {
  getPointers(): ReadonlyArray<InternalPointer>;
  onActivePointer(handler: (event: PointerActiveEvent) => void): Unsubscribe;
  onPointerHover(handler: (event: PointerHoverEvent) => void): Unsubscribe;
  onWheel(handler: (event: DraawWheelEvent) => void): Unsubscribe;
}

export const EventsManager = (() => {
  return { create };

  function create(el: HTMLElement | Window): IEventsManager {
    const handlers = {
      onActivePointer: Subscription<PointerActiveEvent>(),
      onPointerMove: Subscription<PointerHoverEvent>(),
      onWheel: Subscription<DraawWheelEvent>(),
    };

    const pointers: Array<InternalPointer> = [];

    let currentDownPointerId: number | null = null;

    addGlobalListeners();

    return {
      getPointers,
      onActivePointer: handlers.onActivePointer.subscribe,
      onPointerHover: handlers.onPointerMove.subscribe,
      onWheel: handlers.onWheel.subscribe,
    };

    function getPointers() {
      return pointers;
    }

    function addGlobalListeners() {
      const htmlEl = el as HTMLElement;
      htmlEl.addEventListener('pointerenter', handlePointerEnter, { passive: true, capture: false });
      htmlEl.addEventListener('pointerdown', handlePointerDown, { passive: true, capture: false });
      htmlEl.addEventListener('pointerup', handlePointerUp, { passive: true, capture: false });
      htmlEl.addEventListener('pointermove', handlePointerMove, { passive: true, capture: false });
      htmlEl.addEventListener('pointercancel', handlePointerCancel, { passive: true, capture: false });
      htmlEl.addEventListener('pointerleave', handlePointerLeave, { passive: true, capture: false });
      htmlEl.addEventListener('wheel', handleWheel, { passive: true, capture: false });
    }

    function trackPointer(events: Partial<PointerTracker>): PointerTrackerInstance {
      if (currentDownPointerId === null) {
        throw new Error(`Cannot track pointer outside of listener`);
      }
      const pointerId = currentDownPointerId;
      const tracker: PointerTracker = {
        onPointerCancel: () => {},
        onPointerUp: () => {},
        onPointerMove: () => {},
        ...events,
      };
      const pointer = pointers.find((p) => p.pointerId === pointerId);
      if (!pointer) {
        throw new Error(`Cannot find pointer`);
      }
      if (pointer[CAPTURE] !== null) {
        throw new Error(`Cannot track a captured pointer`);
      }
      pointer[TRACKERS].push(tracker);
      return {
        stop() {
          return stopTracker(pointerId, tracker);
        },
        capture() {
          return captureTracker(pointerId, tracker);
        },
        hasCapture() {
          return trackerHasCapture(pointerId, tracker);
        },
      };
    }

    function stopTracker(pointerId: number, tracker: PointerTracker) {
      const pointer = pointers.find((p) => p.pointerId === pointerId);
      if (!pointer) {
        console.warn('Pointer not found !');
        return;
      }
      tracker.onPointerCancel({ reason: PointerCancelReason.PointerTrackerStop });
      if (pointer[CAPTURE] === tracker) {
        pointer[CAPTURE] = null;
        return;
      }
      const trackerIndex = pointer[TRACKERS].indexOf(tracker);
      if (trackerIndex === -1) {
        console.warn('Tracker not found !');
        return;
      }
      pointer[TRACKERS].splice(trackerIndex, 1);
    }

    function captureTracker(pointerId: number, tracker: PointerTracker): void {
      const pointer = pointers.find((p) => p.pointerId === pointerId);
      if (!pointer) {
        console.warn('Pointer not found !');
        return;
      }
      if (pointer[CAPTURE] === tracker) {
        // tracker already captured
        return;
      }
      if (pointer[CAPTURE] !== null) {
        // another tracker has capture
        throw new Error(`Pointer already has an active capture !`);
      }
      const trackerIndex = pointer[TRACKERS].indexOf(tracker);
      if (trackerIndex === -1) {
        console.warn('Tracker not found !');
        return;
      }
      // set capture
      pointer[CAPTURE] = tracker;
      // remove from trackers
      pointer[TRACKERS].splice(trackerIndex, 1);
      // cancel all other trackers
      pointer[TRACKERS].forEach((tracker) => {
        tracker.onPointerCancel({ reason: PointerCancelReason.PointerCaptured });
      });
      // clear trackers
      pointer[TRACKERS] = [];
    }

    function trackerHasCapture(pointerId: number, tracker: PointerTracker): boolean {
      const pointer = pointers.find((p) => p.pointerId === pointerId);
      if (!pointer) {
        console.warn('Pointer not found !');
        return false;
      }
      if (pointer[CAPTURE] === tracker) {
        return true;
      }
      return false;
    }

    function addPointer(
      pointerId: number,
      x: number,
      y: number,
      primary: boolean,
      { emit }: { emit: boolean }
    ): InternalPointer {
      // add pointer
      const newPointer: InternalPointer = {
        pointerId,
        x,
        y,
        active: false,
        primary,
        [TRACKERS]: [],
        [CAPTURE]: null,
      };
      pointers.push(newPointer);
      if (emit) {
        handlers.onPointerMove.emit({ pointers });
      }
      return newPointer;
    }

    function handlePointerEnter(evt: PointerEvent) {
      addPointer(evt.pointerId, evt.clientX, evt.clientY, evt.isPrimary, { emit: true });
    }

    function handlePointerDown(evt: PointerEvent) {
      let pointer = pointers.find((p) => p.pointerId === evt.pointerId);
      if (!pointer) {
        // Page loaded => create primary pointer
        pointer = addPointer(1, evt.clientX, evt.clientY, true, { emit: false });
      }
      updatePointer(pointer, evt.clientX, evt.clientY, true);
      currentDownPointerId = pointer.pointerId;
      handlers.onActivePointer.emit({
        x: evt.clientX,
        y: evt.clientY,
        pointerId: evt.pointerId,
        track: trackPointer,
      });
      currentDownPointerId = null;
      handlers.onPointerMove.emit({ pointers });
    }

    function handlePointerMove(evt: PointerEvent) {
      let pointer = pointers.find((p) => p.pointerId === evt.pointerId);
      if (!pointer) {
        // we probably missed the enter because it happened before the page loaded
        if (pointers.length === 0) {
          pointer = addPointer(evt.pointerId, evt.clientX, evt.clientY, evt.isPrimary, {
            emit: false,
          });
        } else {
          console.warn(`Pointer not found`);
          return;
        }
      }
      updatePointer(pointer, evt.clientX, evt.clientY, null);
      const event: PointerMoveEvent = { x: evt.clientX, y: evt.clientY };
      resolvePointerTrackers(pointer).forEach((tracker) => {
        tracker.onPointerMove(event);
      });
      handlers.onPointerMove.emit({ pointers });
    }

    function handlePointerUp(evt: PointerEvent) {
      let pointer = pointers.find((p) => p.pointerId === evt.pointerId);
      if (!pointer) {
        pointer = addPointer(evt.pointerId, evt.clientX, evt.clientY, evt.isPrimary, {
          emit: false,
        });
      }
      const trackers = resolvePointerTrackers(pointer);
      updatePointer(pointer, evt.clientX, evt.clientY, false);
      const event: PointerUpEvent = { x: evt.clientX, y: evt.clientY };
      trackers.forEach((tracker) => {
        tracker.onPointerUp(event);
      });
      // clear
      pointer[CAPTURE] = null;
      pointer[TRACKERS] = [];
      handlers.onPointerMove.emit({ pointers });
    }

    function handlePointerCancel(evt: PointerEvent) {
      let pointer = pointers.find((p) => p.pointerId === evt.pointerId);
      if (!pointer) {
        pointer = addPointer(evt.pointerId, evt.clientX, evt.clientY, evt.isPrimary, {
          emit: false,
        });
      }
      updatePointer(pointer, evt.clientX, evt.clientY, false);
      const event: PointerCancelEvent = { reason: PointerCancelReason.PointerCancelEvent };
      resolvePointerTrackers(pointer).forEach((tracker) => {
        tracker.onPointerCancel(event);
      });
      removePointer(pointer);
      handlers.onPointerMove.emit({ pointers });
    }

    function handlePointerLeave(evt: PointerEvent) {
      let pointer = pointers.find((p) => p.pointerId === evt.pointerId);
      if (!pointer) {
        pointer = addPointer(evt.pointerId, evt.clientX, evt.clientY, evt.isPrimary, {
          emit: false,
        });
      }
      removePointer(pointer);
      handlers.onPointerMove.emit({ pointers });
    }

    function updatePointer(pointer: InternalPointer, clientX: number, clientY: number, active: boolean | null) {
      pointer.x = clientX;
      pointer.y = clientY;
      if (active !== null) {
        if (pointer.active === active) {
          return;
        }
        pointer.active = active;
      }
    }

    function resolvePointerTrackers(pointer: InternalPointer): Array<PointerTracker> {
      if (pointer.active === false && (pointer[CAPTURE] || pointer[TRACKERS].length > 0)) {
        console.warn('Inactive pointer should not have CAPTURE or TRACKERS');
        return [];
      }
      const capture = pointer[CAPTURE];
      return capture !== null ? [capture] : pointer[TRACKERS];
    }

    function removePointer(pointer: InternalPointer) {
      const pointerIndex = pointers.indexOf(pointer);
      if (pointerIndex === -1) {
        console.warn('Pointer not found !');
        return;
      }
      if (pointer[CAPTURE]) {
        pointer[CAPTURE]?.onPointerCancel({ reason: PointerCancelReason.PointerLeave });
      }
      pointer[TRACKERS].forEach((tracker) => {
        tracker.onPointerCancel({ reason: PointerCancelReason.PointerLeave });
      });
      pointers.splice(pointerIndex, 1);
    }

    function handleWheel(evt: WheelEvent): void {
      if (pointers.length === 0) {
        // Page loaded => create primary pointer
        addPointer(1, evt.clientX, evt.clientY, true, { emit: true });
      }
      const primaryPointer = pointers.find((p) => p.primary);
      const pointer = primaryPointer ?? pointers[0];
      handlers.onWheel.emit({
        pointerId: pointer.pointerId,
        x: evt.clientX,
        y: evt.clientY,
        deltaX: evt.deltaX,
        deltaY: evt.deltaY,
      });
    }
  }
})();
