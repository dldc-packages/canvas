import {
  PointerActiveEvent,
  PointerHoverEventPointer,
  ZenWheelEvent,
  EventsManager,
  PointerHoverEvent,
} from '../src/EventsManager';
import { HitFn } from '../src/types';
export const STOP_PROPAGATION = Symbol('STOP_PROPAGATION');

export type StoppableHanlderResult = void | null | undefined | typeof STOP_PROPAGATION;

export interface EventsResponder {
  onPointer?: (event: PointerActiveEvent) => void;
  onHoverEnter?: (event: PointerHoverEvent) => void;
  onHoverMove?: (event: PointerHoverEvent) => void;
  onHoverLeave?: (event: PointerHoverEvent) => void;
  onWheel?: (event: ZenWheelEvent) => StoppableHanlderResult;
}

const INTERNAL = Symbol('INTERNAL');

export interface EventsResponderItem {
  child(responder: EventsResponder): EventsResponderItem;
  [INTERNAL]: Array<EventsResponder>;
}

export function EventsResponderItem(
  parents: Array<EventsResponder>,
  responder: EventsResponder
): EventsResponderItem {
  const chain: Array<EventsResponder> = [responder, ...parents];
  const item: EventsResponderItem = {
    child(responder) {
      return EventsResponderItem(chain, responder);
    },
    [INTERNAL]: chain,
  };
  return item;
}

export interface EventsResponderManager extends EventsResponderItem {
  update(): void;
  render(): void;
}

export function EventsResponderManager(
  hit: HitFn<EventsResponderItem>,
  el: HTMLElement
): EventsResponderManager {
  const eventManager = new EventsManager(el);
  // {
  //   onActivePointer(event) {
  //     const item = hit(event.pointerId, event.x, event.y);
  //     if (item) {
  //       onPointer(item, event);
  //     }
  //   },
  //   onPointerMove() {
  //     hoverUpdateRequested = true;
  //   },
  //   onWheel(event) {
  //     const item = hit(event.pointerId, event.x, event.y);
  //     if (item) {
  //       onWheel(item, event);
  //     }
  //   }
  // }

  const rootItem: EventsResponderItem = {
    child(responder) {
      const item = EventsResponderItem([], responder);
      return item;
    },
    [INTERNAL]: [],
  };

  let hoverUpdateRequested = false;

  let prevHovers: Map<EventsResponder, Array<PointerHoverEventPointer>> = new Map();
  let currentHovers: Map<EventsResponder, Array<PointerHoverEventPointer>> = new Map();

  return {
    ...rootItem,
    update,
    render,
  };

  function render() {
    hoverUpdateRequested = true;
  }

  function update() {
    // if pointer moved or render last frame
    if (hoverUpdateRequested) {
      clearHover();
      eventManager.getPointers().forEach((pointer) => {
        const item = hit(pointer.pointerId, pointer.x, pointer.y);
        if (item) {
          dispatchHover(item, pointer);
        }
      });
      commitHover();
      // reset for next frame
      hoverUpdateRequested = false;
    }
  }

  function onPointer(responders: Set<EventsResponderItem>, event: PointerActiveEvent): void {
    responders.forEach((responder) => {
      const chain = responder[INTERNAL];
      chain.forEach((responder) => {
        if (responder.onPointer) {
          responder.onPointer(event);
        }
      });
    });
  }

  function onWheel(responders: Set<EventsResponderItem>, event: ZenWheelEvent): void {
    responders.forEach((responder) => {
      const chain = responder[INTERNAL];
      for (let i = 0; i < chain.length; i++) {
        const responder = chain[i];
        if (responder.onWheel) {
          const res = responder.onWheel(event);
          if (res === STOP_PROPAGATION) {
            break;
          }
        }
      }
    });
  }

  function clearHover(): void {
    prevHovers = currentHovers;
    currentHovers = new Map();
  }

  function dispatchHover(
    responders: Set<EventsResponderItem>,
    pointer: PointerHoverEventPointer
  ): void {
    responders.forEach((responder) => {
      const chain = responder[INTERNAL];
      chain.forEach((item) => {
        if (!item.onHoverEnter && !item.onHoverMove && !item.onHoverLeave) {
          // no hover watcher => skip
          return;
        }
        if (currentHovers.has(item)) {
          currentHovers.get(item)!.push(pointer);
        } else {
          currentHovers.set(item, [pointer]);
        }
      });
    });
  }

  function commitHover(): void {
    const all = new Set([...Array.from(prevHovers.keys()), ...Array.from(currentHovers.keys())]);
    all.forEach((item) => {
      const prev = prevHovers.get(item);
      const current = currentHovers.get(item);
      if (!prev && current && item.onHoverEnter) {
        // enter
        item.onHoverEnter({ pointers: current });
        return;
      }
      if (prev && current && item.onHoverMove) {
        // update
        item.onHoverMove({ pointers: current });
        return;
      }
      if (prev && !current && item.onHoverLeave) {
        // leave
        item.onHoverLeave({ pointers: [] });
        return;
      }
      return;
    });
  }
}
