export type IRect = readonly [x: number, y: number, width: number, height: number];
export type IBox = readonly [left: number, top: number, right: number, bottom: number];
export type ISize = readonly [width: number, height: number];
export type IPosition = readonly [x: number, y: number];

export const Geometry = (() => {
  return {
    domRectToRect,
    Rect: {
      round: roundRect,
      scale: scaleRect,
      offset: offsetRect,
      clip: clipRect,
      intersect: intersectRect,
      equal: rectsEqual,
      expand: expandRect,
    },
  };

  function roundRect(rect: IRect): IRect {
    const right = Math.round(rect[0] + rect[2]);
    const bottom = Math.round(rect[1] + rect[3]);
    const left = Math.round(rect[0]);
    const top = Math.round(rect[1]);
    const result: IRect = [left, top, right - left, bottom - top];
    return result;
  }

  function intersectRect(r1: IRect, r2: IRect): IRect {
    const x1 = Math.max(r1[0], r2[0]);
    const y1 = Math.max(r1[1], r2[1]);
    const x2 = Math.min(r1[0] + r1[2], r2[0] + r2[2]);
    const y2 = Math.min(r1[1] + r1[3], r2[1] + r2[3]);
    return [x1, y1, x2 - x1, y2 - y1];
  }

  function offsetRect(rect: IRect, x: number, y: number): IRect {
    return [rect[0] + x, rect[1] + y, rect[2], rect[3]];
  }

  function clipRect(rect: IRect, clip: IRect): IRect | null {
    const inter = intersectRect(rect, clip);
    const [, , width, height] = inter;
    if (width <= 0 || height <= 0) {
      return null;
    }
    if (rectsEqual(inter, rect)) {
      return rect;
    }
    return inter;
  }

  function rectsEqual(left: IRect | null, right: IRect | null): boolean {
    if (left === null || right === null) {
      return left === right;
    }
    return left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[3] === right[3];
  }

  function scaleRect(rect: IRect, scale: number): IRect {
    return [rect[0] * scale, rect[1] * scale, rect[2] * scale, rect[3] * scale];
  }

  function expandRect(rect: IRect, margin: number): IRect {
    return [rect[0] - margin, rect[1] - margin, rect[2] + 2 * margin, rect[3] + 2 * margin];
  }

  function domRectToRect(rect: DOMRect): IRect {
    return [rect.x, rect.y, rect.width, rect.height];
  }
})();
