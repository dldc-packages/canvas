import { Rect } from './Rect';

export class Grid<T> {
  public readonly width: number;
  public readonly height: number;
  public readonly data: Array<T>;

  constructor({ width, height, defaultValue }: { width: number; height: number; defaultValue: T }) {
    this.width = width;
    this.height = height;
    this.data = Array.from<T>({ length: width * height }).fill(defaultValue);
  }

  public get(x: number, y: number): T | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }
    const index = y * this.width + x;
    return this.data[index];
  }

  public set(x: number, y: number, value: T): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      throw new Error('Invalid x / y');
    }
    const index = y * this.width + x;
    this.data[index] = value;
  }

  public setRect([x, y, w, h]: Rect, val: T): void {
    for (let xi = x; xi < x + w; xi++) {
      for (let yi = y; yi < y + h; yi++) {
        this.set(xi, yi, val);
      }
    }
  }

  /**
   * Find Rect of same values using === to compare
   */
  public findRect(x: number, y: number): Rect | null {
    const val = this.get(x, y);
    if (val === null) {
      return null;
    }
    let xi = x;
    let w = 0;
    while (xi < this.width && this.get(xi, y) === val) {
      xi += 1;
      w += 1;
    }
    let yi = y;
    let h = 0;
    while (yi < this.height && this.get(x, yi) === val) {
      yi += 1;
      h += 1;
    }
    return [x, y, w, h];
  }

  public forEach(mapper: (value: T, index: number) => void): void {
    this.data.forEach(mapper);
  }

  public coordsFromIndex(index: number): readonly [x: number, y: number] {
    return [index % this.width, Math.floor(index / this.width)];
  }

  public print(mapper: (v: T) => string): string {
    const vals = this.data.map(mapper);
    const maxWidth = Math.max(...vals.map((v) => v.length));
    return vals.reduce((acc, item, i) => {
      if (i % this.width === 0) {
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
