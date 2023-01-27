/**
 * Array witgh some extra methods
 */
export interface IList<T> {
  readonly raw: Array<T>;
  readonly size: number;

  at(index: number): T | undefined;
  push(value: T): void;
  remove(value: T): T | undefined;
  insertAt(index: number, value: T): void;
  removeAt(index: number): void;
  has(value: T): boolean;

  forEach(fn: (value: T, index: number) => void): void;
  map<U>(fn: (value: T, index: number) => U): Array<U>;

  // safe versions of forEach and map (create a copy of the array before iterating)
  forEachSafe(fn: (value: T, index: number) => void): void;
  mapSafe<U>(fn: (value: T, index: number) => U): Array<U>;
}

export const List = (() => {
  return { create };

  function create<T>(init?: Iterable<T>): IList<T> {
    const data: Array<T> = init ? Array.from(init) : [];

    return {
      raw: data,
      get size() {
        return data.length;
      },
      at,
      push,
      insertAt,
      has,
      remove,
      removeAt,
      forEach,
      map,
      forEachSafe,
      mapSafe,
    };

    function at(index: number): T | undefined {
      return data[index];
    }

    function push(value: T): void {
      data.push(value);
    }

    function insertAt(index: number, value: T): void {
      data.splice(index, 0, value);
    }

    function has(value: T): boolean {
      return data.includes(value);
    }

    function remove(value: T): T | undefined {
      const index = data.indexOf(value);
      if (index >= 0) {
        data.splice(index, 1);
        return value;
      }
      return undefined;
    }

    function removeAt(index: number): void {
      data.splice(index, 1);
    }

    function forEach(fn: (value: T, index: number) => void): void {
      data.forEach(fn);
    }

    function map<U>(fn: (value: T, index: number) => U): Array<U> {
      return data.map(fn);
    }

    function forEachSafe(fn: (value: T, index: number) => void): void {
      data.slice().forEach(fn);
    }

    function mapSafe<U>(fn: (value: T, index: number) => U): Array<U> {
      return data.slice().map(fn);
    }
  }
})();
