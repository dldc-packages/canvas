import { CanvasElement } from './CanvasElement';
import { clipRect, offsetRect, Rect, rectsEqual, roundRect, scaleRect, Size } from '../utils/Rect';
import { IScheduler } from '../Scheduler';
import { convertDOMRectToRect } from '../utils/Utils';
import { Viewport } from '../utils/Viewport';
import { computed, effect, signal } from '@preact/signals-core';

interface Options {
  rect?: Rect;
  viewport?: Rect | null;
  pixelRatio?: number;
}

const VALID_POSITIONS = ['relative', 'absolute', 'fixed', 'sticky'];

export interface ICanvas {
  readonly rect: Rect;
  readonly rectRounded: Rect;
  readonly view: Rect;
  readonly viewVisible: Rect | false;
  readonly viewport: Rect | null;
  readonly pixelRatio: number;
  readonly element: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;

  update(options: Options): boolean;
  syncWithElement(container: HTMLElement, scheduler: IScheduler): void;
}

export const Canvas = (() => {
  return create;

  // { rect = [0, 0, 200, 200], viewport = null, pixelRatio = 1 }: Options = {}
  function create(options: Options = {}): ICanvas {
    // Canvas size (for example, the size of the canvas element)
    const $rect = signal<Rect>(options.rect ?? [0, 0, 200, 200]);
    // like rect but with integer values only (rounded)
    const $perfectRect = computed(() => roundRect($rect.value));
    // How many pixels per "pixel"
    const $pixelRatio = signal<number>(options.pixelRatio ?? 1);
    // Global viewport (window.innerWidth, window.innerHeight)
    const $viewport = signal<Rect | null>(options.viewport ?? null);
    // available space inside the canvas (perfectRect * pixelRatio)
    const $view = computed<Rect>(() => {
      const [, , width, height] = $perfectRect.value;
      return scaleRect([0, 0, width, height], $pixelRatio.value);
    });
    // size of view
    const $viewSize = computed<Size>(() => {
      const [, , width, height] = $view.value;
      return [width, height];
    });
    // Part of the view that is visible (in the viewport)
    const $viewVisible = computed<Rect | false>(() => {
      if ($viewport.value === null) {
        return $view.value;
      }
      const [x, y, width, height] = $perfectRect.value;
      const offsetViewport = offsetRect($viewport.value, -x, -y);
      const visibleRect = clipRect([0, 0, width, height], offsetViewport) ?? false;
      if (visibleRect === false) {
        return false;
      }
      return scaleRect(visibleRect, $pixelRatio.value);
    });

    const [, , styleWidth, styleHeight] = $rect.value;
    const [width, height] = $viewSize.value;
    const canvas = CanvasElement({ styleWidth, styleHeight, width, height });

    effect(function updateCanvasStyleSize() {
      const [, , styleWidth, styleHeight] = $rect.value;
      canvas.setStyleSize(styleWidth, styleHeight);
    });

    effect(function updateCanvasSize() {
      const [width, height] = $viewSize.value;
      canvas.setSize(width, height);
    });

    let synching = false;
    const element = canvas.element;
    const context = canvas.context;

    return {
      get rect() {
        return $rect.value;
      },
      get rectRounded() {
        return $perfectRect.value;
      },
      get view() {
        return $view.value;
      },
      get viewVisible() {
        return $viewVisible.value;
      },
      get viewport() {
        return $viewport.value;
      },
      get pixelRatio() {
        return $pixelRatio.value;
      },
      get element() {
        return element;
      },
      get context() {
        return context;
      },
      update,
      syncWithElement,
    };

    /**
     * Update rect, viewport and pixelRatio
     * @returns true if something changed
     */
    function update(options: Options): boolean {
      if (synching) {
        throw new Error('Cannot update canvas while synching');
      }
      return updateInternal(options);
    }

    /**
     * Synchronize the canvas with an element
     * It also add the canvas to the element
     */
    function syncWithElement(container: HTMLElement, scheduler: IScheduler) {
      if (synching) {
        throw new Error('Canvas is already synching');
      }
      synching = true;
      const elemStyles = window.getComputedStyle(container);
      if (!VALID_POSITIONS.includes(elemStyles.position)) {
        throw new Error(
          `Element should have one of the following position ${VALID_POSITIONS.join(', ')} ! It currently has ${
            elemStyles.position
          }`
        );
      }
      const rect = convertDOMRectToRect(container.getBoundingClientRect());
      const viewport = Viewport.instance.rect;
      const pixelRatio = window.devicePixelRatio;
      updateInternal({ rect, viewport, pixelRatio });
      container.appendChild(element);
      const unsub = scheduler.onUpdate(() => {
        const rect = convertDOMRectToRect(container.getBoundingClientRect());
        const viewport = Viewport.instance.rect;
        const pixelRatio = window.devicePixelRatio;
        const changed = updateInternal({ rect, viewport, pixelRatio });
        if (changed) {
          scheduler.requestFrameRender($view.value);
        }
      });

      return () => {
        unsub();
        container.removeChild(element);
        synching = true;
      };
    }

    function updateInternal(options: Options): boolean {
      let changed = false;
      if (options.rect && rectsEqual($rect.value, options.rect) === false) {
        $rect.value = options.rect;
        changed = true;
      }
      if (options.viewport && rectsEqual($viewport.value, options.viewport) === false) {
        $viewport.value = options.viewport;
        changed = true;
      }
      if (options.pixelRatio && options.pixelRatio !== $pixelRatio.value) {
        $pixelRatio.value = options.pixelRatio;
        changed = true;
      }
      return changed;
    }
  }
})();
