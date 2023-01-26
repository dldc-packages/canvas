import { batch, computed, signal } from '@preact/signals-core';
import { Rect } from './Rect';

export interface IViewport {
  readonly width: number;
  readonly height: number;
  readonly rect: Rect;
}

/**
 * Observable Singleton to get the size of the viewport
 * Usage: const viewport = Wiewport.instance;
 */
export const Viewport = (() => {
  const instance = createInstance();

  return {
    instance,
    createInstance,
  };

  function createInstance(): IViewport {
    const $width = signal(window.innerWidth);
    const $height = signal(window.innerHeight);
    const $rect = computed<Rect>(() => [0, 0, $width.value, $height.value]);

    window.addEventListener('resize', () => {
      batch(() => {
        $width.value = window.innerWidth;
        $height.value = window.innerHeight;
      });
    });

    return {
      get rect(): Rect {
        return $rect.value;
      },
      get width() {
        return $width.value;
      },
      get height() {
        return $height.value;
      },
    };
  }
})();
