import { Grid } from './Grid';
import { Transform } from './Transform';
import { expectNever } from './Utils';

export type Rect = readonly [x: number, y: number, width: number, height: number];
export type Box = readonly [left: number, top: number, right: number, bottom: number];
export type Size = readonly [width: number, height: number];
export type Position = readonly [x: number, y: number];

export function rectHasIntersect(r1: Rect, r2: Rect): boolean {
  return (
    r2[0] + r2[2] > r1[0] && r2[1] + r2[3] > r1[1] && r2[0] < r1[0] + r1[2] && r2[1] < r1[1] + r1[3]
  );
}

export function sliceRectSize(rect: Rect): Size {
  return [rect[2], rect[3]];
}

export function sliceRectPosition(rect: Rect): Position {
  return [rect[0], rect[1]];
}

export function rectIntersect(r1: Rect, r2: Rect): Rect {
  const x1 = Math.max(r1[0], r2[0]);
  const y1 = Math.max(r1[1], r2[1]);
  const x2 = Math.min(r1[0] + r1[2], r2[0] + r2[2]);
  const y2 = Math.min(r1[1] + r1[3], r2[1] + r2[3]);
  return [x1, y1, x2 - x1, y2 - y1];
}

export function clipRect(rect: Rect, clip: Rect): Rect | null {
  const inter = rectIntersect(rect, clip);
  const [, , width, height] = inter;
  if (width <= 0 || height <= 0) {
    return null;
  }
  if (rectsEqual(inter, rect)) {
    return rect;
  }
  return inter;
}

