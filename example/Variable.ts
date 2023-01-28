/**
 * A value that meant to be commited on update
 */
export interface IVariable<T> {
  value: T;
  commit(): boolean; // true if the value has changed
}

export const Variable = (() => {
  return { create };

  function create<T>(init: T): IVariable<T> {
    let current: T = init;
    let next: T = init;

    return {
      get value() {
        return next;
      },
      set value(value: T) {
        next = value;
      },
      commit() {
        if (current !== next) {
          current = next;
          return true;
        }
        return false;
      },
    };
  }
})();
