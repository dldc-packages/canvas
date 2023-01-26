export function toArray<T>(val: T | Array<T> | null): Array<T> {
  if (val === null) {
    return [];
  }
  if (Array.isArray(val)) {
    return val;
  }
  return [val];
}
