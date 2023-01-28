export type Unregister = () => void;

export interface HitObject<T> {
  register(value: T): Unregister;
  responders: Set<T>;
  color: string;
}

export interface IHitView {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  prepare(x: number, y: number): void;
  getHitColor(): string | null;
}

export const HitView = (() => {
  return { create };

  function create(): IHitView {
    const canvas = document.createElement('canvas');
    Object.assign(canvas, { width: 1, height: 1 });
    // need to cast to CanvasRenderingContext2D because DTS fails to build types otherwise
    const context = canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D;

    return { canvas, context, prepare, getHitColor };

    function prepare(x: number, y: number): void {
      context.resetTransform();
      context.clearRect(0, 0, 1, 1);
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
      context.translate(-x, -y);
      context.fillStyle = '#000000';
      context.strokeStyle = '#000000';
    }

    function getHitColor(): string | null {
      const res = context.getImageData(0, 0, 1, 1);
      const r = res.data[0];
      const g = res.data[1];
      const b = res.data[2];
      const a = res.data[3];
      const color = a === 0 ? null : '#' + ('000000' + ((r << 16) | (g << 8) | b).toString(16)).slice(-6);
      return color;
    }
  }
})();