// Return prev ref if same
export function replaceRect(prev: Rect, next: Rect): Rect {
  if (prev[0] === next[0] && prev[1] === next[1] && prev[2] === next[2] && prev[3] === next[3]) {
    return prev;
  }
  return next;
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

export function rectsEqual(left: Rect | null, right: Rect | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  return (
    left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[3] === right[3]
  );
}

export function scaleRect(rect: Rect, scale: number): Rect {
  return [rect[0] * scale, rect[1] * scale, rect[2] * scale, rect[3] * scale];
}

export function expandRect(rect: Rect, margin: number): Rect {
  return [rect[0] - margin, rect[1] - margin, rect[2] + 2 * margin, rect[3] + 2 * margin];
}

export function roundRect(rect: Rect): Rect {
  const right = Math.round(rect[0] + rect[2]);
  const bottom = Math.round(rect[1] + rect[3]);
  const left = Math.round(rect[0]);
  const top = Math.round(rect[1]);
  const result: Rect = [left, top, right - left, bottom - top];
  return result;
}

export function offsetRect(rect: Rect, x: number, y: number): Rect {
  return [rect[0] + x, rect[1] + y, rect[2], rect[3]];
}

export function rectToBox(rect: Rect): Box {
  const [x, y, w, h] = rect;
  return [x, y, x + w, y + h];
}

export function boxToRect(box: Box): Rect {
  const [left, top, right, bottom] = box;
  return [left, top, right - left, bottom - top];
}

function extractIndexes(sortedValues: Array<number>, min: number, max: number): Array<number> {
  const minIndex = sortedValues.indexOf(min);
  const maxIndex = sortedValues.indexOf(max);
  if (minIndex === -1 || maxIndex === -1) {
    throw new Error('Invalid min / max');
  }
  const size = maxIndex - minIndex;
  return Array.from({ length: size })
    .fill(null)
    .map((_, i) => minIndex + i);
}

export function mergeOverlapingRects(rects: Array<Rect>): Array<Rect> {
  if (rects.length == 0) {
    return [];
  }
  const hSplits = new Set<number>();
  const vSplits = new Set<number>();
  const boxes = rects.filter(([, , w, h]) => w > 0 && h > 0).map(rectToBox);
  boxes.forEach(([left, top, right, bottom]) => {
    hSplits.add(left);
    hSplits.add(right);
    vSplits.add(top);
    vSplits.add(bottom);
  });
  const h = Array.from(hSplits).sort((l, r) => l - r);
  const v = Array.from(vSplits).sort((l, r) => l - r);
  const hSize = h.length - 1;
  const vSize = v.length - 1;
  const grid = new Grid<null | number>({ width: hSize, height: vSize, defaultValue: null });
  let nextBoxIndex = 0;
  boxes.forEach(([left, top, right, bottom]) => {
    const hIndexes = extractIndexes(h, left, right);
    const vIndexes = extractIndexes(v, top, bottom);
    hIndexes.forEach((xi) => {
      vIndexes.forEach((yi) => {
        if (grid.get(xi, yi) === null) {
          grid.set(xi, yi, nextBoxIndex++);
        }
      });
    });
  });
  let changed = true;
  while (changed === true) {
    changed = expandCell(grid, 'horizontal');
  }
  changed = true;
  while (changed === true) {
    changed = expandCell(grid, 'vertical');
  }
  const gridBoxes: Array<Box> = [];
  const handled = new Set<number>();
  grid.forEach((num, i) => {
    if (num === null || handled.has(num)) {
      return;
    }
    handled.add(num);
    const cell = grid.findRect(...grid.coordsFromIndex(i));
    if (cell === null) {
      return;
    }
    const [x, y, width, height] = cell;
    gridBoxes.push([h[x], v[y], h[x + width], v[y + height]]);
  });
  return gridBoxes.map(boxToRect);

  // return wether the grid was changed or not
  function expandCell(grid: Grid<null | number>, direction: 'horizontal' | 'vertical'): boolean {
    const handled = new Set<number>();
    for (let i = 0; i < grid.data.length; i++) {
      const num = grid.data[i];
      if (num === null || handled.has(num)) {
        continue;
      }
      handled.add(num);
      const cell = grid.findRect(...grid.coordsFromIndex(i));
      if (cell === null) {
        continue;
      }
      const [x, y, w, h] = cell;
      const neighborCell =
        direction === 'horizontal' ? grid.findRect(x + w, y) : grid.findRect(x, y + h);
      if (neighborCell === null) {
        continue;
      }
      if (rectsArePerfectNeighbors(cell, neighborCell)) {
        grid.setRect(neighborCell, num);
        return true;
      }
    }
    return false;
  }
}

export function rectsArePerfectNeighbors([x1, y1, w1, h1]: Rect, [x2, y2, w2, h2]: Rect): boolean {
  return (
    // isTop
    (w1 === w2 && x1 === x2 && y1 === y2 - h2) ||
    // isBottom
    (w1 === w2 && x1 === x2 && y1 + h1 === y2) ||
    // isLeft
    (h1 === h2 && y1 === y2 && x1 + w1 === x2) ||
    // isRight
    (h1 === h2 && y1 === y2 && x2 + w2 === x1)
  );
}

export function transformRect(rect: Rect, transform: Transform): Rect {
  let current = rect;
  transform.forEach((step) => {
    if (step.type === 'translate') {
      const [x, y, w, h] = current;
      current = [x + step.x, y + step.y, w, h];
      return;
    }
    if (step.type === 'scale') {
      const [x, y, w, h] = current;
      current = [x, y, w * step.x, h * step.y];
      return;
    }
    expectNever(step);
  });
  return current;
}

export function transformRects(rects: Array<Rect>, transform: Transform): Array<Rect> {
  return rects.map((rect) => transformRect(rect, transform));
}

// export function sortRectsBySurface(rects: Array<Rect>): void {
//   rects.sort(([, , w1, h1], [, , w2, h2]) => w1 * h1 - w2 * h2);
// }

/**
 * take a list of non-overlaping rects and merge them as much as possible
 */
// export function mergeNeighborsRects(rects: Array<Rect>): Array<Rect> {
//   let result = [...rects];
//   for (let i = 0; i < result.length; i++) {
//     let mergeWith: { index: number; area: number } | null = null as any;
//     const rect = result[i];
//     result.forEach((r, bi) => {
//       if (bi === i) {
//         return;
//       }
//       if (!rectsArePerfectNeighbors(rect, r)) {
//         return;
//       }
//       const area = r[2] * r[3];
//       if (mergeWith === null || mergeWith.area > area) {
//         mergeWith = { index: bi, area };
//       }
//     });
//     if (mergeWith) {
//       const mergeWithRect = result[mergeWith.index];
//       const merged = mergePerfectNeighborsRects(rect, mergeWithRect);
//       result = result.filter((r) => r !== rect && r !== mergeWithRect);
//       result.unshift(merged);
//       // reset loop
//       i = 0;
//     }
//   }
//   return result;
// }

// export function mergePerfectNeighborsRects([x1, y1, w1, h1]: Rect, [x2, y2, w2, h2]: Rect): Rect {
//   // isTop
//   if (w1 === w2 && x1 === x2 && y1 === y2 - h2) {
//     return [x2, y2, w1, h1 + h2];
//   }
//   // isBottom
//   if (w1 === w2 && x1 === x2 && y1 + h1 === y2) {
//     return [x1, y1, w1, h1 + h2];
//   }
//   // isLeft
//   if (h1 === h2 && y1 === y2 && x2 === x1 - w2) {
//     return [x2, y2, w1 + w2, h1];
//   }
//   // isRight
//   if (h1 === h2 && y1 === y2 && y2 === y1 - h2) {
//     return [x1, y1, w1 + w2, h1];
//   }
//   throw new Error('Rects are not perfect neighbors');
// }

// export function rectsPositionEqual(left: Rect, right: Rect): boolean {
//   return left[0] === right[0] && left[1] === right[1];
// }

// export function rectsSizeEqual(left: Rect, right: Rect): boolean {
//   return left[2] === right[2] && left[3] === right[3];
// }

// export function rectIntersectWithOneOf(rect: Rect, rects: Array<Rect>): boolean {
//   return rects.some((r) => rectHasIntersect(r, rect));
// }

// export function rectFilterIntersect(rect: Rect, rects: Array<Rect>): Array<Rect> {
//   return rects.filter((r) => rectHasIntersect(r, rect));
// }
