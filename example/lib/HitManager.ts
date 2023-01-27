import { IRect } from './Geometry';
import { Random } from './Random';

export type Unregister = () => void;

export interface HitObject<T> {
  register(value: T): Unregister;
  responders: Set<T>;
  color: string;
}

type Draw = (t: number, rect: IRect) => void;

export type HitFn<T> = (draw: Draw, time: number, pointerId: number, x: number, y: number) => Set<T> | undefined;

export interface IHitManager<T> {
  readonly hit: HitFn<T>;
  create(): HitObject<T>;
}

export const HitManager = (() => {
  return { create, merge };

  function create<T>(): IHitManager<T> {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const getColor = Random.sequenceOfUniqueColor();
    const valuesMap = new Map<string, Set<T>>();

    let currentTime = 0;
    let pointersCache: Map<number, { x: number; y: number; color: string | null }> = new Map();

    return {
      hit,
      create,
    };

    function hit(draw: Draw, time: number, pointerId: number, x: number, y: number) {
      if (time !== currentTime) {
        // time changed, clear pointer cache
        currentTime = time;
        pointersCache = new Map();
      }
      const color = getHitColor(draw, time, pointerId, x, y);
      if (color) {
        return valuesMap.get(color);
      }
      return undefined;
    }

    function create(): HitObject<T> {
      const color = getColor();
      const values = new Set<T>();
      valuesMap.set(color, values);
      return {
        register(value: T) {
          values.add(value);
          return () => {
            values.delete(value);
          };
        },
        responders: values,
        color,
      };
    }

    function getHitColor(draw: Draw, time: number, pointerId: number, x: number, y: number): string | null {
      const cache = pointersCache.get(pointerId);
      if (cache && cache.x === x && cache.y === y) {
        return cache.color;
      }
      context.resetTransform();
      context.clearRect(0, 0, 1, 1);
      context.translate(-x, -y);
      draw(time, [x, y, 1, 1]);
      const res = context.getImageData(0, 0, 1, 1);
      const r = res.data[0];
      const g = res.data[1];
      const b = res.data[2];
      const o = res.data[3];
      const color = o === 0 ? null : '#' + ('000000' + ((r << 16) | (g << 8) | b).toString(16)).slice(-6);
      pointersCache.set(pointerId, { x, y, color });
      return color;
    }
  }

  function merge<T>(...managers: Array<IHitManager<T>>): HitFn<T> {
    return (draw, time, pointerId, x, y) => {
      for (let i = 0; i < managers.length; i++) {
        const result = managers[i].hit(draw, time, pointerId, x, y);
        if (result) {
          return result;
        }
      }
      return undefined;
    };
  }
})();
