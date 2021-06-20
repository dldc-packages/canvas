import { Rect } from './Rect';

function randomSequenceOfUnique(intermediateOffset: number, seedBase = 1) {
  // from https://preshing.com/20121224/how-to-generate-a-sequence-of-unique-random-integers/
  let index = permuteQPR(permuteQPR(seedBase) + 0x682f01);

  function permuteQPR(x: number) {
    const prime = 16777199;
    const halfPrime = 8388599;
    if (x >= prime) return x; // The 17 integers out of range are mapped to themselves.

    // squaring can cause exceeding 2^53
    const residue = (x * x) % prime;
    return x <= halfPrime ? residue : prime - residue;
  }

  function getNth(n: number) {
    // >>> ensures conversion to unsigned int
    return permuteQPR(((permuteQPR(n) + intermediateOffset) ^ 0x5bf036) >>> 0);
  }

  return () => {
    const res = getNth(index);
    index++;
    return res;
  };
}

export function randomSequenceOfUniqueColor() {
  const gen = randomSequenceOfUnique(Math.floor(Math.random() * 10000));
  return () => {
    let num = gen().toString(16);
    while (num.length < 6) {
      num = '0' + num;
    }
    return '#' + num;
  };
}

type AnyFn = (...args: Array<any>) => void;

export function throttle<T extends AnyFn>(callback: T, wait: number, immediate = false): T {
  let timeout: null | NodeJS.Timeout = null;
  let initialCall = true;

  return ((...args: Parameters<T>): void => {
    const callNow = immediate && initialCall;
    const next = () => {
      callback(...args);
      timeout = null;
    };

    if (callNow) {
      initialCall = false;
      next();
    }

    if (!timeout) {
      timeout = setTimeout(next, wait);
    }
  }) as any;
}

export interface Size {
  width: number;
  height: number;
}

export function convertDOMRectToRect(rect: DOMRect): Rect {
  return [rect.x, rect.y, rect.width, rect.height];
}

export function getViewportRect(): Rect {
  return [0, 0, window.innerWidth, window.innerHeight];
}

export function filterNotFalse<T>(val: T | false): val is T {
  return val !== false;
}

export function filterNotNull<T>(val: T | null): val is T {
  return val !== null;
}
