import { batch, computed, effect, ReadonlySignal, signal } from '@preact/signals-core';
import { Geometry, IRect, ISize } from './Geometry';

interface Options {
  name?: string;
  target: HTMLElement;
}

const VALID_POSITIONS = ['relative', 'absolute', 'fixed', 'sticky'];

/**
 * A visible canvas synced to the size of the target element
 */
export interface IView {
  readonly $outerRect: ReadonlySignal<IRect>;
  readonly $innerRect: ReadonlySignal<IRect>;
  // readonly rect: Rect;
  // readonly rectRounded: Rect;
  // readonly view: Rect;
  // readonly viewVisible: Rect | false;
  // readonly viewport: Rect | null;
  // readonly pixelRatio: number;

  readonly container: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;

  update(): void;
  // reset transform and scale pixelRatio
  prepare(): void;
}

export const View = (() => {
  return create;

  function create({ target, name }: Options): IView {
    validateTargetPosition();

    // Canvas size and position in the page
    const $outerRect = signal<IRect>(Geometry.domRectToRect(target.getBoundingClientRect()));

    // How many pixels per "pixel"
    const $pixelRatio = signal<number>(window.devicePixelRatio);

    // like rect but with integer values only (rounded)
    const $outerRectRounded = computed(() => Geometry.Rect.round($outerRect.value));

    const $outerSize = computed<ISize>(() => {
      const [, , width, height] = $outerRect.value;
      return [width, height];
    });

    // same size outerRect because we apply scale to compensate for pixelRatio
    // position is always 0,0
    const $innerRect = computed<IRect>(() => {
      const [, , width, height] = $outerRectRounded.value;
      return [0, 0, width, height];
    });

    // available space inside the canvas (perfectRect * pixelRatio)
    const $innerPixelsRect = computed<IRect>(() => {
      const [, , width, height] = $outerRectRounded.value;
      const pixelRatio = $pixelRatio.value;
      return Geometry.Rect.scale([0, 0, width, height], pixelRatio);
    });

    // Part of the view that is visible (in the viewport)
    // const $innerView = computed<IRect | false>(() => {
    //   const [x, y, width, height] = $outerRectRounded.value;
    //   const offsetViewport = Geometry.Rect.offset(viewport.rect, -x, -y);
    //   const visibleRect = Geometry.Rect.clip([0, 0, width, height], offsetViewport) ?? false;
    //   if (visibleRect === false) {
    //     return false;
    //   }
    //   return Geometry.Rect.scale(visibleRect, $pixelRatio.value);
    // });

    const canvas = document.createElement('canvas');

    Object.assign(canvas.style, { padding: '0', margin: '0', border: '0' });
    Object.assign(canvas.style, { background: 'transparent', position: 'absolute', top: '0', left: '0' });

    if (name) {
      canvas.setAttribute('data-name', name);
    }
    const context = canvas.getContext('2d')!;

    effect(() => {
      const [outerWidth, outerHeight] = $outerSize.value;
      canvas.style.width = outerWidth + 'px';
      canvas.style.height = outerHeight + 'px';
    });

    effect(() => {
      const [, , innerWidth, innerHeight] = $innerPixelsRect.value;
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    });

    target.appendChild(canvas);

    return {
      $outerRect: $outerRectRounded,
      $innerRect,

      container: target,
      canvas,
      context,

      update,
      prepare,
    };

    function update() {
      batch(() => {
        const nextRect = Geometry.domRectToRect(target.getBoundingClientRect());
        if (Geometry.Rect.equal(nextRect, $outerRect.value) === false) {
          $outerRect.value = Geometry.domRectToRect(target.getBoundingClientRect());
        }
        if (window.devicePixelRatio !== $pixelRatio.value) {
          $pixelRatio.value = window.devicePixelRatio;
        }
      });
    }

    function prepare() {
      context.resetTransform();
      context.scale($pixelRatio.value, $pixelRatio.value);
    }

    function validateTargetPosition() {
      const elemStyles = window.getComputedStyle(target);
      if (!VALID_POSITIONS.includes(elemStyles.position)) {
        throw new Error(
          `Element should have one of the following position ${VALID_POSITIONS.join(', ')} ! ` +
            `It currently has ${elemStyles.position}`
        );
      }
    }
  }
})();
