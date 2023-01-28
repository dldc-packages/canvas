import { SubscribeMethod, Subscription } from 'suub';
import { IRect } from './Geometry';
import { HitView } from './HitView';
import { Handled, IEvent, IEventAny, ILayerLifecycles, IPointers } from './Layer';

export type HitDrawParams = { ctx: CanvasRenderingContext2D; rect: IRect };

export type HitDraw = (params: HitDrawParams) => void;

export interface IHitResponder extends ILayerLifecycles {
  setDraw(draw: HitDraw): void;
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

    let draw: HitDraw | null = null;

    const pointerMoveSub = Subscription<IEvent<'PointerMove'>>();
    const pointerEnterSub = Subscription<IEvent<'PointerEnter'>>();
    const pointerLeaveSub = Subscription<IEvent<'PointerLeave'>>();

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

    function event(_event: IEventAny): Handled {
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

    function setDraw(drawFn: HitDraw) {
      draw = drawFn;
    }

    function hitTest(draw: HitDraw, x: number, y: number): string | null {
      hitView.prepare(x, y);
      draw({ ctx: hitView.context, rect: hitRect });
      return hitView.getHitColor();
    }
  }
})();
