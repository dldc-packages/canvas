import { WindowSize } from './WindowSize';

const DEVICE_PIXEL_RATIO = window.devicePixelRatio;

export interface Canvas {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  setSize(width: number, height: number): void;
}

interface CanvasOptions {
  width: number;
  height: number;
  pixelRatio?: number;
  name?: string;
}

export function Canvas(options: CanvasOptions): Canvas {
  const config = { pixelRatio: DEVICE_PIXEL_RATIO, ...options };
  const canvas = document.createElement('canvas');

  canvas.style.padding = '0';
  canvas.style.margin = '0';
  canvas.style.border = '0';
  canvas.style.background = 'transparent';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  if (options.name) {
    canvas.setAttribute('data-name', options.name);
  }

  const clk = canvas.getContext('2d')!;

  applySize();

  return { ctx: clk, canvas, setSize };

  function setSize(width: number, height: number) {
    config.width = width;
    config.height = height;
    applySize();
  }

  function applySize() {
    canvas.width = config.width * config.pixelRatio;
    canvas.height = config.height * config.pixelRatio;
    canvas.style.width = config.width + 'px';
    canvas.style.height = config.height + 'px';
    clk.scale(config.pixelRatio, config.pixelRatio);
  }
}

export interface ScreenCanvas {
  ctx: CanvasRenderingContext2D;
  canvasEl: HTMLCanvasElement;
}

export function ScreenCanvas(options: {
  windowSize: WindowSize;
  name?: string;
  pixelRatio?: number;
}): ScreenCanvas {
  const { pixelRatio = DEVICE_PIXEL_RATIO, windowSize, name } = options;

  const { width, height } = windowSize.get();

  const canvas = Canvas({ width, height, pixelRatio, name });

  windowSize.subscribe(() => {
    const { width, height } = windowSize.get();
    canvas.setSize(width, height);
  });

  canvas.setSize(width, height);

  return { ctx: canvas.ctx, canvasEl: canvas.canvas };
}
