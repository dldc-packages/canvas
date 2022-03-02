export type CanvasOptions = {
  name?: string;
  width: number;
  height: number;
  styleWidth?: number;
  styleHeight?: number;
};

type Internal = {
  width: number;
  height: number;
  styleWidth: number;
  styleHeight: number;
};

/**
 * Manipulate a canvas element
 */
export class CanvasElement {
  private internal: Internal;

  public readonly element: HTMLCanvasElement;
  public readonly context: CanvasRenderingContext2D;
  public readonly name?: string;

  public get width(): number {
    return this.internal.width;
  }

  public get height(): number {
    return this.internal.height;
  }

  public get styleWidth(): number {
    return this.internal.styleWidth;
  }

  public get styleHeight(): number {
    return this.internal.styleHeight;
  }

  public setStyleSize(styleWidth: number, styleHeight: number): void {
    this.internal.styleWidth = styleWidth;
    this.internal.styleHeight = styleHeight;
    this.element.style.width = styleWidth + 'px';
    this.element.style.height = styleHeight + 'px';
  }

  public setSize(width: number, height: number): void {
    this.internal.width = width;
    this.internal.height = height;
    this.element.width = width;
    this.element.height = height;
  }

  constructor({ name, height, width, styleHeight = height, styleWidth = width }: CanvasOptions) {
    const canvas = document.createElement('canvas');
    canvas.style.padding = '0';
    canvas.style.margin = '0';
    canvas.style.border = '0';
    canvas.style.background = 'transparent';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = styleWidth + 'px';
    canvas.style.height = styleHeight + 'px';
    canvas.width = width;
    canvas.height = height;

    if (name) {
      canvas.setAttribute('data-name', name);
    }
    const context = canvas.getContext('2d')!;

    this.name = name;
    this.element = canvas;
    this.context = context;
    this.internal = { height, width, styleHeight, styleWidth };
  }
}
