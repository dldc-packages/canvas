import type {
  ILayerLifecycles,
  IPointers,
  TLayerLifecyclesMutable,
} from "./Layer.types.ts";

/**
 * Combine multiple layers into one
 * Draw is first to last
 * Event is last to first
 */
export function mergeLayers(
  ...layersLifecycles: ILayerLifecycles[]
): ILayerLifecycles {
  const merged: TLayerLifecyclesMutable = {};
  const events = layersLifecycles
    .map((l) => l.event)
    .filter(isNotNil)
    .reverse(); // reverse to dispatch to top layer first
  if (events.length > 0) {
    merged.event = (event) =>
      events.reduce<boolean>((acc, e) => !acc && e(event), false);
  }
  const pointersLifecycles = layersLifecycles
    .map((l) => l.pointers)
    .filter(isNotNil)
    .reverse(); // reverse to dispatch to top layer first
  if (pointersLifecycles.length > 0) {
    merged.pointers = (pointers) =>
      pointersLifecycles.reduce<IPointers>(
        (pointers, fn) => fn(pointers),
        pointers,
      );
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
