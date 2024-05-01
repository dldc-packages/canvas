import type { SubscribeMethod } from '@dldc/pubsub';
import { createSubscription } from '@dldc/pubsub';
import type { IRect } from '../utils/Geometry';
import { HitView } from './HitView';
import type { IEvent, IEventAny, ILayerLifecycles, IPointers, THandled } from './Layer.types';

export interface IHitDrawParams {
  ctx: CanvasRenderingContext2D;
  rect: IRect;
}

export type THitDraw = (params: IHitDrawParams) => void;

export interface IHitResponder extends ILayerLifecycles {
  setDraw(draw: THitDraw): void;
  onPointerMove: SubscribeMethod<IEvent<'PointerMove'>>;
  onPointerEnter: SubscribeMethod<IEvent<'PointerEnter'>>;
  onPointerLeave: SubscribeMethod<IEvent<'PointerLeave'>>;
}

export const HitResponder = (() => {
  return { create };

  function create(): IHitResponder {
    const hitView = HitView.create();
    const hitRect: IRect = [0, 0, 1, 1];

    const pointerHit = new Map<number, boolean>();

    let draw: THitDraw | null = null;

    const pointerMoveSub = createSubscription<IEvent<'PointerMove'>>();
    const pointerEnterSub = createSubscription<IEvent<'PointerEnter'>>();
    const pointerLeaveSub = createSubscription<IEvent<'PointerLeave'>>();

    return {
      event,
      pointers,

      onPointerMove: pointerMoveSub.subscribe,
      onPointerEnter: pointerEnterSub.subscribe,
      onPointerLeave: pointerLeaveSub.subscribe,
      setDraw,
    };

    function pointers(pointers: IPointers): IPointers {
      if (!draw) {
        return pointers;
      }
      const drawFn = draw;
      const currentPointers = new Set(pointerHit.keys());
      const nextPointers = pointers.filter((pointer) => {
        currentPointers.delete(pointer.pointerId);
        const prevHit = pointerHit.get(pointer.pointerId) ?? false;
        const hit = hitTest(drawFn, pointer.x, pointer.y) !== null;
        const isEnter = !prevHit && hit;
        const isLeave = prevHit && !hit;
        if (hit !== prevHit) {
          pointerHit.set(pointer.pointerId, hit);
        }
        if (isEnter) {
          pointerEnterSub.emit({ name: 'PointerEnter', pointerId: pointer.pointerId });
        }
        if (isLeave) {
          pointerLeaveSub.emit({ name: 'PointerLeave', pointerId: pointer.pointerId });
        }
        return hit ? false : true;
      });
      // these pointers are no longer in the list
      currentPointers.forEach((pointerId) => {
        pointerHit.delete(pointerId);
        pointerLeaveSub.emit({ name: 'PointerLeave', pointerId });
      });
      return nextPointers;
    }

    function event(_event: IEventAny): THandled {
      return false;
      // if (!draw) {
      //   return;
      // }
      // if (event.name === 'PointerMove') {
      //   const hit = hitTest(draw, event.x, event.y);
      //   if (hit) {
      //     pointerMoveSub.emit(event);
      //   }
      // }
    }

    function setDraw(drawFn: THitDraw) {
      draw = drawFn;
    }

    function hitTest(draw: THitDraw, x: number, y: number): string | null {
      hitView.prepare(x, y);
      draw({ ctx: hitView.context, rect: hitRect });
      return hitView.getHitColor();
    }
  }
})();
