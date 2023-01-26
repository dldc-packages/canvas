import { batch, computed, effect, signal } from '@preact/signals-core';

export type CanvasOptions = {
  name?: string;
  width: number;
  height: number;
  styleWidth?: number;
  styleHeight?: number;
};

export interface ICanvasElement {
  readonly element: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly name?: string;

  readonly width: number;
  readonly height: number;
  readonly styleWidth: number;
  readonly styleHeight: number;

  setStyleSize(styleWidth: number, styleHeight: number): void;
  setSize(width: number, height: number): void;
}

/**
 * Manipulate a canvas element
 */
export const CanvasElement = (() => {
  return create;

  //
  function create({ name, height, width, styleHeight, styleWidth }: CanvasOptions): ICanvasElement {
    const $width = signal<number>(width);
    const $height = signal<number>(height);
    const $styleWidth = signal<number | null>(styleWidth ?? null);
    const $styleHeight = signal<number | null>(styleHeight ?? null);

    const $styleWidthResolved = computed(() => $styleWidth.value ?? $width.value);
    const $styleHeightResolved = computed(() => $styleHeight.value ?? $height.value);

    const canvas = document.createElement('canvas');

    canvas.style.padding = '0';
    canvas.style.margin = '0';
    canvas.style.border = '0';
    canvas.style.background = 'transparent';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    if (name) {
      canvas.setAttribute('data-name', name);
    }
    const context = canvas.getContext('2d')!;

    effect(() => {
      canvas.style.width = $styleWidthResolved.value + 'px';
      canvas.style.height = $styleHeightResolved.value + 'px';
      canvas.width = $width.value;
      canvas.height = $height.value;
    });

    return {
      name,
      element: canvas,
      context,
      get width() {
        return $width.value;
      },
      get height() {
        return $height.value;
      },
      get styleWidth() {
        return $styleWidthResolved.value;
      },
      get styleHeight() {
        return $styleHeightResolved.value;
      },
      setSize,
      setStyleSize,
    };

    function setStyleSize(styleWidth: number, styleHeight: number): void {
      batch(() => {
        $styleWidth.value = styleWidth;
        $styleHeight.value = styleHeight;
      });
    }

    function setSize(width: number, height: number): void {
      batch(() => {
        $width.value = width;
        $height.value = height;
      });
    }
  }
})();
