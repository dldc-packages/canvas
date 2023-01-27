import { IRect } from './Geometry';
import { Random } from './Random';

export type Unregister = () => void;

export interface HitObject<T> {
  register(value: T): Unregister;
  responders: Set<T>;
  color: string;
}

type Draw = (t: number, rect: IRect) => void;

export type HitFn = (draw: Draw, time: number, x: number, y: number) => string | null;

export interface IHitView {
  readonly hit: HitFn;
  getNextColor(): string;
}

export const HitView = (() => {
  return { create };

  function create(): IHitView {
    const canvas = document.createElement('canvas');
    Object.assign(canvas, { width: 1, height: 1 });
    const context = canvas.getContext('2d')!;
    const getNextColor = Random.sequenceOfUniqueColor();

    return { hit, getNextColor };

    function hit(draw: Draw, time: number, x: number, y: number): string | null {
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
      return color;
    }
  }
})();
