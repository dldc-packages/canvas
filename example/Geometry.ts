export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

function distanceSq(p1: Point, p2: Point): number {
  return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(distanceSq(p1, p2));
}

export function movePointToward(p1: Point, p2: Point, dist: number): Point {
  const full = distance(p1, p2);
  const ratio = dist / full;
  return { x: p1.x + (p2.x - p1.x) * ratio, y: p1.y + (p2.y - p1.y) * ratio };
}

export function getLineLength(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

export function getPointOnEllipticalArc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  theta: number,
  psi: number
): Point {
  const cosPsi = Math.cos(psi);
  const sinPsi = Math.sin(psi);
  const pt: Point = {
    x: rx * Math.cos(theta),
    y: ry * Math.sin(theta),
  };
  return {
    x: cx + (pt.x * cosPsi - pt.y * sinPsi),
    y: cy + (pt.x * sinPsi + pt.y * cosPsi),
  };
}

function CB1(t: number) {
  return t * t * t;
}

function CB2(t: number) {
  return 3 * t * t * (1 - t);
}

function CB3(t: number) {
  return 3 * t * (1 - t) * (1 - t);
}

function CB4(t: number) {
  return (1 - t) * (1 - t) * (1 - t);
}

export function getPointOnCubicBezier(
  pct: number,
  P1x: number,
  P1y: number,
  P2x: number,
  P2y: number,
  P3x: number,
  P3y: number,
  P4x: number,
  P4y: number
) {
  const x = P4x * CB1(pct) + P3x * CB2(pct) + P2x * CB3(pct) + P1x * CB4(pct);
  const y = P4y * CB1(pct) + P3y * CB2(pct) + P2y * CB3(pct) + P1y * CB4(pct);

  return {
    x: x,
    y: y,
  };
}

function QB1(t: number) {
  return t * t;
}

function QB2(t: number) {
  return 2 * t * (1 - t);
}

function QB3(t: number) {
  return (1 - t) * (1 - t);
}

export function getPointOnQuadraticBezier(
  pct: number,
  P1x: number,
  P1y: number,
  P2x: number,
  P2y: number,
  P3x: number,
  P3y: number
) {
  const x = P3x * QB1(pct) + P2x * QB2(pct) + P1x * QB3(pct);
  const y = P3y * QB1(pct) + P2y * QB2(pct) + P1y * QB3(pct);

  return {
    x: x,
    y: y,
  };
}

export type SidesConfig = {
  all?: number;
  vertical?: number;
  horizontal?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export type Sides = number | SidesConfig;

export type SidesConfigResolved = { top: number; bottom: number; left: number; right: number };

export function resolveSidesConfig(config: Sides): SidesConfigResolved {
  if (typeof config === 'number') {
    return {
      top: config,
      bottom: config,
      left: config,
      right: config,
    };
  }
  const top = config.top ?? config.vertical ?? config.all ?? 0;
  const bottom = config.bottom ?? config.vertical ?? config.all ?? 0;
  const left = config.left ?? config.horizontal ?? config.all ?? 0;
  const right = config.right ?? config.horizontal ?? config.all ?? 0;
  return { top, right, bottom, left };
}

export type Rect = [number, number, number, number];

export function rectHasIntersect(r1: Rect, r2: Rect): boolean {
  return (
    r2[0] + r2[2] > r1[0] && r2[1] + r2[3] > r1[1] && r2[0] < r1[0] + r1[2] && r2[1] < r1[1] + r1[3]
  );
}

export function rectIntersect(r1: Rect, r2: Rect): Rect {
  const x1 = Math.max(r1[0], r2[0]);
  const y1 = Math.max(r1[1], r2[1]);
  const x2 = Math.min(r1[0] + r1[2], r2[0] + r2[2]);
  const y2 = Math.min(r1[1] + r1[3], r2[1] + r2[3]);
  return [x1, y1, x2 - x1, y2 - y1];
}

export function rectIntersectWithOneOf(rect: Rect, rects: Array<Rect>): boolean {
  return rects.some((r) => rectHasIntersect(r, rect));
}

export function rectFilterIntersect(rect: Rect, rects: Array<Rect>): Array<Rect> {
  return rects.filter((r) => rectHasIntersect(r, rect));
}

export function mergeRects(r1: Rect, r2: Rect): Rect {
  const r1Right = r1[0] + r1[2];
  const r2Right = r2[0] + r2[2];
  const r1Bottom = r1[1] + r1[3];
  const r2Bottom = r2[1] + r2[3];
  const x = r1[0] < r2[0] ? r1[0] : r2[0];
  const y = r1[1] < r2[1] ? r1[1] : r2[1];
  const right = r1Right > r2Right ? r1Right : r2Right;
  const bottom = r1Bottom > r2Bottom ? r1Bottom : r2Bottom;
  return [x, y, right - x, bottom - y];
}

export function mergeIntersectingRects(rects: Array<Rect>): Array<Rect> {
  let queue: Array<Rect> = [...rects];
  let result: Array<Rect> = [];
  while (queue.length > 0) {
    const rect = queue.shift()!;
    const intersects = result.filter((r) => rectHasIntersect(r, rect));
    if (intersects.length === 0) {
      result.push(rect);
    } else {
      const rest = result.filter((r) => intersects.indexOf(r) === -1);
      const merged = intersects.reduce((acc, item) => mergeRects(acc, item), rect);
      queue.push(merged, ...rest);
      result = [];
    }
  }
  return result;
}

export function rectsEqual(left: Rect, right: Rect): boolean {
  return (
    left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[3] === right[3]
  );
}

export function sliceRectSize(rect: Rect): [number, number] {
  return [rect[2], rect[3]];
}

export function sliceRectPosition(rect: Rect): [number, number] {
  return [rect[0], rect[1]];
}

export function offsetRect(rect: Rect, x: number, y: number): Rect {
  return [rect[0] + x, rect[1] + y, rect[2], rect[3]];
}

export function rectsPositionEqual(left: Rect, right: Rect): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

export function rectsSizeEqual(left: Rect, right: Rect): boolean {
  return left[2] === right[2] && left[3] === right[3];
}

export function expandRect(rect: Rect, size: Sides): Rect {
  const [x, y, width, height] = rect;
  const { top, right, bottom, left } = resolveSidesConfig(size);
  return [x - left, y - top, width + left + right, height + top + bottom];
}
