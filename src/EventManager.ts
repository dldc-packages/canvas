import type { IEventAny, IPointer } from './core/Layer.types';

export interface IEventManager {
  getPointers(): ReadonlyArray<IPointer>;
  flushEvents(): ReadonlyArray<IEventAny>;
  destroy(): void;
}

export const EventManager = (() => {
  return { create };

  function create(el: HTMLElement | Window): IEventManager {
    const pointers: IPointer[] = [];
    let eventsQueue: IEventAny[] = [];

    addGlobalListeners();

    return {
      getPointers,
      flushEvents,
      destroy,
    };

    function destroy() {
      const htmlEl = el as HTMLElement;
      htmlEl.removeEventListener('pointerenter', handlePointerEnter);
      htmlEl.removeEventListener('pointerdown', handlePointerDown);
      htmlEl.removeEventListener('pointerup', handlePointerUp);
      htmlEl.removeEventListener('pointermove', handlePointerMove);
      htmlEl.removeEventListener('pointercancel', handlePointerCancel);
      htmlEl.removeEventListener('pointerleave', handlePointerLeave);
      htmlEl.removeEventListener('wheel', handleWheel);
    }

    function getPointers() {
      return pointers;
    }

    function flushEvents() {
      const events = eventsQueue;
      eventsQueue = [];
      return events;
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

    function addPointer(event: PointerEvent): IPointer {
      const { pointerId, offsetX: x, offsetY: y, isPrimary: primary } = event;
      const pointer = { pointerId, x, y, primary };
      pointers.push(pointer);
      return pointer;
    }

    function updatePointer(event: PointerEvent): IPointer {
      const { pointerId, offsetX: x, offsetY: y } = event;
      let pointer = pointers.find((p) => p.pointerId === pointerId);
      if (!pointer) {
        pointer = addPointer(event);
      }
      pointer.x = x;
      pointer.y = y;
      return pointer;
    }

    function removePointer(event: PointerEvent): IPointer | null {
      const { pointerId } = event;
      const index = pointers.findIndex((p) => p.pointerId === pointerId);
      if (index >= 0) {
        const [removed] = pointers.splice(index, 1);
        return removed;
      }
      return null;
    }

    function handlePointerEnter(event: PointerEvent) {
      const pointer = addPointer(event);
      eventsQueue.push({ name: 'PointerEnter', pointerId: pointer.pointerId });
    }

    function handlePointerDown(event: PointerEvent) {
      const pointer = updatePointer(event);
      eventsQueue.push({ name: 'PointerDown', pointerId: pointer.pointerId });
    }

    function handlePointerUp(event: PointerEvent) {
      const pointer = updatePointer(event);
      eventsQueue.push({ name: 'PointerUp', pointerId: pointer.pointerId });
    }

    function handlePointerMove(event: PointerEvent) {
      const pointer = updatePointer(event);
      eventsQueue.push({ name: 'PointerMove', pointerId: pointer.pointerId });
    }

    function handlePointerCancel(event: PointerEvent) {
      const pointer = removePointer(event);
      if (pointer) {
        eventsQueue.push({ name: 'PointerCancel', pointerId: pointer.pointerId });
      }
    }

    function handlePointerLeave(event: PointerEvent) {
      const pointer = removePointer(event);
      if (pointer) {
        eventsQueue.push({ name: 'PointerLeave', pointerId: pointer.pointerId });
      }
    }

    function handleWheel(event: WheelEvent) {
      const { deltaX, deltaY } = event;
      eventsQueue.push({ name: 'Wheel', deltaX, deltaY });
    }
  }
})();
