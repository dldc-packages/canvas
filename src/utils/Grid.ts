import { Rect } from './Rect';

export interface IGrid<T> {
  readonly width: number;
  readonly height: number;
  readonly data: ReadonlyArray<T>;

  get(x: number, y: number): T | null;
  set(x: number, y: number, value: T): void;
  setRect([x, y, w, h]: Rect, val: T): void;
  /**
   * Find Rect of same values using === to compare
   */
  findRect(x: number, y: number): Rect | null;
  forEach(mapper: (value: T, index: number) => void): void;
  coordsFromIndex(index: number): readonly [x: number, y: number];
  print(mapper: (v: T) => string): string;
}

export interface IGridOptions<T> {
  width: number;
  height: number;
  defaultValue: T;
}

export const Grid = (() => {
  return {
    create,
  };

  function create<T>({ width, height, defaultValue }: IGridOptions<T>): IGrid<T> {
    const data = Array.from<T>({ length: width * height }).fill(defaultValue);

    return {
      data,
      width,
      height,
      get,
      set,
      setRect,
      findRect,
      forEach,
      coordsFromIndex,
      print,
    };

    function get(x: number, y: number): T | null {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return null;
      }
      const index = y * width + x;
      return data[index];
    }

    function set(x: number, y: number, value: T): void {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        throw new Error('Invalid x / y');
      }
      const index = y * width + x;
      data[index] = value;
    }

    function setRect([x, y, w, h]: Rect, val: T): void {
      for (let xi = x; xi < x + w; xi++) {
        for (let yi = y; yi < y + h; yi++) {
          set(xi, yi, val);
        }
      }
    }

    /**
     * Find Rect of same values using === to compare
     */
    function findRect(x: number, y: number): Rect | null {
      const val = get(x, y);
      if (val === null) {
        return null;
      }
      let xi = x;
      let w = 0;
      while (xi < width && get(xi, y) === val) {
        xi += 1;
        w += 1;
      }
      let yi = y;
      let h = 0;
      while (yi < height && get(x, yi) === val) {
        yi += 1;
        h += 1;
      }
      return [x, y, w, h];
    }

    function forEach(mapper: (value: T, index: number) => void): void {
      data.forEach(mapper);
    }

    function coordsFromIndex(index: number): readonly [x: number, y: number] {
      return [index % width, Math.floor(index / width)];
    }

    function print(mapper: (v: T) => string): string {
      const vals = data.map(mapper);
      const maxWidth = Math.max(...vals.map((v) => v.length));
      return vals.reduce((acc, item, i) => {
        if (i % width === 0) {
          acc += '\n';
        }
        if (item === null) {
          acc += ''.padEnd(maxWidth, ' ');
        } else {
          acc += item.padEnd(maxWidth, ' ');
        }
        return acc;
      }, '');
    }
  }
})();
