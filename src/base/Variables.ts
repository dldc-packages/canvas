/**
 * A value that meant to be commited on update
 */
export interface IVariables<T extends Record<string, any>> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  commit(): boolean; // true if the value has changed
}

export function Variables<T extends Record<string, any>>(
  init: T,
): IVariables<T> {
  let current: T = { ...init };
  let next: T = { ...init };

  return {
    get<K extends keyof T>(key: K) {
      return next[key];
    },
    set<K extends keyof T>(key: K, value: T[K]) {
      next[key] = value;
    },
    commit() {
      if (current !== next) {
        current = { ...next };
        next = { ...next };
        return true;
      }
      return false;
    },
  };
}
