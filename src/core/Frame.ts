import type { IRect, ISize } from '../utils/Geometry';
import { Geometry } from '../utils/Geometry';

interface Options {
  name?: string;
  target: HTMLElement;
}

const VALID_POSITIONS = ['relative', 'absolute', 'fixed', 'sticky'];

/**
 * A visible canvas synced to the size of the target element
 */
export interface IFrame {
  /**
   * Canvas size and position in the page
   */
  readonly outerSize: ISize;
  /**
   * View inside the canvas. Origin is always 0,0. Size is outerSize * pixelRatio
   */
  readonly view: IRect;
  /**
   * Pixel ratio of the canvas
   */
  readonly pixelRatio: number;

  readonly container: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;

  // Returns true if the view has changed
  update(): boolean;
  destroy(): void;
}

export const Frame = (() => {
  return create;

  function create({ target, name }: Options): IFrame {
    validateTargetPosition();

    const canvas = document.createElement('canvas');

    Object.assign(canvas.style, { padding: '0', margin: '0', border: '0' });
    Object.assign(canvas.style, { background: 'transparent', position: 'absolute', top: '0', left: '0' });

    if (name) {
      canvas.setAttribute('data-name', name);
    }
    const context = canvas.getContext('2d')!;

    let elemSize: ISize = [0, 0];
    let pixelRatio = 1;

    let view: IRect = [0, 0, 0, 0];
    let outerSize: ISize = [0, 0];

    update();

    target.appendChild(canvas);

    return {
      get outerSize() {
        return outerSize;
      },
      get view() {
        return view;
      },
      get pixelRatio() {
        return pixelRatio;
      },

      container: target,
      canvas,
      context,

      update,
      destroy,
    };

    function destroy() {
      target.removeChild(canvas);
    }

    function update(): boolean {
      const nextElemSize = Geometry.Size.fromDomRect(target.getBoundingClientRect());
      const nextPixelRatio = window.devicePixelRatio;
      if (Geometry.Size.equal(nextElemSize, elemSize) && nextPixelRatio === pixelRatio) {
        return false;
      }
      pixelRatio = nextPixelRatio;
      elemSize = nextElemSize;

      const innerSize = Geometry.Size.round(Geometry.Size.scale(elemSize, pixelRatio));
      outerSize = Geometry.Size.scale(innerSize, 1 / pixelRatio);

      const [outerWidth, outerHeight] = outerSize;
      const [innerWidth, innerHeight] = innerSize;
      view = [0, 0, innerWidth, innerHeight];

      canvas.style.width = outerWidth + 'px';
      canvas.style.height = outerHeight + 'px';
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      return true;
    }

    function validateTargetPosition() {
      const elemStyles = window.getComputedStyle(target);
      if (!VALID_POSITIONS.includes(elemStyles.position)) {
        throw new Error(
          `Element should have one of the following position ${VALID_POSITIONS.join(', ')} ! ` +
            `It currently has ${elemStyles.position}`,
        );
      }
    }
  }
})();
