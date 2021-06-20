import { Rect } from './Rect';

export type Draw = (t: number, rects: Array<Rect>) => void;

export type Renderable = {
  draw: Draw;
  drawHit: Draw;
};
